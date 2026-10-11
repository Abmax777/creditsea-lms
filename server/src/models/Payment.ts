import { Schema, model, Types } from "mongoose";

const paymentSchema = new Schema(
  {
    loan: { type: Types.ObjectId, ref: "Loan", required: true, index: true },
    utr: { type: String, required: true, unique: true, uppercase: true, trim: true },
    amount: { type: Number, required: true },
    paidOn: { type: Date, required: true },
    recordedBy: { type: Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Payment = model("Payment", paymentSchema);
