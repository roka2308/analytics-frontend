"use client";

import { AreaChart } from "@tremor/react";
import type { TrendDataPoint } from "@/lib/matomo/transforms";

interface Props {
  data: TrendDataPoint[];
}

export function VisitorTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-slate-400">
        Keine Daten verfügbar
      </div>
    );
  }

  return (
    <AreaChart
      data={data}
      index="date"
      categories={["Besuche"]}
      colors={["slate"]}
      className="h-52"
      showAnimation
      showLegend={false}
      showGridLines
      curveType="monotone"
    />
  );
}
