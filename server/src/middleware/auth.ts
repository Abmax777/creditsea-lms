import type { RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ROLES, type Role } from "../domain/roles.js";
import { forbidden, unauthorized } from "../utils/httpError.js";

export const AUTH_COOKIE = "lms_token";

export type AuthUser = { id: string; role: Role };

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function issueToken(res: Response, user: AuthUser) {
  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  });
  return token;
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = req.cookies?.[AUTH_COOKIE] ?? (header?.startsWith("Bearer ") ? header.slice(7) : undefined);
  if (!token) return next(unauthorized());

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (!payload.sub || !ROLES.includes(payload.role)) return next(unauthorized("Invalid token"));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
};

export const authorize =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (allowed.includes(req.user.role)) return next();
    next(forbidden());
  };
