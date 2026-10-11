"use client";

import Link from "next/link";
import { useState } from "react";
import { useApi } from "@/lib/useApi";
import type { Loan, Profile, StoredFile } from "@/lib/types";
import { Alert, Card } from "@/components/ui";
import { Stepper } from "./Stepper";
import { DetailsStep } from "./DetailsStep";
import { SalarySlipStep } from "./SalarySlipStep";
import { LoanStep } from "./LoanStep";

type ApplicationState = { profile: Profile | null; salarySlip: StoredFile | null };

const OPEN = ["APPLIED", "SANCTIONED", "DISBURSED"];

export default function ApplyPage() {
  const app = useApi<ApplicationState>("/borrower/application");
  const loans = useApi<{ loans: Loan[] }>("/borrower/loans");
  const [chosenStep, setStep] = useState<1 | 2 | 3 | null>(null);

  if (app.error || loans.error) return <Alert>{app.error ?? loans.error}</Alert>;
  if (!app.data || !loans.data) return <p className="text-sm text-gray-500">Loading…</p>;

  const step = chosenStep ?? (!app.data.profile ? 1 : !app.data.salarySlip ? 2 : 3);

  const openLoan = loans.data.loans.find((l) => OPEN.includes(l.status));
  if (openLoan) {
    return (
      <Card>
        <h1 className="text-lg font-semibold">You have an active loan</h1>
        <p className="mt-1 text-sm text-gray-600">
          You can apply for a new loan once your current one is closed.{" "}
          <Link href="/my-loan" className="font-medium text-brand-600 hover:underline">
            View my loan
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Apply for a personal loan</h1>
        <p className="mt-1 text-sm text-gray-500">Three quick steps. Your details are checked instantly.</p>
      </div>
      <Stepper current={step} />
      {step === 1 && (
        <DetailsStep
          initial={app.data.profile}
          onDone={async () => {
            await app.reload();
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <SalarySlipStep
          existing={app.data.salarySlip}
          onBack={() => setStep(1)}
          onDone={async () => {
            await app.reload();
            setStep(3);
          }}
        />
      )}
      {step === 3 && <LoanStep onBack={() => setStep(2)} />}
    </div>
  );
}
