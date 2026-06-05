"use client";

import { SparkAreaChart } from "@tremor/react";

interface Props {
  data: { date: string; value: number }[];
}

/**
 * Minimal-Sparkline fuer KPI-Karten.
 * Magenta-Akzent, keine Achsen, keine Legende.
 */
export function SparklineClient({ data }: Props) {
  if (data.length === 0) return null;
  return (
    <SparkAreaChart
      data={data}
      categories={["value"]}
      index="date"
      colors={["pink"]}
      className="h-8 w-20"
    />
  );
}
