"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useHoldings } from "@/hooks/useHoldings";
import { useArticles } from "@/hooks/useArticles";
import { ArticleCard } from "@/components/news/ArticleCard";
import { FilterChips } from "@/components/news/FilterChips";
import { Skeleton } from "@/components/ui/skeleton";

function NewsContent() {
  const { user } = useAuth();
  const { holdings, loading: holdingsLoading, error } = useHoldings(user?.uid);
  const symbols = useMemo(() => holdings.map((h) => h.symbol), [holdings]);
  const { articles, loading: articlesLoading } = useArticles(symbols);
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (selected) return articles.filter((a) => a.symbol === selected);
    const seen = new Set<string>();
    return articles.filter((a) => {
      if (seen.has(a.symbol)) return false;
      seen.add(a.symbol);
      return true;
    });
  }, [articles, selected]);

  if (holdingsLoading || articlesLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">News</h1>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (holdings.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">News</h1>
        <p className="text-muted-foreground">
          Add holdings first.{" "}
          <Link href="/holdings" className="underline hover:text-foreground">
            Manage holdings
          </Link>{" "}
          to start seeing articles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">News</h1>

      <FilterChips
        symbols={symbols}
        selected={selected}
        onSelect={setSelected}
      />

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">
          No articles yet — articles are generated daily.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((article) => (
            <ArticleCard
              key={`${article.symbol}-${article.date}`}
              article={article}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsPage() {
  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <NewsContent />
    </div>
  );
}
