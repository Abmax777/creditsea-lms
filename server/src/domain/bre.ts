export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const MIN_AGE = 23;
export const MAX_AGE = 50;
export const MIN_SALARY = 25_000;

export const EMPLOYMENT_MODES = ["SALARIED", "SELF_EMPLOYED", "UNEMPLOYED"] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

export type BreInput = {
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
};

export type BreFailure = { rule: "AGE" | "SALARY" | "PAN" | "EMPLOYMENT"; message: string };

export function ageOn(dob: Date, today = new Date()) {
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const m = today.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < dob.getUTCDate())) age--;
  return age;
}

export function runBre(input: BreInput, today = new Date()): BreFailure[] {
  const failures: BreFailure[] = [];
  const age = ageOn(input.dateOfBirth, today);

  if (age < MIN_AGE || age > MAX_AGE) {
    failures.push({ rule: "AGE", message: `Age must be between ${MIN_AGE} and ${MAX_AGE} (yours: ${age})` });
  }
  if (input.monthlySalary < MIN_SALARY) {
    failures.push({ rule: "SALARY", message: `Monthly salary must be at least ₹${MIN_SALARY.toLocaleString("en-IN")}` });
  }
  if (!PAN_REGEX.test(input.pan)) {
    failures.push({ rule: "PAN", message: "PAN must be in the format ABCDE1234F" });
  }
  if (input.employmentMode === "UNEMPLOYED") {
    failures.push({ rule: "EMPLOYMENT", message: "Unemployed applicants are not eligible" });
  }
  return failures;
}
