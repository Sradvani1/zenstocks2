"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";

function StockDetailContent() {
  const { symbol } = useParams<{ symbol: string }>();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 py-6">
      <Link
        href="/folio"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Portfolio
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{symbol}</h1>
      <p className="mt-4 text-muted-foreground">
        Stock detail — coming in Phase 6
      </p>
    </div>
  );
}

export default function StockDetailPage() {
  return (
    <RequireAuth>
      <StockDetailContent />
    </RequireAuth>
  );
}
