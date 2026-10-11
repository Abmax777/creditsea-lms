import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, readSession } from "@/lib/session";
import { MODULES, homeFor } from "@/lib/roles";

const PUBLIC_PATHS = ["/login", "/signup"];
const BORROWER_PATHS = ["/apply", "/my-loan"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req.cookies.get(AUTH_COOKIE)?.value);
  const redirect = (to: string) => NextResponse.redirect(new URL(to, req.url));

  if (PUBLIC_PATHS.includes(pathname)) {
    return session ? redirect(homeFor(session.role)) : NextResponse.next();
  }
  if (!session) return redirect(`/login?next=${encodeURIComponent(pathname)}`);

  const { role } = session;
  if (pathname === "/" || pathname === "/dashboard") return redirect(homeFor(role));

  if (BORROWER_PATHS.some((p) => pathname.startsWith(p)) && role !== "BORROWER") {
    return redirect(homeFor(role));
  }

  if (pathname.startsWith("/dashboard/")) {
    const mod = MODULES.find((m) => pathname.startsWith(`/dashboard/${m.slug}`));
    if (role === "BORROWER" || (mod && role !== "ADMIN" && mod.role !== role)) {
      return redirect(homeFor(role));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
