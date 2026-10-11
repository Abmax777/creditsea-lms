import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../../models/User.js";
import { validateBody } from "../../middleware/validate.js";
import { AUTH_COOKIE, authenticate, issueToken } from "../../middleware/auth.js";
import { conflict, notFound, unauthorized } from "../../utils/httpError.js";
import type { Role } from "../../domain/roles.js";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
});

const toPublicUser = (u: { _id: unknown; name: string; email: string; role: string }) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role as Role,
});

router.post("/signup", validateBody(signupSchema), async (req, res) => {
  const { name, email, password } = req.body as z.infer<typeof signupSchema>;
  if (await User.exists({ email })) throw conflict("An account with this email already exists");

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10), role: "BORROWER" });
  issueToken(res, { id: user.id, role: "BORROWER" });
  res.status(201).json({ user: toPublicUser(user) });
});

router.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw unauthorized("Invalid email or password");
  }
  issueToken(res, { id: user.id, role: user.role as Role });
  res.json({ user: toPublicUser(user) });
});

router.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE);
  res.status(204).end();
});

router.get("/me", authenticate, async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw notFound("User not found");
  res.json({ user: toPublicUser(user) });
});

export default router;
