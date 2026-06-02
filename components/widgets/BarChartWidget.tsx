import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBreakdownForRange,
  type BreakdownSource,
} from "@/lib/matomo/transforms";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { MetricInfo } from "@/components/dashboard/MetricInfo";
import { BarListClient } from "@/components/charts/BarListClient";
import type { WidgetProps } from "@/lib/widgets/types";

export interface BarChartConfig {
  source: BreakdownSource;
  limit?: number;
  metricRefId?: string;
}

export async function BarChartWidget({
  config,
  title,
  ctx,
}: WidgetProps<BarChartConfig>) {
  const limit = config.limit ?? 8;
  let rows: Awaited<ReturnType<typeof getBreakdownForRange>> = [];
  try {
    rows = await getBreakdownForRange(
      config.source,
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      limit
    );
  } catch {}

  const displayTitle = title ?? "Top-Werte";
  const def = config.metricRefId
    ? getMetricDefinition(config.metricRefId)
    : null;

  const data = rows.map((r) => ({ name: r.label, value: r.visits }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <span>{displayTitle}</span>
          {def && <MetricInfo metric={def} size="md" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Daten für diesen Zeitraum.
          </p>
        ) : (
          <BarListClient data={data} />
        )}
      </CardContent>
    </Card>
  );
}
