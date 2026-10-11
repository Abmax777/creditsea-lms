import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { NavLink } from "@/components/NavLink";
import { AUTH_COOKIE, readSession } from "@/lib/session";
import { modulesFor } from "@/lib/roles";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readSession((await cookies()).get(AUTH_COOKIE)?.value);
  if (!session || session.role === "BORROWER") redirect("/");

  return (
    <>
      <Header
        nav={modulesFor(session.role).map((m) => (
          <NavLink key={m.slug} href={`/dashboard/${m.slug}`}>
            {m.label}
          </NavLink>
        ))}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
