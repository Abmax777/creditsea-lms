import { Schema, model, Types } from "mongoose";
import { LOAN_STATUSES } from "../domain/loanStatus.js";
import { EMPLOYMENT_MODES } from "../domain/bre.js";
import { fileSchema } from "./User.js";

const applicantSchema = new Schema(
  {
    fullName: { type: String, required: true },
    pan: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: { type: String, enum: EMPLOYMENT_MODES, required: true },
  },
  { _id: false },
);

const loanSchema = new Schema(
  {
    borrower: { type: Types.ObjectId, ref: "User", required: true },
    applicant: { type: applicantSchema, required: true },
    salarySlip: { type: fileSchema, required: true },

    principal: { type: Number, required: true },
    tenureDays: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    interest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    amountPaid: { type: Number, required: true, default: 0 },

    status: { type: String, enum: LOAN_STATUSES, required: true, default: "APPLIED", index: true },
    isOpen: { type: Boolean, required: true, default: true },
    rejectionReason: String,

    sanctionedBy: { type: Types.ObjectId, ref: "User" },
    sanctionedAt: Date,
    rejectedBy: { type: Types.ObjectId, ref: "User" },
    rejectedAt: Date,
    disbursedBy: { type: Types.ObjectId, ref: "User" },
    disbursedAt: Date,
    closedAt: Date,
  },
  { timestamps: true },
);

// A borrower may hold at most one open (APPLIED / SANCTIONED / DISBURSED) loan.
loanSchema.index({ borrower: 1 }, { name: "one_open_loan_per_borrower", unique: true, partialFilterExpression: { isOpen: true } });
loanSchema.index({ borrower: 1, createdAt: -1 });

export const Loan = model("Loan", loanSchema);
