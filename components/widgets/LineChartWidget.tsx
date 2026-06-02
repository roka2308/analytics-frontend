import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitorTrendChart } from "@/components/charts/VisitorTrendChart";
import { getVisitorTrendForRange } from "@/lib/matomo/transforms";
import type { WidgetProps } from "@/lib/widgets/types";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { MetricInfo } from "@/components/dashboard/MetricInfo";

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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span>{title ?? "Besuchertrend – täglich"}</span>
          {def && <MetricInfo metric={def} size="md" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <VisitorTrendChart data={data} hasCompare={!!ctx.compareRange} />
      </CardContent>
    </Card>
  );
}
