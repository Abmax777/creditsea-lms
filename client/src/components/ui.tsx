import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import type { LoanStatus } from "@/lib/types";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};

export function Button({ variant = "primary", loading, className, children, disabled, ...props }: ButtonProps) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50",
    danger: "bg-white text-red-700 border border-red-300 hover:bg-red-50",
  }[variant];
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        styles,
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cx(inputClass, className)} {...props} />
);

export const Select = ({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className={cx(inputClass, className)} {...props} />
);

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6", className)}>{children}</div>;
}

export function Alert({ tone = "error", title, children }: { tone?: "error" | "success" | "info"; title?: string; children?: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-brand-100 bg-brand-50 text-brand-700",
    info: "border-gray-200 bg-gray-50 text-gray-700",
  }[tone];
  return (
    <div className={cx("rounded-lg border px-4 py-3 text-sm", styles)} role={tone === "error" ? "alert" : "status"}>
      {title && <p className="font-medium">{title}</p>}
      {children && <div className={cx(title && "mt-1")}>{children}</div>}
    </div>
  );
}

const statusStyles: Record<LoanStatus, string> = {
  APPLIED: "bg-amber-50 text-amber-800 ring-amber-200",
  SANCTIONED: "bg-sky-50 text-sky-800 ring-sky-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  DISBURSED: "bg-violet-50 text-violet-800 ring-violet-200",
  CLOSED: "bg-brand-50 text-brand-700 ring-brand-100",
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span className={cx("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", statusStyles[status])}>
      {status}
    </span>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">{children}</p>;
}

export function Stat({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={cx("tabular-nums", strong ? "text-base font-semibold text-gray-900" : "text-gray-800")}>{value}</span>
    </div>
  );
}
