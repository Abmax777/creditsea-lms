export type Role = "ADMIN" | "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION" | "BORROWER";

export const MODULES = [
  { slug: "sales", label: "Sales", role: "SALES" },
  { slug: "sanction", label: "Sanction", role: "SANCTION" },
  { slug: "disbursement", label: "Disbursement", role: "DISBURSEMENT" },
  { slug: "collection", label: "Collection", role: "COLLECTION" },
] as const;

export type ModuleSlug = (typeof MODULES)[number]["slug"];

export function modulesFor(role: Role) {
  return MODULES.filter((m) => role === "ADMIN" || m.role === role);
}

export function homeFor(role: Role) {
  if (role === "BORROWER") return "/apply";
  return `/dashboard/${modulesFor(role)[0].slug}`;
}
