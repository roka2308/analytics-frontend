"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrendDataPoint } from "@/lib/matomo/transforms";
import { useChartColors } from "@/lib/useChartColors";

interface Props {
  data: TrendDataPoint[];
  hasCompare?: boolean;
}

export function VisitorTrendChart({ data, hasCompare }: Props) {
  const c = useChartColors();
  const gradientId = useId();

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
        Keine Daten verfügbar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={140}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c.accent} stopOpacity={0.22} />
            <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: c.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: c.grid }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fill: c.axis, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "12px",
            color: "hsl(var(--popover-foreground))",
          }}
          labelStyle={{ color: "hsl(var(--muted-foreground))" }}
          formatter={(value: number) => value.toLocaleString("de-DE")}
        />
        {hasCompare && (
          <Line
            type="linear"
            dataKey="Vergleich"
            stroke={c.compare}
            strokeWidth={1.5}
            strokeDasharray="4 3"
            dot={{ r: 2.5, fill: c.compare, strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive
          />
        )}
        <Area
          type="linear"
          dataKey="Besuche"
          stroke={c.accent}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: c.accent, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
