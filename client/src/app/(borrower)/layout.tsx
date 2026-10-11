import { Header } from "@/components/Header";
import { NavLink } from "@/components/NavLink";

export default function BorrowerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header
        nav={
          <>
            <NavLink href="/apply">Apply</NavLink>
            <NavLink href="/my-loan">My loan</NavLink>
          </>
        }
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
