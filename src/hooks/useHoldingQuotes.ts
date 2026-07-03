"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Quote } from "@/types/quote";

export function useHoldingQuotes(symbols: string[]) {
  const symbolsKey = useMemo(
    () => [...symbols].sort().join(","),
    [symbols],
  );
  const symbolList = useMemo(
    () => (symbolsKey ? symbolsKey.split(",") : []),
    [symbolsKey],
  );

  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});

  useEffect(() => {
    if (symbolList.length === 0) return;

    const unsubscribes = symbolList.map((symbol) =>
      onSnapshot(
        doc(db, "quotes", symbol),
        (snapshot) => {
          setQuotes((prev) => ({
            ...prev,
            [symbol]: snapshot.exists()
              ? (snapshot.data() as Quote)
              : null,
          }));
        },
        () => {
          setQuotes((prev) => ({ ...prev, [symbol]: null }));
        },
      ),
    );

    return () => unsubscribes.forEach((u) => u());
  }, [symbolList]);

  const activeQuotes = useMemo(() => {
    if (symbolList.length === 0) return {};
    const out: Record<string, Quote | null> = {};
    for (const s of symbolList) {
      out[s] = quotes[s] ?? null;
    }
    return out;
  }, [quotes, symbolList]);

  const loading =
    symbolList.length > 0 && symbolList.some((s) => !(s in quotes));

  return { quotes: activeQuotes, loading };
}
