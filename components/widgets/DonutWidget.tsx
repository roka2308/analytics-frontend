import { PieChart } from "lucide-react";
import { getProcessedReport } from "@/lib/matomo/metadata";
import { resolveDimensionConfig } from "@/lib/widgets/dimensionReport";
import { DonutChartClient } from "@/components/charts/DonutChartClient";
import { WidgetCard } from "./WidgetCard";
import type { WidgetProps } from "@/lib/widgets/types";

export interface DonutConfig {
  apiModule?: string;
  apiAction?: string;
  metric?: string;
  limit?: number;
  reportLabel?: string;
  source?: string;
}

export async function DonutWidget({ config, title, ctx }: WidgetProps<DonutConfig>) {
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
  const displayTitle = title ?? r.label ?? "Verteilung";

  return (
    <WidgetCard title={displayTitle} icon={<PieChart className="h-4 w-4" />} center={data.length > 0}>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Daten für diesen Zeitraum.</p>
      ) : (
        <DonutChartClient data={data} />
      )}
    </WidgetCard>
  );
}
