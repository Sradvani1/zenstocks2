"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { HistoryBar } from "@/types/quote";
import type { Range } from "@/hooks/useSymbolHistory";

type StockChartProps = {
  bars: HistoryBar[];
  loading: boolean;
  range: Range;
};

function formatXTick(date: string, range: Range): string {
  const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  if (range === "1Y" || range === "MAX") {
    const mo = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    const yr = String(d.getUTCFullYear()).slice(2);
    return `${mo} '${yr}`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const [year, month, day] = label.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 text-muted-foreground">{formatted}</p>
      <p className="font-medium">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

export function StockChart({ bars, loading, range }: StockChartProps) {
  if (loading) {
    return <Skeleton className="h-[250px] w-full rounded-lg" />;
  }

  if (bars.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No price history available
      </p>
    );
  }

  const tickInterval = Math.max(1, Math.floor(bars.length / 5));
  const prices = bars.map((b) => b.close);
  const maxPrice = Math.max(...prices);

  function formatYAxis(v: number): string {
    if (maxPrice >= 10_000) return `$${(v / 1000).toFixed(0)}k`;
    if (maxPrice >= 1_000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(0)}`;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart
        data={bars}
        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
      >
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          tickFormatter={(d: string) => formatXTick(d, range)}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={60}
          domain={["auto", "auto"]}
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="close"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.3}
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
