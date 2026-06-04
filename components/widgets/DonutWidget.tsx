import { PieChart } from "lucide-react";
import {
  getBreakdownForRange,
  type BreakdownSource,
} from "@/lib/matomo/transforms";
import { getMetricDefinition } from "@/lib/metrics/registry";
import { DonutChartClient } from "@/components/charts/DonutChartClient";
import { WidgetCard } from "./WidgetCard";
import type { WidgetProps } from "@/lib/widgets/types";

export interface DonutConfig {
  source: BreakdownSource;
  limit?: number;
  metricRefId?: string;
}

const SOURCE_LABELS: Record<BreakdownSource, string> = {
  "device-type": "Geräte-Verteilung",
  "device-brand": "Gerätemarken",
  browser: "Browser",
  os: "Betriebssysteme",
  country: "Länder",
  "referrer-type": "Traffic-Quellen",
  "search-engine": "Suchmaschinen",
  "social-network": "Soziale Netzwerke",
  "event-category": "Event-Kategorien",
  "event-action": "Event-Aktionen",
};

export async function DonutWidget({
  config,
  title,
  ctx,
}: WidgetProps<DonutConfig>) {
  const limit = config.limit ?? 6;
  let rows: Awaited<ReturnType<typeof getBreakdownForRange>> = [];
  try {
    rows = await getBreakdownForRange(
      config.source,
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      limit
    );
  } catch {}

  const displayTitle = title ?? SOURCE_LABELS[config.source] ?? "Verteilung";
  const def = config.metricRefId
    ? getMetricDefinition(config.metricRefId)
    : null;

  const data = rows.map((r) => ({ name: r.label, value: r.visits }));

  return (
    <WidgetCard
      title={displayTitle}
      icon={<PieChart className="h-4 w-4" />}
      metricDef={def}
      center={data.length > 0}
    >
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Keine Daten für diesen Zeitraum.
        </p>
      ) : (
        <DonutChartClient data={data} />
      )}
    </WidgetCard>
  );
}
