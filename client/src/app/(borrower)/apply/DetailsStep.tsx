"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError, errorMessage } from "@/lib/api";
import { EMPLOYMENT_MODES, PAN_REGEX, type EmploymentMode } from "@/lib/rules";
import type { Profile } from "@/lib/types";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";

type BreFailure = { rule: string; message: string };

export function DetailsStep({ initial, onDone }: { initial: Profile | null; onDone: () => void }) {
  const [form, setForm] = useState({
    fullName: initial?.fullName ?? "",
    pan: initial?.pan ?? "",
    dateOfBirth: initial?.dateOfBirth.slice(0, 10) ?? "",
    monthlySalary: initial ? String(initial.monthlySalary) : "",
    employmentMode: (initial?.employmentMode ?? "SALARIED") as EmploymentMode,
  });
  const [failures, setFailures] = useState<BreFailure[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: key === "pan" ? e.target.value.toUpperCase() : e.target.value }));

  const panInvalid = form.pan.length === 10 && !PAN_REGEX.test(form.pan);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFailures([]);
    setError(null);
    try {
      await api("/borrower/profile", {
        method: "PUT",
        json: { ...form, monthlySalary: Number(form.monthlySalary) },
      });
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFailures((err.details as { failures: BreFailure[] }).failures);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Personal details</h2>
      <p className="mt-1 text-sm text-gray-500">We use these to check your eligibility.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {failures.length > 0 && (
          <Alert title="Sorry, you are not eligible for a loan">
            <ul className="list-disc space-y-0.5 pl-5">
              {failures.map((f) => (
                <li key={f.rule}>{f.message}</li>
              ))}
            </ul>
          </Alert>
        )}
        {error && <Alert>{error}</Alert>}
        <Field label="Full name (as on PAN)">
          <Input value={form.fullName} onChange={set("fullName")} required minLength={2} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="PAN" error={panInvalid ? "Format should be ABCDE1234F" : undefined}>
            <Input value={form.pan} onChange={set("pan")} required maxLength={10} placeholder="ABCDE1234F" className="uppercase" />
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} required />
          </Field>
          <Field label="Monthly salary (₹)">
            <Input type="number" min={0} step={1} value={form.monthlySalary} onChange={set("monthlySalary")} required />
          </Field>
          <Field label="Employment mode">
            <Select value={form.employmentMode} onChange={set("employmentMode")}>
              {EMPLOYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="flex justify-end">
          <Button type="submit" loading={loading} disabled={panInvalid}>
            Check eligibility & continue
          </Button>
        </div>
      </form>
    </Card>
  );
}
