import { AlignLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProcessedReport } from "@/lib/matomo/metadata";
import { resolveDimensionConfig } from "@/lib/widgets/dimensionReport";
import { InlineBar } from "@/components/charts/InlineBar";
import { WidgetCard } from "./WidgetCard";
import type { WidgetProps } from "@/lib/widgets/types";

export interface BreakdownConfig {
  apiModule?: string;
  apiAction?: string;
  metric?: string;
  limit?: number;
  reportLabel?: string;
  /** Legacy (abwaertskompatibel) */
  source?: string;
}

export async function BreakdownWidget({ config, title, ctx }: WidgetProps<BreakdownConfig>) {
  const r = resolveDimensionConfig(config as Record<string, unknown>);
  let result: Awaited<ReturnType<typeof getProcessedReport>> | null = null;
  let error = false;
  try {
    result = await getProcessedReport(
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      { apiModule: r.apiModule, apiAction: r.apiAction, filterLimit: r.limit, sortColumn: r.metric },
    );
  } catch {
    error = true;
  }

  const metricId =
    result?.measures.find((m) => m.id === r.metric)?.id ?? result?.measures[0]?.id;
  const metricLabel = result?.measures.find((m) => m.id === metricId)?.label ?? "Wert";
  const rows = (result?.rows ?? []).map((row) => ({
    label: row.label,
    value: metricId ? row.values[metricId] ?? 0 : 0,
  }));
  const total = rows.reduce((s, x) => s + x.value, 0);
  const maxV = rows.reduce((m, x) => Math.max(m, x.value), 0);
  const displayTitle = title ?? r.label ?? "Breakdown";

  return (
    <WidgetCard title={displayTitle} icon={<AlignLeft className="h-4 w-4" />} scroll>
      {error ? (
        <p className="text-sm text-muted-foreground">Daten konnten nicht geladen werden.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Daten für diesen Zeitraum.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8">{result?.dimensionLabel || "Wert"}</TableHead>
              <TableHead className="h-8 w-40">{metricLabel}</TableHead>
              <TableHead className="h-8 w-14 text-right">Anteil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => {
              const pct = total > 0 ? (row.value / total) * 100 : 0;
              return (
                <TableRow key={i}>
                  <TableCell className="max-w-xs truncate py-2 text-sm text-foreground">
                    {row.label || "—"}
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-12 shrink-0 text-right text-sm tabular-nums text-foreground">
                        {row.value.toLocaleString("de-DE")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <InlineBar fraction={maxV ? row.value / maxV : 0} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-right text-sm tabular-nums text-muted-foreground">
                    {pct.toFixed(0)} %
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </WidgetCard>
  );
}
