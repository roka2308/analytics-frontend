import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VisitorTrendChart } from "@/components/charts/VisitorTrendChart";
import { getVisitorTrend } from "@/lib/matomo/transforms";
import type { WidgetProps } from "@/lib/widgets/types";

export interface LineChartConfig {
  /** Aktuell unterstuetzt: nur "visits" (kann spaeter erweitert werden) */
  metric?: "visits";
}

export async function LineChartWidget({
  title,
  ctx,
}: WidgetProps<LineChartConfig>) {
  let data: Awaited<ReturnType<typeof getVisitorTrend>> = [];
  try {
    data = await getVisitorTrend(ctx.siteId, ctx.trendDays);
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
        <VisitorTrendChart data={data} />
      </CardContent>
    </Card>
  );
}
