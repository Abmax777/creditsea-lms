"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { Loan } from "@/lib/types";
import { Alert, Button, Empty } from "@/components/ui";
import { DataTable, PageHeader } from "@/components/DataTable";
import { AmountCell, ApplicantCell, DateCell } from "@/components/LoanCells";

export default function DisbursementPage() {
  const { data, error, reload } = useApi<{ loans: Loan[] }>("/ops/disbursement/loans");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function disburse(loan: Loan) {
    if (!confirm(`Release funds to ${loan.applicant.fullName}?`)) return;
    setBusyId(loan._id);
    setActionError(null);
    try {
      await api(`/ops/disbursement/loans/${loan._id}/disburse`, { method: "POST" });
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title="Disbursement" subtitle="Sanctioned loans ready for fund release." count={data?.loans.length} />
      <div className="space-y-4">
        {(error || actionError) && <Alert>{error ?? actionError}</Alert>}
        {data && data.loans.length === 0 && <Empty>No sanctioned loans awaiting disbursement.</Empty>}
        {data && data.loans.length > 0 && (
          <DataTable
            rows={data.loans}
            columns={[
              { header: "Applicant", cell: (l) => <ApplicantCell loan={l} /> },
              { header: "Loan", cell: (l) => <AmountCell loan={l} /> },
              { header: "Sanctioned", cell: (l) => <DateCell value={l.sanctionedAt} /> },
              {
                header: "Action",
                className: "text-right",
                cell: (l) => (
                  <Button onClick={() => disburse(l)} loading={busyId === l._id}>
                    Mark disbursed
                  </Button>
                ),
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
