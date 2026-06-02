"use client";

import { DonutChart, Legend } from "@tremor/react";

interface Props {
  data: { name: string; value: number }[];
}

const COLORS = ["pink", "slate", "blue", "violet", "amber", "emerald"];

export function DonutChartClient({ data }: Props) {
  return (
    <div className="space-y-3">
      <DonutChart
        data={data}
        category="value"
        index="name"
        colors={COLORS}
        className="h-44"
        valueFormatter={(v) => v.toLocaleString("de-DE")}
        showAnimation
      />
      <Legend
        categories={data.map((d) => d.name)}
        colors={COLORS}
        className="justify-center"
      />
    </div>
  );
}
