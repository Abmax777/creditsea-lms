"use client";

import { useApi } from "@/lib/useApi";
import { formatDate } from "@/lib/format";
import { EMPLOYMENT_MODES } from "@/lib/rules";
import type { Lead } from "@/lib/types";
import { Alert, Empty } from "@/components/ui";
import { DataTable, PageHeader } from "@/components/DataTable";

const STAGES: Record<Lead["stage"], { label: string; className: string }> = {
  REGISTERED: { label: "Registered", className: "bg-gray-100 text-gray-700" },
  ELIGIBLE: { label: "Eligibility passed", className: "bg-sky-50 text-sky-800" },
  SALARY_SLIP_UPLOADED: { label: "Slip uploaded", className: "bg-brand-50 text-brand-700" },
};

export default function SalesPage() {
  const { data, error } = useApi<{ leads: Lead[] }>("/ops/sales/leads");

  return (
    <>
      <PageHeader title="Sales · Leads" subtitle="Registered users who haven't applied for a loan yet." count={data?.leads.length} />
      {error && <Alert>{error}</Alert>}
      {data && data.leads.length === 0 && <Empty>No open leads.</Empty>}
      {data && data.leads.length > 0 && (
        <DataTable
          rows={data.leads}
          columns={[
            {
              header: "User",
              cell: (l) => (
                <div>
                  <p className="font-medium text-gray-900">{l.fullName ?? l.name}</p>
                  <p className="text-xs text-gray-500">{l.email}</p>
                </div>
              ),
            },
            {
              header: "Stage",
              cell: (l) => (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGES[l.stage].className}`}>
                  {STAGES[l.stage].label}
                </span>
              ),
            },
            {
              header: "Employment",
              cell: (l) => EMPLOYMENT_MODES.find((m) => m.value === l.employmentMode)?.label ?? "-",
            },
            {
              header: "Monthly salary",
              cell: (l) => (l.monthlySalary !== undefined ? `₹${l.monthlySalary.toLocaleString("en-IN")}` : "-"),
            },
            { header: "Registered", cell: (l) => formatDate(l.createdAt) },
          ]}
        />
      )}
    </>
  );
}
