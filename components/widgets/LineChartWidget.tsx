import { LineChart } from "lucide-react";
import { VisitorTrendChart } from "@/components/charts/VisitorTrendChart";
import { getVisitorTrendForRange } from "@/lib/matomo/transforms";
import type { WidgetProps } from "@/lib/widgets/types";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { WidgetCard } from "./WidgetCard";

export interface LineChartConfig {
  metric?: "visits";
}

export async function LineChartWidget({
  title,
  ctx,
}: WidgetProps<LineChartConfig>) {
  let data: Awaited<ReturnType<typeof getVisitorTrendForRange>> = [];
  try {
    data = await getVisitorTrendForRange(
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      ctx.compareRange
    );
  } catch {
    // leise schlucken – Chart zeigt eigenen Leer-Zustand
  }

  const def = getMetricDefinition("visitor-trend");

  return (
    <WidgetCard
      title={title ?? "Besuchertrend – täglich"}
      icon={<LineChart className="h-4 w-4" />}
      metricDef={def}
    >
      <VisitorTrendChart data={data} hasCompare={!!ctx.compareRange} />
    </WidgetCard>
  );
}
