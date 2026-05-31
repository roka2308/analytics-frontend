import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitorTrendChart } from "@/components/charts/VisitorTrendChart";
import { getVisitorTrendForRange } from "@/lib/matomo/transforms";
import type { WidgetProps } from "@/lib/widgets/types";

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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          {title ?? "Besuchertrend – täglich"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <VisitorTrendChart data={data} hasCompare={!!ctx.compareRange} />
      </CardContent>
    </Card>
  );
}
