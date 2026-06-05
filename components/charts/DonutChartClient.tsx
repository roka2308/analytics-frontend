"use client";

import { DonutChart } from "@tremor/react";

interface Props {
  data: { name: string; value: number }[];
}

// Scale-Funktionsfarben: Magenta, Blau, Teal, Gruen, Orange, Violett
const COLORS = ["pink", "blue", "cyan", "green", "orange", "violet"];
const DOT_CLASSES = [
  "bg-pink-500",
  "bg-blue-500",
  "bg-cyan-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-violet-500",
];

export function DonutChartClient({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex w-full items-center gap-5">
      <DonutChart
        data={data}
        category="value"
        index="name"
        colors={COLORS}
        className="h-32 w-32 shrink-0"
        valueFormatter={(v) => v.toLocaleString("de-DE")}
        showAnimation
        showLabel={false}
      />
      <ul className="min-w-0 flex-1 space-y-2">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li key={d.name} className="flex items-center gap-2 text-sm">
              <span
                aria-hidden
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  DOT_CLASSES[i % DOT_CLASSES.length]
                }`}
              />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {d.name}
              </span>
              <span className="shrink-0 tabular-nums font-medium text-muted-foreground">
                {pct.toFixed(0)} %
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
