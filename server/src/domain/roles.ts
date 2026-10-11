export const ROLES = ["ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION", "BORROWER"] as const;
export type Role = (typeof ROLES)[number];
