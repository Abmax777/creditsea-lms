import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import * as service from "./ops.service.js";

const router = Router();
router.use(authenticate);

const rejectSchema = z.object({ reason: z.string().trim().min(5).max(500) });

const paymentSchema = z.object({
  utr: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{12,22}$/, "UTR must be 12-22 letters or digits"),
  amount: z.number().int().positive(),
  paidOn: z.iso
    .date()
    .transform((d) => new Date(d))
    .refine((d) => d.getTime() <= Date.now(), "Payment date cannot be in the future"),
});

router.get("/sales/leads", authorize("SALES", "ADMIN"), async (_req, res) => {
  res.json({ leads: await service.listLeads() });
});

router.get("/sanction/loans", authorize("SANCTION", "ADMIN"), async (_req, res) => {
  res.json({ loans: await service.listLoansByStatus("APPLIED") });
});

router.get("/sanction/loans/:id/salary-slip", authorize("SANCTION", "ADMIN"), async (req, res) => {
  const { filePath, file } = await service.getLoanSalarySlip(req.params.id as string);
  res.type(file.mimeType).sendFile(filePath);
});

router.post("/sanction/loans/:id/approve", authorize("SANCTION", "ADMIN"), async (req, res) => {
  res.json({ loan: await service.sanctionLoan(req.params.id as string, req.user!.id) });
});

router.post("/sanction/loans/:id/reject", authorize("SANCTION", "ADMIN"), validateBody(rejectSchema), async (req, res) => {
  res.json({ loan: await service.rejectLoan(req.params.id as string, req.user!.id, req.body.reason) });
});

router.get("/disbursement/loans", authorize("DISBURSEMENT", "ADMIN"), async (_req, res) => {
  res.json({ loans: await service.listLoansByStatus("SANCTIONED") });
});

router.post("/disbursement/loans/:id/disburse", authorize("DISBURSEMENT", "ADMIN"), async (req, res) => {
  res.json({ loan: await service.disburseLoan(req.params.id as string, req.user!.id) });
});

router.get("/collection/loans", authorize("COLLECTION", "ADMIN"), async (_req, res) => {
  res.json({ loans: await service.listLoansByStatus("DISBURSED") });
});

router.get("/collection/loans/:id/payments", authorize("COLLECTION", "ADMIN"), async (req, res) => {
  res.json({ payments: await service.listPayments(req.params.id as string) });
});

router.post("/collection/loans/:id/payments", authorize("COLLECTION", "ADMIN"), validateBody(paymentSchema), async (req, res) => {
  res.status(201).json({ loan: await service.recordPayment(req.params.id as string, req.user!.id, req.body) });
});

export default router;
