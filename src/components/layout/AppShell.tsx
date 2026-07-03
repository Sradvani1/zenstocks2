import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <main className="flex flex-1 flex-col pb-[calc(3.5rem+var(--safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
