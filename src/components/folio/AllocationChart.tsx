"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatPercent } from "@/lib/format";
import type { AllocationSlice } from "@/lib/portfolio";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type AllocationChartProps = {
  allocations: AllocationSlice[];
};

export function AllocationChart({ allocations }: AllocationChartProps) {
  const nonZero = allocations.filter((a) => a.value > 0);
  if (nonZero.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={nonZero}
            dataKey="value"
            nameKey="symbol"
            cx="50%"
            cy="50%"
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            strokeWidth={2}
            stroke="var(--background)"
          >
            {nonZero.map((entry, i) => (
              <Cell
                key={entry.symbol}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-2">
        {nonZero.map((entry, i) => (
          <div key={entry.symbol} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
              }}
            />
            <span className="font-medium">{entry.symbol}</span>
            <span className="text-muted-foreground">
              {formatPercent(entry.weight)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
