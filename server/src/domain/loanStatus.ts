import type { Role } from "./roles.js";

export const LOAN_STATUSES = ["APPLIED", "SANCTIONED", "REJECTED", "DISBURSED", "CLOSED"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

type Transition = { from: LoanStatus; to: LoanStatus; role: Role | "SYSTEM" };

export const TRANSITIONS: Transition[] = [
  { from: "APPLIED", to: "SANCTIONED", role: "SANCTION" },
  { from: "APPLIED", to: "REJECTED", role: "SANCTION" },
  { from: "SANCTIONED", to: "DISBURSED", role: "DISBURSEMENT" },
  { from: "DISBURSED", to: "CLOSED", role: "SYSTEM" },
];

export function canTransition(from: LoanStatus, to: LoanStatus) {
  return TRANSITIONS.some((t) => t.from === from && t.to === to);
}
