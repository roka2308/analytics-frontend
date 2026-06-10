import { BarChart3 } from "lucide-react";
import { getProcessedReport } from "@/lib/matomo/metadata";
import { resolveDimensionConfig } from "@/lib/widgets/dimensionReport";
import { BarListClient } from "@/components/charts/BarListClient";
import { WidgetCard } from "./WidgetCard";
import type { WidgetProps } from "@/lib/widgets/types";

export interface BarChartConfig {
  apiModule?: string;
  apiAction?: string;
  metric?: string;
  limit?: number;
  reportLabel?: string;
  source?: string;
}

export async function BarChartWidget({ config, title, ctx }: WidgetProps<BarChartConfig>) {
  const r = resolveDimensionConfig(config as Record<string, unknown>);
  let result: Awaited<ReturnType<typeof getProcessedReport>> | null = null;
  try {
    result = await getProcessedReport(
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      { apiModule: r.apiModule, apiAction: r.apiAction, filterLimit: r.limit, sortColumn: r.metric },
    );
  } catch {
    /* ignore */
  }

  const metricId =
    result?.measures.find((m) => m.id === r.metric)?.id ?? result?.measures[0]?.id;
  const data = (result?.rows ?? []).map((row) => ({
    name: row.label || "—",
    value: metricId ? row.values[metricId] ?? 0 : 0,
  }));
  const displayTitle = title ?? r.label ?? "Top-Werte";

  return (
    <WidgetCard title={displayTitle} icon={<BarChart3 className="h-4 w-4" />} scroll>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Daten für diesen Zeitraum.</p>
      ) : (
        <BarListClient data={data} />
      )}
    </WidgetCard>
  );
}
