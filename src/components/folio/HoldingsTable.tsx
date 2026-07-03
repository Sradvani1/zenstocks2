"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { Quote } from "@/types/quote";

type SortKey = "symbol" | "value" | "change" | "changePct";
type SortDir = "asc" | "desc";

type HoldingsTableProps = {
  holdings: { symbol: string; shares: number }[];
  quotes: Record<string, Quote | null>;
};

function getSortValue(
  h: { symbol: string; shares: number },
  q: Quote | null | undefined,
  key: SortKey,
): number | string {
  switch (key) {
    case "symbol":
      return h.symbol;
    case "value":
      return q ? q.lastPrice * h.shares : 0;
    case "change":
      return q ? q.change * h.shares : 0;
    case "changePct":
      return q?.changePercent ?? 0;
  }
}

export function HoldingsTable({ holdings, quotes }: HoldingsTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
  }

  const rows = [...holdings]
    .map((h) => {
      const q = quotes[h.symbol] ?? null;
      return { ...h, quote: q };
    })
    .sort((a, b) => {
      const av = getSortValue(a, a.quote, sortKey);
      const bv = getSortValue(b, b.quote, sortKey);
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => toggleSort("symbol")}
          >
            Symbol{arrow("symbol")}
          </TableHead>
          <TableHead
            className="cursor-pointer select-none text-right"
            onClick={() => toggleSort("value")}
          >
            Value{arrow("value")}
          </TableHead>
          <TableHead
            className="cursor-pointer select-none text-right"
            onClick={() => toggleSort("change")}
          >
            $ Chg{arrow("change")}
          </TableHead>
          <TableHead
            className="cursor-pointer select-none text-right"
            onClick={() => toggleSort("changePct")}
          >
            % Chg{arrow("changePct")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const q = row.quote;
          const value = q ? q.lastPrice * row.shares : 0;
          const dayChange = q ? q.change * row.shares : 0;
          const changePct = q?.changePercent ?? 0;
          const changeColor =
            dayChange > 0
              ? "text-green-600 dark:text-green-400"
              : dayChange < 0
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground";
          const sign = dayChange > 0 ? "+" : "";

          return (
            <TableRow
              key={row.symbol}
              className="cursor-pointer active:bg-muted/50"
              onClick={() => router.push(`/stock/${row.symbol}`)}
            >
              <TableCell className="font-medium">{row.symbol}</TableCell>
              <TableCell className="text-right">
                {q ? formatCurrency(value) : "—"}
              </TableCell>
              <TableCell className={`text-right ${changeColor}`}>
                {q ? `${sign}${formatCurrency(dayChange)}` : "—"}
              </TableCell>
              <TableCell className={`text-right ${changeColor}`}>
                {q ? `${sign}${formatPercent(changePct / 100)}` : "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
