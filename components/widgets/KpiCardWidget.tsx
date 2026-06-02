import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { getVisitorsOverviewWithCompare } from "@/lib/matomo/transforms";
import { formatDuration, cn } from "@/lib/utils";
import type { WidgetProps } from "@/lib/widgets/types";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { MetricInfo } from "@/components/dashboard/MetricInfo";

export interface KpiCardConfig {
  metric: "visits" | "pageviews" | "bounceRate" | "avgDuration" | "uniqueVisitors";
  accent?: boolean;
}

const METRIC_LABELS: Record<KpiCardConfig["metric"], string> = {
  visits: "Besuche",
  pageviews: "Seitenaufrufe",
  bounceRate: "Bounce Rate",
  avgDuration: "Ø Verweildauer",
  uniqueVisitors: "Unique Visitors",
};

const METRIC_DESCRIPTIONS: Partial<Record<KpiCardConfig["metric"], string>> = {
  bounceRate: "Anteil Einzel-Seitenbesuche",
  avgDuration: "pro Besuch",
};

/** Welche Metriken sind "weniger ist besser" (z.B. Bounce Rate)? */
const LOWER_IS_BETTER = new Set<KpiCardConfig["metric"]>(["bounceRate"]);

function formatValue(metric: KpiCardConfig["metric"], v: {
  visits: number;
  pageviews: number;
  bounceRate: string;
  avgVisitDurationSeconds: number;
  uniqueVisitors: number;
}): string {
  switch (metric) {
    case "visits": return v.visits.toLocaleString("de-DE");
    case "pageviews": return v.pageviews.toLocaleString("de-DE");
    case "bounceRate": return v.bounceRate;
    case "avgDuration": return formatDuration(v.avgVisitDurationSeconds);
    case "uniqueVisitors": return v.uniqueVisitors.toLocaleString("de-DE");
    default: return "—";
  }
}

function formatPercent(p: number | null): string {
  if (p === null) return "—";
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(1).replace(".", ",")} %`;
}

export async function KpiCardWidget({
  config,
  title,
  ctx,
}: WidgetProps<KpiCardConfig>) {
  const result = await getVisitorsOverviewWithCompare(
    ctx.siteId,
    { from: ctx.range.from, to: ctx.range.to },
    ctx.compareRange
  );

  const value = formatValue(config.metric, result.current);
  const displayTitle = title ?? METRIC_LABELS[config.metric];
  const description = METRIC_DESCRIPTIONS[config.metric];
  const metricDef = getMetricDefinition(config.metric);

  // Delta fuer aktuelle Metrik berechnen
  const deltaForMetric = result.delta
    ? config.metric === "avgDuration"
      ? result.delta.avgDuration
      : result.delta[config.metric]
    : null;

  const previousValue = result.previous
    ? formatValue(config.metric, result.previous)
    : null;

  const lowerIsBetter = LOWER_IS_BETTER.has(config.metric);

  // Vorzeichen → "gut" oder "schlecht"
  let trendKind: "up" | "down" | "flat" = "flat";
  if (deltaForMetric && deltaForMetric.pct !== null) {
    if (deltaForMetric.pct > 0.05) trendKind = "up";
    else if (deltaForMetric.pct < -0.05) trendKind = "down";
  }

  const isPositive =
    trendKind === "flat"
      ? null
      : lowerIsBetter
      ? trendKind === "down"
      : trendKind === "up";

  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden",
        config.accent && "border-accent/40"
      )}
    >
      {config.accent && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-0.5 bg-accent"
        />
      )}
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span>{displayTitle}</span>
          {metricDef && <MetricInfo metric={metricDef} size="sm" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums text-foreground">
          {value}
        </div>

        {deltaForMetric && previousValue && ctx.compareRange ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                isPositive === true && "bg-success/10 text-success",
                isPositive === false && "bg-destructive/10 text-destructive",
                isPositive === null && "bg-muted text-muted-foreground"
              )}
            >
              {trendKind === "up" && <ArrowUpRight className="h-3 w-3" />}
              {trendKind === "down" && <ArrowDownRight className="h-3 w-3" />}
              {trendKind === "flat" && <Minus className="h-3 w-3" />}
              {formatPercent(deltaForMetric.pct)}
            </span>
            <span className="text-xs text-muted-foreground">
              vs. {previousValue} ({ctx.compareRange.label})
            </span>
          </div>
        ) : description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
