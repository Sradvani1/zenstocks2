"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ValueDisplay } from "@/components/folio/ValueDisplay";
import { AllocationChart } from "@/components/folio/AllocationChart";
import { HoldingsTable } from "@/components/folio/HoldingsTable";
import { HistoryChart } from "@/components/folio/HistoryChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useHoldings } from "@/hooks/useHoldings";
import { useHoldingQuotes } from "@/hooks/useHoldingQuotes";
import { usePortfolioHistory } from "@/hooks/usePortfolioHistory";
import { isQuotePending } from "@/lib/quote-pending";
import {
  computePortfolioValue,
  computeAllocations,
} from "@/lib/portfolio";

function FolioContent() {
  const { user } = useAuth();
  const { holdings, loading, error, retry } = useHoldings(user?.uid);

  const holdingSymbols = useMemo(
    () => holdings.map((h) => h.symbol),
    [holdings],
  );
  const { quotes, loading: quotesLoading } = useHoldingQuotes(holdingSymbols);

  const historyInput = useMemo(
    () => holdings.map((h) => ({ symbol: h.symbol, shares: h.shares })),
    [holdings],
  );
  const { series, loading: historyLoading } =
    usePortfolioHistory(historyInput);

  const portfolio = useMemo(
    () => computePortfolioValue(holdings, quotes),
    [holdings, quotes],
  );
  const allocations = useMemo(
    () => computeAllocations(holdings, quotes),
    [holdings, quotes],
  );

  const chartSymbols = useMemo(
    () => allocations.filter((a) => a.value > 0).map((a) => a.symbol),
    [allocations],
  );

  const hasPending = useMemo(
    () => holdings.some((h) => isQuotePending(quotes[h.symbol])),
    [holdings, quotes],
  );

  if (loading || quotesLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
        <Button variant="outline" className="min-h-11" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">
          No holdings yet.{" "}
          <Link href="/holdings" className="underline hover:text-foreground">
            Add your first holding
          </Link>{" "}
          to see your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <div className="mt-2">
          <ValueDisplay portfolio={portfolio} hasPending={hasPending} />
        </div>
      </div>

      <Tabs defaultValue="allocation">
        <TabsList className="w-full">
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="allocation" className="pt-4">
          <AllocationChart allocations={allocations} />
        </TabsContent>
        <TabsContent value="holdings" className="pt-2">
          <HoldingsTable holdings={holdings} quotes={quotes} />
        </TabsContent>
        <TabsContent value="history" className="pt-4">
          <HistoryChart series={series} symbols={chartSymbols} loading={historyLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FolioPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <FolioContent />
    </div>
  );
}
