"use client";

import { BarList } from "@tremor/react";

interface Props {
  data: { name: string; value: number }[];
}

export function BarListClient({ data }: Props) {
  // Tremor BarList sortiert selber, aber wir sortieren explizit
  // damit die Reihenfolge garantiert ist.
  const sorted = [...data].sort((a, b) => b.value - a.value);
  return (
    <BarList
      data={sorted}
      valueFormatter={(v: number) => v.toLocaleString("de-DE")}
      color="hsl(var(--accent))"
    />
  );
}
