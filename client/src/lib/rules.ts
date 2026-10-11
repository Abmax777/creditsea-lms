// Mirrors server/src/domain for instant feedback. The server remains the source of truth.

export const INTEREST_RATE = 12;
export const AMOUNT = { min: 50_000, max: 500_000, step: 5_000 };
export const TENURE = { min: 30, max: 365, step: 1 };

export function calculateRepayment(principalPaise: number, tenureDays: number) {
  const interest = Math.round((principalPaise * INTEREST_RATE * tenureDays) / (365 * 100));
  return { interest, totalRepayment: principalPaise + interest };
}

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const EMPLOYMENT_MODES = [
  { value: "SALARIED", label: "Salaried" },
  { value: "SELF_EMPLOYED", label: "Self-employed" },
  { value: "UNEMPLOYED", label: "Unemployed" },
] as const;

export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number]["value"];

