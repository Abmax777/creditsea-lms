"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatPaise } from "@/lib/format";
import { AMOUNT, INTEREST_RATE, TENURE, calculateRepayment } from "@/lib/rules";
import { Alert, Button, Card, Stat } from "@/components/ui";

function Slider(props: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-700">{props.label}</span>
        <span className="text-lg font-semibold tabular-nums">{props.display}</span>
      </div>
      <input
        type="range"
        className="mt-3 w-full"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>{props.minLabel}</span>
        <span>{props.maxLabel}</span>
      </div>
    </div>
  );
}

export function LoanStep({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [amount, setAmount] = useState(100_000);
  const [tenure, setTenure] = useState(180);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const principal = amount * 100;
  const { interest, totalRepayment } = calculateRepayment(principal, tenure);

  async function apply() {
    setLoading(true);
    setError(null);
    try {
      await api("/borrower/loans", { method: "POST", json: { principal, tenureDays: tenure } });
      router.push("/my-loan");
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-5">
      <Card className="space-y-8 md:col-span-3">
        <h2 className="text-lg font-semibold">Configure your loan</h2>
        <Slider
          label="Loan amount"
          value={amount}
          display={formatPaise(principal)}
          {...AMOUNT}
          minLabel="₹50K"
          maxLabel="₹5L"
          onChange={setAmount}
        />
        <Slider
          label="Tenure"
          value={tenure}
          display={`${tenure} days`}
          {...TENURE}
          minLabel="30 days"
          maxLabel="365 days"
          onChange={setTenure}
        />
      </Card>
      <Card className="flex flex-col md:col-span-2">
        <h2 className="text-sm font-medium text-gray-500">Repayment summary</h2>
        <div className="mt-3 divide-y divide-gray-100">
          <Stat label="Principal" value={formatPaise(principal)} />
          <Stat label="Interest rate" value={`${INTEREST_RATE}% p.a.`} />
          <Stat label="Tenure" value={`${tenure} days`} />
          <Stat label="Simple interest" value={formatPaise(interest)} />
          <Stat label="Total repayment" value={formatPaise(totalRepayment)} strong />
        </div>
        <p className="mt-3 text-xs text-gray-400">SI = (P × R × T) / (365 × 100), T in days</p>
        {error && (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        )}
        <div className="mt-auto flex gap-2 pt-6">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button className="flex-1" onClick={apply} loading={loading}>
            Apply
          </Button>
        </div>
      </Card>
    </div>
  );
}
