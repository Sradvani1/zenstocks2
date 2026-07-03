import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SafeAreaProps = {
  children: ReactNode;
  className?: string;
};

export function SafeArea({ children, className }: SafeAreaProps) {
  return <div className={cn("pb-[var(--safe-area-inset-bottom)]", className)}>{children}</div>;
}
