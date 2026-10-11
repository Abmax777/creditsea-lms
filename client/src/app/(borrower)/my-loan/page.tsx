"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";
import { formatDate, formatPaise } from "@/lib/format";
import type { Loan } from "@/lib/types";
import { Alert, Card, Empty, Stat, StatusBadge } from "@/components/ui";

const STATUS_COPY: Record<Loan["status"], string> = {
  APPLIED: "Your application is under review.",
  SANCTIONED: "Approved. Funds will be disbursed shortly.",
  REJECTED: "Your application was not approved.",
  DISBURSED: "Funds have been disbursed. Repay before the end of your tenure.",
  CLOSED: "Fully repaid. This loan is closed.",
};

export default function MyLoanPage() {
  const { data, error } = useApi<{ loans: Loan[] }>("/borrower/loans");

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <p className="text-sm text-gray-500">Loading…</p>;

  if (data.loans.length === 0) {
    return (
      <Empty>
        No loans yet.{" "}
        <Link href="/apply" className="font-medium text-brand-600 hover:underline">
          Apply now
        </Link>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My loans</h1>
      {data.loans.map((loan) => {
        const outstanding = loan.totalRepayment - loan.amountPaid;
        const progress = Math.round((loan.amountPaid / loan.totalRepayment) * 100);
        return (
          <Card key={loan._id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-2xl font-semibold tabular-nums">{formatPaise(loan.principal)}</p>
                <p className="text-sm text-gray-500">
                  {loan.tenureDays} days · applied {formatDate(loan.createdAt)}
                </p>
              </div>
              <StatusBadge status={loan.status} />
            </div>
            <p className="mt-4 text-sm text-gray-700">{STATUS_COPY[loan.status]}</p>
            {loan.rejectionReason && <p className="mt-1 text-sm text-red-700">Reason: {loan.rejectionReason}</p>}

            <div className="mt-4 divide-y divide-gray-100">
              <Stat label="Interest (12% p.a.)" value={formatPaise(loan.interest)} />
              <Stat label="Total repayment" value={formatPaise(loan.totalRepayment)} />
              {(loan.status === "DISBURSED" || loan.status === "CLOSED") && (
                <>
                  <Stat label="Paid" value={formatPaise(loan.amountPaid)} />
                  <Stat label="Outstanding" value={formatPaise(outstanding)} strong />
                </>
              )}
            </div>

            {(loan.status === "DISBURSED" || loan.status === "CLOSED") && (
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-brand-500" style={{ width: `${progress}%` }} />
              </div>
            )}

            {loan.payments && loan.payments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700">Payments</h3>
                <ul className="mt-2 divide-y divide-gray-100 text-sm">
                  {loan.payments.map((p) => (
                    <li key={p._id} className="flex justify-between gap-4 py-2">
                      <span className="text-gray-600">
                        {formatDate(p.paidOn)} · <span className="font-mono text-xs">{p.utr}</span>
                      </span>
                      <span className="tabular-nums">{formatPaise(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
