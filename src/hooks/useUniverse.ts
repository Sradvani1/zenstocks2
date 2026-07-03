"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { UniverseSymbol } from "@/types/universe";

export function useUniverse() {
  const [symbols, setSymbols] = useState<UniverseSymbol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const col = collection(db, "symbols", "universe", "entries");
    const unsubscribe = onSnapshot(
      col,
      (snapshot) => {
        const rows: UniverseSymbol[] = snapshot.docs.map((d) => ({
          ...(d.data() as UniverseSymbol),
          symbol: d.id,
        }));
        rows.sort((a, b) => a.rank - b.rank);
        setSymbols(rows);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to load symbol universe");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { symbols, loading, error };
}
