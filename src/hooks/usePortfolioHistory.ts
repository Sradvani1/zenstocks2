"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { HistoryBar } from "@/types/quote";

type HoldingInput = { symbol: string; shares: number };
export type StackedHistoryPoint = Record<string, number> & { date: string };

export function usePortfolioHistory(holdings: HoldingInput[]) {
  const holdingsKey = useMemo(
    () =>
      [...holdings]
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
        .map((h) => `${h.symbol}:${h.shares}`)
        .join(","),
    [holdings],
  );

  const [result, setResult] = useState<{
    key: string;
    series: StackedHistoryPoint[];
  }>({ key: "", series: [] });

  useEffect(() => {
    if (!holdingsKey) return;

    const parsed = holdingsKey.split(",").map((entry) => {
      const [symbol, shares] = entry.split(":");
      return { symbol, shares: Number(shares) };
    });

    let cancelled = false;
    const currentKey = holdingsKey;

    async function fetchHistory() {
      const historyBySymbol = new Map<string, Map<string, number>>();

      await Promise.all(
        parsed.map(async ({ symbol }) => {
          const snap = await getDocs(
            collection(db, "quotes", symbol, "history"),
          );
          const bars = new Map<string, number>();
          snap.forEach((doc) => {
            const data = doc.data() as HistoryBar;
            bars.set(data.date, data.close);
          });
          historyBySymbol.set(symbol, bars);
        }),
      );

      if (cancelled) return;

      const symbols = parsed.map((p) => p.symbol);
      const firstBars = historyBySymbol.get(symbols[0]);
      if (!firstBars) {
        setResult({ key: currentKey, series: [] });
        return;
      }

      const points: StackedHistoryPoint[] = [];
      for (const date of firstBars.keys()) {
        let allHave = true;
        const point: StackedHistoryPoint = { date } as StackedHistoryPoint;
        for (const { symbol, shares } of parsed) {
          const close = historyBySymbol.get(symbol)?.get(date);
          if (close === undefined) {
            allHave = false;
            break;
          }
          point[symbol] = close * shares;
        }
        if (allHave) {
          points.push(point);
        }
      }

      points.sort((a, b) => a.date.localeCompare(b.date));
      setResult({ key: currentKey, series: points.slice(-100) });
    }

    fetchHistory().catch(() => {
      if (!cancelled) {
        setResult({ key: currentKey, series: [] });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [holdingsKey]);

  if (!holdingsKey) {
    return { series: [] as StackedHistoryPoint[], loading: false };
  }

  return {
    series: result.key === holdingsKey ? result.series : [],
    loading: result.key !== holdingsKey,
  };
}
