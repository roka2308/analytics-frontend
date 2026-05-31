"use client";

import { AreaChart } from "@tremor/react";
import type { TrendDataPoint } from "@/lib/matomo/transforms";

interface Props {
  data: TrendDataPoint[];
}

export function VisitorTrendChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Keine Daten verfügbar
      </div>
    );
  }

  return (
    <AreaChart
      data={data}
      index="date"
      categories={["Besuche"]}
      // Tremor laesst nur seine Palette zu - "pink" als Naehe zum Magenta-Akzent
      colors={["pink"]}
      className="h-52"
      showAnimation
      showLegend={false}
      showGridLines
      curveType="monotone"
      yAxisWidth={36}
    />
  );
}
