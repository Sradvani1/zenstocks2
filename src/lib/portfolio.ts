import type { Quote } from "@/types/quote";

type HoldingInput = { symbol: string; shares: number };

export type PortfolioValue = {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  asOfDate: string | null;
};

export type AllocationSlice = {
  symbol: string;
  name: string;
  value: number;
  weight: number;
};

export function computePortfolioValue(
  holdings: HoldingInput[],
  quotes: Record<string, Quote | null>,
): PortfolioValue {
  let totalValue = 0;
  let dayChange = 0;
  let asOfDate: string | null = null;

  for (const h of holdings) {
    const q = quotes[h.symbol];
    if (!q) continue;
    totalValue += q.lastPrice * h.shares;
    dayChange += q.change * h.shares;
    if (!asOfDate || q.asOfDate < asOfDate) {
      asOfDate = q.asOfDate;
    }
  }

  const prevValue = totalValue - dayChange;
  const dayChangePercent = prevValue !== 0 ? dayChange / prevValue : 0;

  return { totalValue, dayChange, dayChangePercent, asOfDate };
}

export function computeAllocations(
  holdings: HoldingInput[],
  quotes: Record<string, Quote | null>,
): AllocationSlice[] {
  const slices: AllocationSlice[] = [];
  let totalValue = 0;

  for (const h of holdings) {
    const q = quotes[h.symbol];
    const value = q ? q.lastPrice * h.shares : 0;
    totalValue += value;
    slices.push({
      symbol: h.symbol,
      name: q?.name ?? h.symbol,
      value,
      weight: 0,
    });
  }

  if (totalValue > 0) {
    for (const s of slices) {
      s.weight = s.value / totalValue;
    }
  }

  slices.sort((a, b) => b.weight - a.weight);
  return slices;
}
