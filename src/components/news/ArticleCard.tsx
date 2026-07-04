import Link from "next/link";
import type { Article } from "@/types/article";
import { formatAsOfDate } from "@/lib/format";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${article.symbol}/${article.date}`}
      className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-2">
        <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {article.symbol}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatAsOfDate(article.date)}
        </span>
      </div>
      <h3 className="mt-2 text-sm font-semibold leading-snug">
        {article.headline}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {article.summary}
      </p>
    </Link>
  );
}
