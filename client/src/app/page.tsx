import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, readSession } from "@/lib/session";
import { homeFor } from "@/lib/roles";

export default async function Home() {
  const session = await readSession((await cookies()).get(AUTH_COOKIE)?.value);
  redirect(session ? homeFor(session.role) : "/login");
}
