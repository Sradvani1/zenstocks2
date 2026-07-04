"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import Markdown from "react-markdown";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useHoldings } from "@/hooks/useHoldings";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatAsOfDate } from "@/lib/format";
import type { Article } from "@/types/article";

function ArticleContent() {
  const { symbol: rawSymbol, date } = useParams<{
    symbol: string;
    date: string;
  }>();
  const symbol = rawSymbol.toUpperCase();
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid;

  const {
    holdings,
    loading: holdingsLoading,
    error: holdingsError,
    retry,
  } = useHoldings(uid);

  const [article, setArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const isHeld = useMemo(
    () => holdings.some((h) => h.symbol === symbol),
    [holdings, symbol],
  );

  useEffect(() => {
    if (!holdingsLoading && !holdingsError && !isHeld) {
      router.replace("/folio");
    }
  }, [holdingsLoading, holdingsError, isHeld, router]);

  useEffect(() => {
    let cancelled = false;

    async function fetchArticle() {
      const snap = await getDoc(
        doc(db, "articles", symbol, "entries", date),
      );
      if (cancelled) return;

      if (snap.exists()) {
        setArticle(snap.data() as Article);
      } else {
        setNotFound(true);
      }
      setArticleLoading(false);
    }

    fetchArticle().catch(() => {
      if (!cancelled) {
        setNotFound(true);
        setArticleLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [symbol, date]);

  if (holdingsError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center px-4 py-6">
        <p className="text-sm text-destructive">{holdingsError}</p>
        <Button variant="ghost" size="sm" className="mt-4" onClick={retry}>
          Retry
        </Button>
      </div>
    );
  }

  if (holdingsLoading || (!holdingsError && !isHeld) || articleLoading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 py-6">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-4 h-8 w-full" />
        <Skeleton className="mt-6 h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 py-6">
        <Link
          href="/news"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to News
        </Link>
        <p className="mt-4 text-muted-foreground">Article not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 py-6">
      <Link
        href="/news"
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to News
      </Link>

      <div className="mt-2 flex items-center gap-2">
        <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {symbol}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatAsOfDate(article.date)}
        </span>
      </div>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {article.headline}
      </h1>

      <div className="prose dark:prose-invert mt-6 max-w-none text-sm [&>*+*]:mt-4">
        <Markdown>{article.body}</Markdown>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <RequireAuth>
      <ArticleContent />
    </RequireAuth>
  );
}
