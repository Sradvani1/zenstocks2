"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useHoldings } from "@/hooks/useHoldings";
import { useSymbolHistory, filterByRange } from "@/hooks/useSymbolHistory";
import type { Range } from "@/hooks/useSymbolHistory";
import { StockPriceBlock } from "@/components/stock/StockPriceBlock";
import { StockChart } from "@/components/stock/StockChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Quote } from "@/types/quote";

const RANGES: Range[] = ["1M", "3M", "1Y", "MAX"];

function StockDetailContent() {
  const { symbol: rawSymbol } = useParams<{ symbol: string }>();
  const symbol = rawSymbol.toUpperCase();
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;

  const { holdings, loading: holdingsLoading, error: holdingsError, retry } = useHoldings(uid);
  const { bars, loading: historyLoading } = useSymbolHistory(symbol);
  const [range, setRange] = useState<Range>("1Y");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "quotes", symbol),
      (snap) => {
        setQuote(snap.exists() ? (snap.data() as Quote) : null);
        setQuoteLoading(false);
      },
      () => {
        setQuote(null);
        setQuoteLoading(false);
      },
    );
    return () => unsub();
  }, [symbol]);

  const filteredBars = useMemo(
    () => filterByRange(bars, range),
    [bars, range],
  );

  const isHeld = useMemo(
    () => holdings.some((h) => h.symbol === symbol),
    [holdings, symbol],
  );

  useEffect(() => {
    if (!holdingsLoading && !holdingsError && !isHeld) {
      router.replace("/folio");
    }
  }, [holdingsLoading, holdingsError, isHeld, router]);

  if (holdingsError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-4 py-6">
        <p className="text-sm text-destructive">{holdingsError}</p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  if (holdingsLoading || (!holdingsError && !isHeld)) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 py-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-4 h-8 w-24" />
        <Skeleton className="mt-6 h-[250px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 py-6">
      <Link
        href="/folio"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to Portfolio
      </Link>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{symbol}</h1>
      {quote?.name && (
        <p className="text-sm text-muted-foreground">{quote.name}</p>
      )}

      <div className="mt-4">
        <StockPriceBlock quote={quote} loading={quoteLoading} />
      </div>

      <div className="mt-6 flex gap-1">
        {RANGES.map((r) => (
          <Button
            key={r}
            size="sm"
            variant={r === range ? "secondary" : "ghost"}
            onClick={() => setRange(r)}
          >
            {r}
          </Button>
        ))}
      </div>

      <div className="mt-4">
        <StockChart bars={filteredBars} loading={historyLoading} range={range} />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prices updated daily after market close
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
