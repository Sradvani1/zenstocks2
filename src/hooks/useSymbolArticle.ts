"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Article } from "@/types/article";

export function useSymbolArticles(symbol: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchArticles() {
      const snap = await getDocs(
        query(
          collection(db, "articles", symbol, "entries"),
          orderBy("date", "desc"),
          limit(5),
        ),
      );
      if (cancelled) return;

      const result: Article[] = [];
      snap.forEach((doc) => {
        result.push(doc.data() as Article);
      });
      setArticles(result);
      setLoadedFor(symbol);
    }

    fetchArticles().catch(() => {
      if (!cancelled) {
        setArticles([]);
        setLoadedFor(symbol);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  return {
    articles: loadedFor === symbol ? articles : [],
    loading: loadedFor !== symbol,
  };
}
