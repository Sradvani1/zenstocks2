import { RequireAuth } from "@/components/auth/RequireAuth";

export default function HoldingsPage() {
  return (
    <RequireAuth>
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Holdings</h1>
        <p className="mt-2 text-muted-foreground">Coming in Phase 3</p>
      </div>
    </RequireAuth>
  );
}
