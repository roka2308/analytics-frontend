"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChartColors } from "@/lib/useChartColors";

interface Props {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  type?: "line" | "area";
}

export function EvolutionChart({ data, index, categories, type = "line" }: Props) {
  const c = useChartColors();
  const palette = [
    c.accent,
    "hsl(217 91% 60%)",
    "hsl(173 70% 41%)",
    "hsl(142 71% 45%)",
    "hsl(25 95% 53%)",
    "hsl(262 83% 58%)",
  ];

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
        Keine Daten verfügbar
      </div>
    );
  }

  const tooltipStyle = {
    background: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    fontSize: "12px",
    color: "hsl(var(--popover-foreground))",
  };

  const common = (
    <>
      <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey={index}
        tick={{ fill: c.axis, fontSize: 11 }}
        tickLine={false}
        axisLine={{ stroke: c.grid }}
        minTickGap={24}
      />
      <YAxis tick={{ fill: c.axis, fontSize: 11 }} tickLine={false} axisLine={false} width={44} />
      <Tooltip
        contentStyle={tooltipStyle}
        labelStyle={{ color: "hsl(var(--muted-foreground))" }}
        formatter={(v: number) => Number(v).toLocaleString("de-DE")}
      />
      {categories.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
    </>
  );

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={160}>
      {type === "area" ? (
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          {common}
          {categories.map((cat, i) => (
            <Area
              key={cat}
              type="monotone"
              dataKey={cat}
              stroke={palette[i % palette.length]}
              fill={palette[i % palette.length]}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
              isAnimationActive
            />
          ))}
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          {common}
          {categories.map((cat, i) => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              stroke={palette[i % palette.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
