import { formatDate, formatPaise } from "@/lib/format";
import type { Loan } from "@/lib/types";

export function ApplicantCell({ loan }: { loan: Loan }) {
  const email = typeof loan.borrower === "object" ? loan.borrower.email : "";
  return (
    <div>
      <p className="font-medium text-gray-900">{loan.applicant.fullName}</p>
      <p className="text-xs text-gray-500">{email}</p>
    </div>
  );
}

export function AmountCell({ loan }: { loan: Loan }) {
  return (
    <div className="tabular-nums">
      <p className="font-medium">{formatPaise(loan.principal)}</p>
      <p className="text-xs text-gray-500">
        {loan.tenureDays} days · repay {formatPaise(loan.totalRepayment)}
      </p>
    </div>
  );
}

export const DateCell = ({ value }: { value?: string }) => (
  <span className="whitespace-nowrap text-gray-600">{value ? formatDate(value) : "-"}</span>
);
