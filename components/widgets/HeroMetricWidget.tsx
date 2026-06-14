import { Users, Eye, Activity, Clock, UserCheck, TrendingUp, TrendingDown } from "lucide-react";
import {
  getVisitorsOverviewWithCompare,
  getVisitorTrendForRange,
} from "@/lib/matomo/transforms";
import { formatDuration } from "@/lib/utils";
import type { WidgetProps } from "@/lib/widgets/types";
import { HeroCountUp } from "./HeroCountUp";
import { HeroSparkline } from "@/components/charts/HeroSparkline";

export interface HeroMetricConfig {
  metric: "visits" | "pageviews" | "bounceRate" | "avgDuration" | "uniqueVisitors";
}

const METRIC_LABELS: Record<HeroMetricConfig["metric"], string> = {
  visits: "Besuche",
  pageviews: "Seitenaufrufe",
  bounceRate: "Bounce Rate",
  avgDuration: "Ø Verweildauer",
  uniqueVisitors: "Unique Visitors",
};

const METRIC_ICONS: Record<HeroMetricConfig["metric"], React.ComponentType<{ className?: string }>> = {
  visits: Users,
  pageviews: Eye,
  bounceRate: Activity,
  avgDuration: Clock,
  uniqueVisitors: UserCheck,
};

/** Metriken, bei denen ein kleinerer Wert besser ist. */
const LOWER_IS_BETTER = new Set<HeroMetricConfig["metric"]>(["bounceRate"]);
/** Numerische Metriken (Count-up moeglich). */
const NUMERIC = new Set<HeroMetricConfig["metric"]>(["visits", "pageviews", "uniqueVisitors"]);

type Overview = {
  visits: number;
  pageviews: number;
  bounceRate: string;
  avgVisitDurationSeconds: number;
  uniqueVisitors: number;
};

function formatValue(metric: HeroMetricConfig["metric"], v: Overview): string {
  switch (metric) {
    case "visits": return v.visits.toLocaleString("de-DE");
    case "pageviews": return v.pageviews.toLocaleString("de-DE");
    case "bounceRate": return v.bounceRate;
    case "avgDuration": return formatDuration(v.avgVisitDurationSeconds);
    case "uniqueVisitors": return v.uniqueVisitors.toLocaleString("de-DE");
    default: return "—";
  }
}

function rawNumber(metric: HeroMetricConfig["metric"], v: Overview): number | null {
  switch (metric) {
    case "visits": return v.visits;
    case "pageviews": return v.pageviews;
    case "uniqueVisitors": return v.uniqueVisitors;
    default: return null;
  }
}

function formatPercent(p: number | null): string | null {
  if (p === null) return null;
  const sign = p > 0 ? "+" : "";
  return `${sign}${p.toFixed(1).replace(".", ",")} %`;
}

/**
 * Hero-Metrik-Panel — der "Magenta-Moment" des Dashboards. Grosse Kennzahl
 * mit Count-up, Delta-Pill, Live-Indikator und weisser eckiger Sparkline auf
 * einem branding-abgeleiteten Magenta-Verlauf (siehe .hero-panel in globals.css).
 */
export async function HeroMetricWidget({ config, title, ctx }: WidgetProps<HeroMetricConfig>) {
  const metric = config.metric ?? "visits";

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

  const value = formatValue(metric, result.current);
  const countTo = NUMERIC.has(metric) ? rawNumber(metric, result.current) : null;
  const displayTitle = title ?? METRIC_LABELS[metric];
  const Icon = METRIC_ICONS[metric];

  const deltaForMetric = result.delta
    ? metric === "avgDuration"
      ? result.delta.avgDuration
      : result.delta[metric]
    : null;

  let trendKind: "up" | "down" | "flat" = "flat";
  if (deltaForMetric && deltaForMetric.pct !== null) {
    if (deltaForMetric.pct > 0.05) trendKind = "up";
    else if (deltaForMetric.pct < -0.05) trendKind = "down";
  }
  const lowerIsBetter = LOWER_IS_BETTER.has(metric);
  const deltaText = deltaForMetric ? formatPercent(deltaForMetric.pct) : null;

  const subLabel = ctx.compareRange
    ? `${ctx.range.label} · vs. ${ctx.compareRange.label}`
    : ctx.range.label;

  const spark = trendData.map((p) => p.Besuche);

  return (
    <div className="hero-panel anim-rise flex h-full flex-col justify-between rounded-xl p-6">
      <span aria-hidden className="hero-glow" />

      {/* Kopfzeile: Icon + Label + Live */}
      <div className="relative z-[1] flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-md bg-white/15"
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-sm font-medium opacity-90">{displayTitle}</span>
        <span className="ml-auto inline-flex items-center gap-2 opacity-95">
          <span className="live-dot" aria-hidden />
          <span className="text-[11px] font-medium uppercase tracking-[0.04em]">Live</span>
        </span>
      </div>

      {/* Grosse Zahl + Delta-Pill */}
      <div className="relative z-[1] mt-4">
        <div className="flex flex-wrap items-end gap-3">
          <span
            className="heading-display text-5xl leading-none tabular-nums"
            style={{ letterSpacing: "-0.02em" }}
          >
            <HeroCountUp to={countTo} value={value} />
          </span>
          {deltaText && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.18] px-2.5 py-1 text-[13px] font-semibold backdrop-blur-sm">
              {trendKind === "up" && <TrendingUp className="h-[15px] w-[15px]" />}
              {trendKind === "down" && <TrendingDown className="h-[15px] w-[15px]" />}
              {deltaText}
              {lowerIsBetter && <span className="sr-only"> (niedriger ist besser)</span>}
            </span>
          )}
        </div>
        <p className="mt-2 text-[13px] opacity-85">{subLabel}</p>
      </div>

      {/* Weisse eckige Sparkline */}
      {spark.length > 1 && (
        <div className="relative z-[1] mt-4">
          <HeroSparkline values={spark} />
        </div>
      )}
    </div>
  );
}
