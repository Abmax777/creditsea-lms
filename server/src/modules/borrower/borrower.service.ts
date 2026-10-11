import fs from "node:fs/promises";
import path from "node:path";
import { User } from "../../models/User.js";
import { Loan } from "../../models/Loan.js";
import { Payment } from "../../models/Payment.js";
import { runBre, type BreInput } from "../../domain/bre.js";
import { calculateRepayment, INTEREST_RATE } from "../../domain/loanMath.js";
import { uploadDir } from "../../middleware/upload.js";
import { conflict, notFound, unprocessable } from "../../utils/httpError.js";

async function getBorrower(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw notFound("User not found");
  return user;
}

async function assertNoOpenLoan(userId: string) {
  if (await Loan.exists({ borrower: userId, isOpen: true })) {
    throw conflict("You already have an active loan application");
  }
}

export async function getApplicationState(userId: string) {
  const user = await getBorrower(userId);
  return { profile: user.profile ?? null, salarySlip: user.salarySlip ?? null };
}

export async function submitProfile(userId: string, input: BreInput & { fullName: string }) {
  const failures = runBre(input);
  if (failures.length) throw unprocessable("You are not eligible for a loan", { failures });

  await assertNoOpenLoan(userId);
  const user = await getBorrower(userId);
  user.set("profile", { ...input, breCheckedAt: new Date() });
  await user.save();
  return user.profile;
}

export async function saveSalarySlip(userId: string, file: Express.Multer.File) {
  const user = await getBorrower(userId);
  if (!user.profile) {
    await fs.unlink(file.path).catch(() => {});
    throw conflict("Complete the eligibility check before uploading a salary slip");
  }
  user.set("salarySlip", {
    storedName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  });
  await user.save();
  return user.salarySlip;
}

export async function getSalarySlipPath(userId: string) {
  const user = await getBorrower(userId);
  if (!user.salarySlip) throw notFound("No salary slip uploaded");
  return { filePath: path.join(uploadDir, user.salarySlip.storedName), file: user.salarySlip };
}

export async function applyForLoan(userId: string, principal: number, tenureDays: number) {
  const user = await getBorrower(userId);
  if (!user.profile) throw conflict("Complete the eligibility check first");
  if (!user.salarySlip) throw conflict("Upload your salary slip first");
  await assertNoOpenLoan(userId);

  // Re-run BRE at apply time: age can change between profile submission and application.
  const failures = runBre(user.profile as BreInput);
  if (failures.length) throw unprocessable("You are no longer eligible for a loan", { failures });

  const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = user.profile;
  const { interest, totalRepayment } = calculateRepayment(principal, tenureDays);

  try {
    return await Loan.create({
      borrower: user._id,
      applicant: { fullName, pan, dateOfBirth, monthlySalary, employmentMode },
      salarySlip: user.salarySlip,
      principal,
      tenureDays,
      interestRate: INTEREST_RATE,
      interest,
      totalRepayment,
    });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) throw conflict("You already have an active loan application");
    throw err;
  }
}

export async function listMyLoans(userId: string) {
  const loans = await Loan.find({ borrower: userId }).sort({ createdAt: -1 }).lean();
  const payments = await Payment.find({ loan: { $in: loans.map((l) => l._id) } })
    .sort({ paidOn: 1 })
    .lean();
  return loans.map((loan) => ({
    ...loan,
    payments: payments.filter((p) => p.loan.equals(loan._id)),
  }));
}
