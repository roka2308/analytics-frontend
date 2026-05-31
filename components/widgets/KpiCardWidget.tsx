import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVisitorsOverview } from "@/lib/matomo/transforms";
import { formatDuration, cn } from "@/lib/utils";
import type { WidgetProps } from "@/lib/widgets/types";

export interface KpiCardConfig {
  metric: "visits" | "pageviews" | "bounceRate" | "avgDuration" | "uniqueVisitors";
  /** Magenta-Akzent oben (zur Hervorhebung) */
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

export async function KpiCardWidget({
  config,
  title,
  ctx,
}: WidgetProps<KpiCardConfig>) {
  const overview = await getVisitorsOverview(ctx.siteId, ctx.period, ctx.date);

  let value: string;
  switch (config.metric) {
    case "visits":
      value = overview.visits.toLocaleString("de-DE");
      break;
    case "pageviews":
      value = overview.pageviews.toLocaleString("de-DE");
      break;
    case "bounceRate":
      value = overview.bounceRate;
      break;
    case "avgDuration":
      value = formatDuration(overview.avgVisitDurationSeconds);
      break;
    case "uniqueVisitors":
      value = overview.uniqueVisitors.toLocaleString("de-DE");
      break;
    default:
      value = "—";
  }

  const displayTitle = title ?? METRIC_LABELS[config.metric];
  const description = METRIC_DESCRIPTIONS[config.metric];

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
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {displayTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums text-foreground">
          {value}
        </div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
