import type { Role } from "./roles";
import type { EmploymentMode } from "./rules";

export type User = { id: string; name: string; email: string; role: Role };

export type LoanStatus = "APPLIED" | "SANCTIONED" | "REJECTED" | "DISBURSED" | "CLOSED";

export type StoredFile = { originalName: string; mimeType: string; size: number; uploadedAt: string };

export type Profile = {
  fullName: string;
  pan: string;
  dateOfBirth: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
};

export type Payment = {
  _id: string;
  utr: string;
  amount: number;
  paidOn: string;
  recordedBy?: { name: string };
};

export type Loan = {
  _id: string;
  borrower: { _id: string; name: string; email: string } | string;
  applicant: Profile;
  salarySlip: StoredFile;
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  status: LoanStatus;
  rejectionReason?: string;
  createdAt: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  payments?: Payment[];
};

export type Lead = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  fullName?: string;
  monthlySalary?: number;
  employmentMode?: EmploymentMode;
  stage: "REGISTERED" | "ELIGIBLE" | "SALARY_SLIP_UPLOADED";
};
