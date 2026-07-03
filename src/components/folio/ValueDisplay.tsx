"use client";

import { formatCurrency, formatPercent, formatAsOfDate } from "@/lib/format";
import type { PortfolioValue } from "@/lib/portfolio";

type ValueDisplayProps = {
  portfolio: PortfolioValue;
  hasPending: boolean;
};

export function ValueDisplay({ portfolio, hasPending }: ValueDisplayProps) {
  const { totalValue, dayChange, dayChangePercent, asOfDate } = portfolio;

  const changeColor =
    dayChange > 0
      ? "text-green-600 dark:text-green-400"
      : dayChange < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  const sign = dayChange > 0 ? "+" : "";

  return (
    <div className="flex flex-col gap-1">
      <p className="text-3xl font-bold tracking-tight">
        {formatCurrency(totalValue)}
      </p>
      <p className={`text-sm font-medium ${changeColor}`}>
        {sign}
        {formatCurrency(dayChange)} ({sign}
        {formatPercent(dayChangePercent)})
      </p>
      {asOfDate && (
        <p className="text-xs text-muted-foreground">
          As of {formatAsOfDate(asOfDate)} close
          {hasPending && " · awaiting next close"}
        </p>
      )}
    </div>
  );
}
