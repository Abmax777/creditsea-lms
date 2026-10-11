export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">L</span>
          LendFlow
        </div>
        {children}
      </div>
    </main>
  );
}
