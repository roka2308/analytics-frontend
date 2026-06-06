"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useChartColors } from "@/lib/useChartColors";

interface Props {
  data: { date: string; value: number }[];
}

/**
 * Minimal-Sparkline: gerade Segmente von Wert zu Wert mit kleinen Punkten,
 * keine Achsen/Gitter. Magenta-Akzent, theme-fähig.
 */
export function SparklineClient({ data }: Props) {
  const c = useChartColors();
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <Line
          type="linear"
          dataKey="value"
          stroke={c.accent}
          strokeWidth={1.75}
          dot={{ r: 2, fill: c.accent, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
