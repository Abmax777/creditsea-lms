"use client";

import { useState, type FormEvent } from "react";
import { api, errorMessage } from "@/lib/api";
import type { StoredFile } from "@/lib/types";
import { Alert, Button, Card } from "@/components/ui";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["application/pdf", "image/jpeg", "image/png"];

type Props = { existing: StoredFile | null; onBack: () => void; onDone: () => void };

export function SalarySlipStep({ existing, onBack, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function pick(f: File | undefined) {
    setError(null);
    setFile(null);
    if (!f) return;
    if (!ACCEPT.includes(f.type)) return setError("Only PDF, JPG or PNG files are allowed");
    if (f.size > MAX_BYTES) return setError("File must be 5 MB or smaller");
    setFile(f);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return existing ? onDone() : undefined;
    setLoading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      await api("/borrower/salary-slip", { method: "POST", body });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Upload salary slip</h2>
      <p className="mt-1 text-sm text-gray-500">Your latest salary slip. PDF, JPG or PNG, up to 5 MB.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error && <Alert>{error}</Alert>}
        {existing && !file && (
          <Alert tone="info">
            Uploaded:{" "}
            <a href="/api/borrower/salary-slip" target="_blank" className="font-medium text-brand-600 hover:underline">
              {existing.originalName}
            </a>
            . Choose another file to replace it.
          </Alert>
        )}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-300 px-4 py-10 text-center transition hover:border-brand-500 hover:bg-brand-50">
          <span className="text-sm font-medium text-gray-800">{file ? file.name : "Click to choose a file"}</span>
          <span className="text-xs text-gray-500">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, JPG, PNG · max 5 MB"}
          </span>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
        <div className="flex justify-between">
          <Button type="button" variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" loading={loading} disabled={!file && !existing}>
            {file ? "Upload & continue" : "Continue"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
