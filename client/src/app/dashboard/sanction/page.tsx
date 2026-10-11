"use client";

import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { EMPLOYMENT_MODES } from "@/lib/rules";
import type { Loan } from "@/lib/types";
import { Alert, Button, Empty, Field } from "@/components/ui";
import { DataTable, PageHeader } from "@/components/DataTable";
import { AmountCell, ApplicantCell, DateCell } from "@/components/LoanCells";
import { Modal } from "@/components/Modal";

export default function SanctionPage() {
  const { data, error, reload } = useApi<{ loans: Loan[] }>("/ops/sanction/loans");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Loan | null>(null);

  async function approve(loan: Loan) {
    setBusyId(loan._id);
    setActionError(null);
    try {
      await api(`/ops/sanction/loans/${loan._id}/approve`, { method: "POST" });
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Sanction" subtitle="Review applied loans and approve or reject them." count={data?.loans.length} />
      <div className="space-y-4">
        {(error || actionError) && <Alert>{error ?? actionError}</Alert>}
        {data && data.loans.length === 0 && <Empty>No applications waiting for review.</Empty>}
        {data && data.loans.length > 0 && (
          <DataTable
            rows={data.loans}
            columns={[
              { header: "Applicant", cell: (l) => <ApplicantCell loan={l} /> },
              { header: "Loan", cell: (l) => <AmountCell loan={l} /> },
              {
                header: "Profile",
                cell: (l) => (
                  <div className="text-xs text-gray-600">
                    <p className="font-mono">{l.applicant.pan}</p>
                    <p>
                      {EMPLOYMENT_MODES.find((m) => m.value === l.applicant.employmentMode)?.label} · ₹
                      {l.applicant.monthlySalary.toLocaleString("en-IN")}/mo
                    </p>
                    <a
                      href={`/api/ops/sanction/loans/${l._id}/salary-slip`}
                      target="_blank"
                      className="font-medium text-brand-600 hover:underline"
                    >
                      View salary slip
                    </a>
                  </div>
                ),
              },
              { header: "Applied", cell: (l) => <DateCell value={l.createdAt} /> },
              {
                header: "Actions",
                className: "text-right",
                cell: (l) => (
                  <div className="flex justify-end gap-2">
                    <Button variant="danger" onClick={() => setRejecting(l)} disabled={busyId === l._id}>
                      Reject
                    </Button>
                    <Button onClick={() => approve(l)} loading={busyId === l._id}>
                      Approve
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
      {rejecting && (
        <RejectModal
          loan={rejecting}
          onClose={() => setRejecting(null)}
          onDone={async () => {
            setRejecting(null);
            await reload();
          }}
        />
      )}
    </>
  );
}

function RejectModal({ loan, onClose, onDone }: { loan: Loan; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api(`/ops/sanction/loans/${loan._id}/reject`, { method: "POST", json: { reason } });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Modal title={`Reject ${loan.applicant.fullName}'s loan`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Field label="Reason" hint="Shared with the borrower. Minimum 5 characters.">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={5}
            maxLength={500}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={loading}>
            Reject loan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
