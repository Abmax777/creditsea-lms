"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </Link>
  );
}
