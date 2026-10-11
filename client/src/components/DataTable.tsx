import type { ReactNode } from "react";

export type Column<T> = { header: string; cell: (row: T) => ReactNode; className?: string };

export function DataTable<T extends { _id: string }>({ rows, columns }: { rows: T[]; columns: Column<T>[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            {columns.map((c) => (
              <th key={c.header} className={`px-4 py-3 font-medium ${c.className ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row._id} className="align-top">
              {columns.map((c) => (
                <td key={c.header} className={`px-4 py-3 ${c.className ?? ""}`}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageHeader({ title, subtitle, count }: { title: string; subtitle: string; count?: number }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold">
        {title}
        {count !== undefined && <span className="ml-2 text-base font-normal text-gray-400">{count}</span>}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  );
}
