"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import type { User } from "@/lib/types";
import type { ReactNode } from "react";

export function Header({ nav }: { nav?: ReactNode }) {
  const router = useRouter();
  const { data } = useApi<{ user: User }>("/auth/me");

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:h-14 sm:flex-nowrap sm:py-0">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="grid size-7 place-items-center rounded-md bg-brand-600 text-xs font-bold text-white">L</span>
          <span>LendFlow</span>
        </Link>
        <nav className="order-last -mx-1 flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto sm:flex-1">{nav}</nav>
        {data && (
          <div className="hidden text-right text-xs leading-tight sm:block">
            <p className="font-medium text-gray-900">{data.user.name}</p>
            <p className="text-gray-500">{data.user.role}</p>
          </div>
        )}
        <button onClick={logout} className="ml-auto rounded-lg sm:ml-0 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
          Log out
        </button>
      </div>
    </header>
  );
}
