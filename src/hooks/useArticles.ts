"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Article } from "@/types/article";

export function useArticles(symbols: string[]) {
  const [articles, setArticles] = useState<Article[]>([]);
  const key = symbols.slice().sort().join(",");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (key === "") return;

    let cancelled = false;

    async function fetchArticles() {
      const syms = key.split(",");
      const promises = syms.map((sym) =>
        getDocs(
          query(
            collection(db, "articles", sym, "entries"),
            orderBy("date", "desc"),
            limit(5),
          ),
        ),
      );

      const snapshots = await Promise.all(promises);
      if (cancelled) return;

      const merged: Article[] = [];
      snapshots.forEach((snap) => {
        snap.forEach((doc) => {
          merged.push(doc.data() as Article);
        });
      });
      merged.sort((a, b) => b.date.localeCompare(a.date));
      setArticles(merged);
      setLoadedFor(key);
    }

    fetchArticles().catch(() => {
      if (!cancelled) {
        setArticles([]);
        setLoadedFor(key);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  if (key === "") {
    return { articles: [], loading: false };
  }

  return {
    articles: loadedFor === key ? articles : [],
    loading: loadedFor !== key,
  };
}
