"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatAsOfDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { StackedHistoryPoint } from "@/hooks/usePortfolioHistory";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type HistoryChartProps = {
  series: StackedHistoryPoint[];
  symbols: string[];
  loading: boolean;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const total = payload.reduce((sum, p) => sum + p.value, 0);
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-muted-foreground">
        {formatAsOfDate(label)}
      </p>
      {payload
        .slice()
        .reverse()
        .map((p) => (
          <div key={p.dataKey} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span className="w-12">{p.dataKey}</span>
            <span className="ml-auto font-medium">
              {formatCurrency(p.value)}
            </span>
          </div>
        ))}
      <div className="mt-1 border-t border-border pt-1 font-medium">
        Total {formatCurrency(total)}
      </div>
    </div>
  );
}

export function HistoryChart({ series, symbols, loading }: HistoryChartProps) {
  if (loading) {
    return <Skeleton className="h-[200px] w-full rounded-lg" />;
  }

  if (series.length === 0 || symbols.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No portfolio history available yet
      </p>
    );
  }

  const tickInterval = Math.max(1, Math.floor(series.length / 5));
  const maxTotal = Math.max(
    ...series.map((pt) =>
      symbols.reduce((sum, s) => sum + ((pt[s] as number) || 0), 0),
    ),
  );

  function formatYAxis(v: number): string {
    if (maxTotal >= 100_000) return `$${(v / 1000).toFixed(0)}k`;
    if (maxTotal >= 1_000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(0)}`;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart
        data={series}
        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
      >
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          tickFormatter={formatAsOfDate}
        />
        <YAxis
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        {symbols.map((symbol, i) => (
          <Area
            key={symbol}
            type="monotone"
            dataKey={symbol}
            stackId="1"
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            fillOpacity={0.6}
            strokeWidth={1}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
