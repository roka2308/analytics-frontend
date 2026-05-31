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
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
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
      className="h-52"
      showAnimation
      showLegend={hasCompare}
      showGridLines
      curveType="monotone"
      yAxisWidth={36}
    />
  );
}
