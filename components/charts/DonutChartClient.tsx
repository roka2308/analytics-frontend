"use client";

import { DonutChart } from "@tremor/react";

interface Props {
  data: { name: string; value: number }[];
}

// Chart-Palette ueber CSS-Variablen: folgt dem Kunden-/Projekt-Branding (#13).
// Tremor erzeugt daraus Arbitrary-Klassen (fill-[hsl(var(--chart-1))]),
// die in tailwind.config.ts gesafelistet sind.
const COLORS = [1, 2, 3, 4, 5, 6].map((i) => `hsl(var(--chart-${i}))`);

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
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
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
