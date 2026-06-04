"use client";

import { AreaChart } from "@tremor/react";
import type { TrendDataPoint } from "@/lib/matomo/transforms";

interface Props {
  data: TrendDataPoint[];
  hasCompare?: boolean;
}

export function VisitorTrendChart({ data, hasCompare }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
        Keine Daten verfügbar
      </div>
    );
  }

  const categories = hasCompare ? ["Besuche", "Vergleich"] : ["Besuche"];
  // Magenta (Akzent) fuer aktuell, neutral fuer Vergleichszeitraum
  const colors = hasCompare ? ["pink", "slate"] : ["pink"];

  return (
    <AreaChart
      data={data}
      index="date"
      categories={categories}
      colors={colors}
      className="h-full min-h-[8rem] w-full"
      showAnimation
      showLegend={hasCompare}
      showGridLines={false}
      curveType="monotone"
      yAxisWidth={40}
      startEndOnly={data.length > 14}
    />
  );
}
