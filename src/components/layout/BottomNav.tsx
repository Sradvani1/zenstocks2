"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Newspaper, PieChart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeArea } from "@/components/layout/SafeArea";

const tabs = [
  { href: "/folio", label: "Folio", icon: PieChart },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/user", label: "User", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <SafeArea>
        <div className="mx-auto flex h-14 max-w-[430px] items-stretch justify-around px-2">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-xs font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </SafeArea>
    </nav>
  );
}
