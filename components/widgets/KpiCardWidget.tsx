import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Users, Eye, Activity, Clock, UserCheck } from "lucide-react";
import {
  getVisitorsOverviewWithCompare,
  getVisitorTrendForRange,
} from "@/lib/matomo/transforms";
import { formatDuration, cn } from "@/lib/utils";
import type { WidgetProps } from "@/lib/widgets/types";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { MetricInfo } from "@/components/dashboard/MetricInfo";
import { SparklineClient } from "@/components/charts/SparklineClient";

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

const METRIC_ICONS: Record<KpiCardConfig["metric"], React.ComponentType<{ className?: string }>> = {
  visits: Users,
  pageviews: Eye,
  bounceRate: Activity,
  avgDuration: Clock,
  uniqueVisitors: UserCheck,
};

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
  // Parallele Calls: Overview (current+previous) + Sparkline-Trend
  const [result, trendData] = await Promise.all([
    getVisitorsOverviewWithCompare(
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      ctx.compareRange
    ),
    getVisitorTrendForRange(ctx.siteId, { from: ctx.range.from, to: ctx.range.to }, null).catch(
      () => [] as Awaited<ReturnType<typeof getVisitorTrendForRange>>
    ),
  ]);

  const value = formatValue(config.metric, result.current);
  const displayTitle = title ?? METRIC_LABELS[config.metric];
  const metricDef = getMetricDefinition(config.metric);
  const Icon = METRIC_ICONS[config.metric];

  const deltaForMetric = result.delta
    ? config.metric === "avgDuration"
      ? result.delta.avgDuration
      : result.delta[config.metric]
    : null;

  const lowerIsBetter = LOWER_IS_BETTER.has(config.metric);

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

  // Sparkline-Daten in Tremor-Format
  const sparklineData = trendData.map((p) => ({
    date: p.date,
    value: p.Besuche,
  }));

  return (
    <Card
      className={cn(
        "anim-rise group relative flex h-full flex-col overflow-hidden",
        "transition-[transform,box-shadow,border-color] duration-150 ease-out",
        "hover:-translate-y-0.5 hover:border-accent/40",
        "hover:shadow-[0_14px_28px_-14px_hsl(var(--accent)/0.30)]"
      )}
    >
      {/* Optionale Magenta-Akzentlinie oben (Scale: hervorgehobene KPI) */}
      {config.accent && (
        <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
      )}

      {/* Kopfzeile: Icon + Titel */}
      <div className="flex shrink-0 items-center gap-2 px-4 pb-1 pt-4">
        <span
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent-text"
        >
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <span className="truncate">{displayTitle}</span>
          {metricDef && <MetricInfo metric={metricDef} size="sm" />}
        </h3>
      </div>

      {/* Wert + Trend oben, Sparkline randlos am unteren Rand */}
      <div className="flex flex-1 flex-col">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-4 pt-1">
          <span className="heading-display text-3xl leading-none tabular-nums text-foreground">
            {value}
          </span>
          {deltaForMetric && ctx.compareRange ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                isPositive === true && "bg-success/10 text-success",
                isPositive === false && "bg-destructive/10 text-destructive",
                isPositive === null && "bg-muted text-muted-foreground"
              )}
            >
              {trendKind === "up" && <TrendingUp className="h-3 w-3" />}
              {trendKind === "down" && <TrendingDown className="h-3 w-3" />}
              {trendKind === "flat" && <Minus className="h-3 w-3" />}
              {formatPercent(deltaForMetric.pct)}
            </span>
          ) : null}
        </div>

        {sparklineData.length > 0 && (
          <div className="mt-auto pt-3">
            <SparklineClient data={sparklineData} />
          </div>
        )}
      </div>
    </Card>
  );
}
