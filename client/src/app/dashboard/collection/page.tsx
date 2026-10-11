"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { formatDate, formatPaise, todayIso } from "@/lib/format";
import type { Loan, Payment } from "@/lib/types";
import { Alert, Button, Empty, Field, Input, Stat } from "@/components/ui";
import { DataTable, PageHeader } from "@/components/DataTable";
import { ApplicantCell, DateCell } from "@/components/LoanCells";
import { Modal } from "@/components/Modal";

export default function CollectionPage() {
  const { data, error, reload } = useApi<{ loans: Loan[] }>("/ops/collection/loans");
  const [selected, setSelected] = useState<Loan | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Collection" subtitle="Active loans. Record repayments; loans close automatically when fully paid." count={data?.loans.length} />
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        {data && data.loans.length === 0 && <Empty>No active loans.</Empty>}
        {data && data.loans.length > 0 && (
          <DataTable
            rows={data.loans}
            columns={[
              { header: "Borrower", cell: (l) => <ApplicantCell loan={l} /> },
              { header: "Total repayment", cell: (l) => <span className="tabular-nums">{formatPaise(l.totalRepayment)}</span> },
              { header: "Paid", cell: (l) => <span className="tabular-nums">{formatPaise(l.amountPaid)}</span> },
              {
                header: "Outstanding",
                cell: (l) => <span className="font-semibold tabular-nums">{formatPaise(l.totalRepayment - l.amountPaid)}</span>,
              },
              { header: "Disbursed", cell: (l) => <DateCell value={l.disbursedAt} /> },
              {
                header: "Action",
                className: "text-right",
                cell: (l) => <Button onClick={() => { setNotice(null); setSelected(l); }}>Record payment</Button>,
              },
            ]}
          />
        )}
      </div>
      {selected && (
        <PaymentModal
          loan={selected}
          onClose={() => setSelected(null)}
          onDone={async (updated) => {
            setSelected(null);
            setNotice(
              updated.status === "CLOSED"
                ? `${updated.applicant.fullName}'s loan is fully repaid and has been closed.`
                : `Payment recorded. Outstanding: ${formatPaise(updated.totalRepayment - updated.amountPaid)}.`,
            );
            await reload();
          }}
        />
      )}
    </>
  );
}

function PaymentModal({ loan, onClose, onDone }: { loan: Loan; onClose: () => void; onDone: (loan: Loan) => void }) {
  const outstanding = loan.totalRepayment - loan.amountPaid;
  const history = useApi<{ payments: Payment[] }>(`/ops/collection/loans/${loan._id}/payments`);
  const [form, setForm] = useState({ utr: "", amount: (outstanding / 100).toFixed(2), paidOn: todayIso() });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const amountPaise = Math.round(Number(form.amount) * 100);
  const amountError =
    form.amount && (amountPaise <= 0 || amountPaise > outstanding) ? `Enter between ₹0.01 and ${formatPaise(outstanding)}` : undefined;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { loan: updated } = await api<{ loan: Loan }>(`/ops/collection/loans/${loan._id}/payments`, {
        method: "POST",
        json: { utr: form.utr, amount: amountPaise, paidOn: form.paidOn },
      });
      onDone(updated);
    } catch (err) {
      const details = err instanceof ApiError ? (err.details as Record<string, string[]> | undefined) : undefined;
      setError(details ? Object.values(details).flat().join(". ") : errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Modal title={`Payment · ${loan.applicant.fullName}`} onClose={onClose}>
      <div className="mb-4 divide-y divide-gray-100 rounded-lg bg-gray-50 px-4 py-2">
        <Stat label="Total repayment" value={formatPaise(loan.totalRepayment)} />
        <Stat label="Paid so far" value={formatPaise(loan.amountPaid)} />
        <Stat label="Outstanding" value={formatPaise(outstanding)} strong />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="UTR number" hint="12–22 letters or digits, must be unique">
          <Input
            value={form.utr}
            onChange={(e) => setForm({ ...form, utr: e.target.value.toUpperCase() })}
            required
            pattern="[A-Za-z0-9]{12,22}"
            className="font-mono uppercase"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹)" error={amountError}>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={outstanding / 100}
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </Field>
          <Field label="Payment date">
            <Input
              type="date"
              value={form.paidOn}
              max={todayIso()}
              min={loan.disbursedAt?.slice(0, 10)}
              onChange={(e) => setForm({ ...form, paidOn: e.target.value })}
              required
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!!amountError}>
            Record payment
          </Button>
        </div>
      </form>

      {history.data && history.data.payments.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700">Previous payments</h3>
          <ul className="mt-2 divide-y divide-gray-100 text-sm">
            {history.data.payments.map((p) => (
              <li key={p._id} className="flex justify-between gap-3 py-2">
                <span className="text-gray-600">
                  {formatDate(p.paidOn)} · <span className="font-mono text-xs">{p.utr}</span>
                </span>
                <span className="tabular-nums">{formatPaise(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
