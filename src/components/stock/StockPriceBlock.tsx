"use client";

import { formatCurrency, formatPercent, formatAsOfDate } from "@/lib/format";
import { isQuotePending } from "@/lib/quote-pending";
import { Skeleton } from "@/components/ui/skeleton";
import type { Quote } from "@/types/quote";

type StockPriceBlockProps = {
  quote: Quote | null;
  loading: boolean;
};

export function StockPriceBlock({ quote, loading }: StockPriceBlockProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
    );
  }

  if (!quote) return null;

  const changeColor =
    quote.change > 0
      ? "text-green-600 dark:text-green-400"
      : quote.change < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  const sign = quote.change > 0 ? "+" : "";

  return (
    <div className="space-y-1">
      <p className="text-3xl font-bold tracking-tight">
        {formatCurrency(quote.lastPrice)}
      </p>
      <p className={`text-sm font-medium ${changeColor}`}>
        {sign}
        {formatCurrency(quote.change)} ({sign}
        {formatPercent(quote.changePercent / 100)})
      </p>
      <p className="text-xs text-muted-foreground">
        Prev close {formatCurrency(quote.previousClose)}
      </p>
      <p className="text-xs text-muted-foreground">
        As of {formatAsOfDate(quote.asOfDate)} close
        {isQuotePending(quote) && " · awaiting next close"}
      </p>
    </div>
  );
}
