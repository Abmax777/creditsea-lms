import path from "node:path";
import { User } from "../../models/User.js";
import { Loan } from "../../models/Loan.js";
import { Payment } from "../../models/Payment.js";
import { canTransition, type LoanStatus } from "../../domain/loanStatus.js";
import { uploadDir } from "../../middleware/upload.js";
import { badRequest, conflict, notFound } from "../../utils/httpError.js";

export async function listLeads() {
  const applied = await Loan.distinct("borrower");
  const users = await User.find({ role: "BORROWER", _id: { $nin: applied } })
    .sort({ createdAt: -1 })
    .lean();

  return users.map((u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    fullName: u.profile?.fullName,
    monthlySalary: u.profile?.monthlySalary,
    employmentMode: u.profile?.employmentMode,
    stage: u.salarySlip ? "SALARY_SLIP_UPLOADED" : u.profile ? "ELIGIBLE" : "REGISTERED",
  }));
}

export function listLoansByStatus(status: LoanStatus) {
  return Loan.find({ status }).populate("borrower", "name email").sort({ updatedAt: -1 }).lean();
}

async function transition(loanId: string, from: LoanStatus, to: LoanStatus, set: Record<string, unknown>) {
  if (!canTransition(from, to)) throw badRequest(`Cannot move a loan from ${from} to ${to}`);

  // Conditional update on the current status makes the transition atomic and idempotent-safe.
  const loan = await Loan.findOneAndUpdate(
    { _id: loanId, status: from },
    { $set: { status: to, ...set } },
    { returnDocument: "after" },
  );
  if (loan) return loan;

  const existing = await Loan.findById(loanId).select("status");
  if (!existing) throw notFound("Loan not found");
  throw conflict(`Loan is ${existing.status}, expected ${from}`);
}

export const sanctionLoan = (loanId: string, by: string) =>
  transition(loanId, "APPLIED", "SANCTIONED", { sanctionedBy: by, sanctionedAt: new Date() });

export const rejectLoan = (loanId: string, by: string, reason: string) =>
  transition(loanId, "APPLIED", "REJECTED", {
    rejectedBy: by,
    rejectedAt: new Date(),
    rejectionReason: reason,
    isOpen: false,
  });

export const disburseLoan = (loanId: string, by: string) =>
  transition(loanId, "SANCTIONED", "DISBURSED", { disbursedBy: by, disbursedAt: new Date() });

export async function getLoanSalarySlip(loanId: string) {
  const loan = await Loan.findById(loanId).select("salarySlip");
  if (!loan) throw notFound("Loan not found");
  return { filePath: path.join(uploadDir, loan.salarySlip.storedName), file: loan.salarySlip };
}

export function listPayments(loanId: string) {
  return Payment.find({ loan: loanId }).populate("recordedBy", "name").sort({ paidOn: 1 }).lean();
}

type PaymentInput = { utr: string; amount: number; paidOn: Date };

export async function recordPayment(loanId: string, by: string, input: PaymentInput) {
  const loan = await Loan.findById(loanId);
  if (!loan) throw notFound("Loan not found");
  if (loan.status !== "DISBURSED") throw conflict(`Payments can only be recorded on DISBURSED loans (loan is ${loan.status})`);

  const outstanding = loan.totalRepayment - loan.amountPaid;
  if (input.amount > outstanding) {
    throw badRequest(`Amount exceeds outstanding balance of ${outstanding} paise`);
  }
  if (loan.disbursedAt && startOfDay(input.paidOn) < startOfDay(loan.disbursedAt)) {
    throw badRequest("Payment date cannot be before the disbursement date");
  }
  if (await Payment.exists({ utr: input.utr })) throw conflict("A payment with this UTR already exists");

  // Increment only if the balance still covers this amount, so concurrent payments cannot overpay.
  const updated = await Loan.findOneAndUpdate(
    { _id: loanId, status: "DISBURSED", amountPaid: { $lte: loan.totalRepayment - input.amount } },
    { $inc: { amountPaid: input.amount } },
    { returnDocument: "after" },
  );
  if (!updated) throw conflict("Loan balance changed, please refresh and try again");

  try {
    await Payment.create({ loan: loanId, recordedBy: by, ...input });
  } catch (err) {
    await Loan.updateOne({ _id: loanId }, { $inc: { amountPaid: -input.amount } });
    if ((err as { code?: number }).code === 11000) throw conflict("A payment with this UTR already exists");
    throw err;
  }

  if (updated.amountPaid === updated.totalRepayment) {
    return transition(loanId, "DISBURSED", "CLOSED", { closedAt: new Date(), isOpen: false });
  }
  return updated;
}

function startOfDay(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}
