"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { HistoryBar } from "@/types/quote";

export type Range = "1M" | "3M" | "1Y" | "MAX";

export function filterByRange(bars: HistoryBar[], range: Range): HistoryBar[] {
  if (range === "MAX" || bars.length === 0) return bars;

  const last = bars[bars.length - 1];
  const [year, month, day] = last.date.split("-").map(Number);
  const months = range === "1M" ? 1 : range === "3M" ? 3 : 12;
  const cutoff = new Date(Date.UTC(year, month - 1 - months, day));
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return bars.filter((b) => b.date >= cutoffStr);
}

export function useSymbolHistory(symbol: string | null) {
  const [bars, setBars] = useState<HistoryBar[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;

    async function fetchHistory() {
      const snap = await getDocs(
        collection(db, "quotes", symbol!, "history"),
      );
      if (cancelled) return;

      const result: HistoryBar[] = [];
      snap.forEach((doc) => {
        result.push(doc.data() as HistoryBar);
      });
      result.sort((a, b) => a.date.localeCompare(b.date));
      setBars(result);
      setLoadedFor(symbol!);
    }

    fetchHistory().catch(() => {
      if (!cancelled) {
        setBars([]);
        setLoadedFor(symbol!);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (!symbol) {
    return { bars: [], loading: false };
  }

  return {
    bars: loadedFor === symbol ? bars : [],
    loading: loadedFor !== symbol,
  };
}
