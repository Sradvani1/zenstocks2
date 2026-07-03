"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { MAX_HOLDINGS, isValidSymbol, normalizeSymbol } from "@/lib/symbols";
import type { Holding } from "@/types/holding";

export type HoldingRow = Holding & { id: string };

export function useHoldings(uid: string | undefined) {
  const [holdings, setHoldings] = useState<HoldingRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const subscriptionKey = uid ? `${uid}:${retryKey}` : null;
  const loading = subscriptionKey !== null && loadedFor !== subscriptionKey;

  useEffect(() => {
    if (!uid) return;

    const key = `${uid}:${retryKey}`;
    const col = collection(db, "users", uid, "holdings");
    const unsubscribe = onSnapshot(
      col,
      (snapshot) => {
        const rows: HoldingRow[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Holding),
        }));
        rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
        setHoldings(rows);
        setError(null);
        setLoadedFor(key);
      },
      (err) => {
        setError(err.message || "Failed to load holdings");
        setLoadedFor(key);
      },
    );

    return () => unsubscribe();
  }, [uid, retryKey]);

  const count = holdings.length;
  const atLimit = count >= MAX_HOLDINGS;

  const add = useCallback(
    async (rawSymbol: string, rawShares: number) => {
      if (!uid) throw new Error("Not signed in");

      const symbol = normalizeSymbol(rawSymbol);
      if (!isValidSymbol(symbol)) throw new Error("Invalid symbol");

      const shares = Math.floor(rawShares);
      if (shares < 1) throw new Error("Shares must be at least 1");
      if (holdings.some((h) => h.symbol === symbol)) {
        throw new Error("Symbol already in portfolio");
      }
      if (holdings.length >= MAX_HOLDINGS) {
        throw new Error("Maximum 25 symbols");
      }

      const universeRef = doc(db, "symbols", "universe", "entries", symbol);
      const universeSnap = await getDoc(universeRef);
      if (!universeSnap.exists()) {
        throw new Error("Symbol is not in the universe");
      }

      const prev = holdings;
      const optimistic: HoldingRow = { id: symbol, symbol, shares };
      setHoldings(
        [...prev, optimistic].sort((a, b) => a.symbol.localeCompare(b.symbol)),
      );

      try {
        await setDoc(doc(db, "users", uid, "holdings", symbol), {
          symbol,
          shares,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        setHoldings(prev);
        throw e;
      }
    },
    [uid, holdings],
  );

  const update = useCallback(
    async (symbol: string, rawShares: number) => {
      if (!uid) throw new Error("Not signed in");

      const shares = Math.floor(rawShares);
      if (shares < 1) throw new Error("Shares must be at least 1");

      const prev = holdings;
      setHoldings(prev.map((h) => (h.symbol === symbol ? { ...h, shares } : h)));

      try {
        await updateDoc(doc(db, "users", uid, "holdings", symbol), {
          shares,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        setHoldings(prev);
        throw e;
      }
    },
    [uid, holdings],
  );

  const remove = useCallback(
    async (symbol: string) => {
      if (!uid) throw new Error("Not signed in");

      const prev = holdings;
      setHoldings(prev.filter((h) => h.symbol !== symbol));

      try {
        await deleteDoc(doc(db, "users", uid, "holdings", symbol));
      } catch (e) {
        setHoldings(prev);
        throw e;
      }
    },
    [uid, holdings],
  );

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  return {
    holdings: uid ? holdings : [],
    loading: Boolean(uid) && loading,
    error,
    add,
    update,
    remove,
    count: uid ? count : 0,
    atLimit: uid ? atLimit : false,
    retry,
  };
}
