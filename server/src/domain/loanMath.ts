export const INTEREST_RATE = 12;
export const MIN_AMOUNT = 50_000;
export const MAX_AMOUNT = 500_000;
export const MIN_TENURE = 30;
export const MAX_TENURE = 365;

// All money values are integer paise to avoid floating point drift.
export function calculateRepayment(principalPaise: number, tenureDays: number, rate = INTEREST_RATE) {
  const interest = Math.round((principalPaise * rate * tenureDays) / (365 * 100));
  return { principal: principalPaise, interest, totalRepayment: principalPaise + interest };
}
