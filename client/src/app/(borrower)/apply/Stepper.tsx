const STEPS = ["Personal details", "Salary slip", "Loan amount"];

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "active" : "todo";
        return (
          <li key={label} className="flex flex-col gap-2">
            <div className={`h-1.5 rounded-full ${state === "todo" ? "bg-gray-200" : "bg-brand-500"}`} />
            <span className={`text-xs font-medium sm:text-sm ${state === "todo" ? "text-gray-400" : "text-gray-800"}`}>
              {n}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
