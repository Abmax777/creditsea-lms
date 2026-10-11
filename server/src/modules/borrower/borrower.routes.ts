import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { salarySlipUpload } from "../../middleware/upload.js";
import { EMPLOYMENT_MODES } from "../../domain/bre.js";
import { MAX_AMOUNT, MAX_TENURE, MIN_AMOUNT, MIN_TENURE } from "../../domain/loanMath.js";
import { badRequest } from "../../utils/httpError.js";
import * as service from "./borrower.service.js";

const router = Router();
router.use(authenticate, authorize("BORROWER"));

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  pan: z.string().trim().toUpperCase(),
  dateOfBirth: z.iso.date().transform((d) => new Date(d)),
  monthlySalary: z.number().nonnegative(),
  employmentMode: z.enum(EMPLOYMENT_MODES),
});

const applySchema = z.object({
  principal: z
    .number()
    .int()
    .min(MIN_AMOUNT * 100)
    .max(MAX_AMOUNT * 100),
  tenureDays: z.number().int().min(MIN_TENURE).max(MAX_TENURE),
});

router.get("/application", async (req, res) => {
  res.json(await service.getApplicationState(req.user!.id));
});

router.put("/profile", validateBody(profileSchema), async (req, res) => {
  res.json({ profile: await service.submitProfile(req.user!.id, req.body) });
});

router.post("/salary-slip", salarySlipUpload, async (req, res) => {
  if (!req.file) throw badRequest("A file is required");
  res.status(201).json({ salarySlip: await service.saveSalarySlip(req.user!.id, req.file) });
});

router.get("/salary-slip", async (req, res) => {
  const { filePath, file } = await service.getSalarySlipPath(req.user!.id);
  res.type(file.mimeType).sendFile(filePath);
});

router.post("/loans", validateBody(applySchema), async (req, res) => {
  const { principal, tenureDays } = req.body as z.infer<typeof applySchema>;
  res.status(201).json({ loan: await service.applyForLoan(req.user!.id, principal, tenureDays) });
});

router.get("/loans", async (req, res) => {
  res.json({ loans: await service.listMyLoans(req.user!.id) });
});

export default router;
