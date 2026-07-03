import type { Quote } from "@/types/quote";
import { latestUsTradingDate } from "@/lib/trading-day";

export function isQuotePending(
  quote: Quote | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!quote) return true;
  return quote.asOfDate < latestUsTradingDate(now);
}
