import { jwtVerify } from "jose";
import type { Role } from "./roles";

export const AUTH_COOKIE = "lms_token";

export type Session = { userId: string; role: Role };

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: String(payload.sub), role: payload.role as Role };
  } catch {
    return null;
  }
}
