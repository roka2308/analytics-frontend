import { Compass } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProcessedReport } from "@/lib/matomo/metadata";
import { InlineBar } from "@/components/charts/InlineBar";
import { BarListClient } from "@/components/charts/BarListClient";
import { DonutChartClient } from "@/components/charts/DonutChartClient";
import { WidgetCard } from "./WidgetCard";
import type { WidgetProps } from "@/lib/widgets/types";

export interface ReportWidgetConfig {
  apiModule?: string;
  apiAction?: string;
  reportLabel?: string;
  /** Ausgewaehlte Metrik-IDs (leer = alle des Reports) */
  metrics?: string[];
  limit?: number;
  sortColumn?: string;
  display?: "table" | "bar" | "donut";
  segment?: string;
  // Vorbereitet fuer R3 (Pivot)
  pivotBy?: string;
  pivotByColumn?: string;
}

function fmt(n: number): string {
  return n.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

export async function ReportWidget({ config, title, ctx }: WidgetProps<ReportWidgetConfig>) {
  const displayTitle = title ?? config.reportLabel ?? "Report-Explorer";

  if (!config.apiModule || !config.apiAction) {
    return (
      <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground">
          Noch kein Report gewählt. Im Bearbeiten-Modus oben rechts einen Matomo-Report,
          Metriken und eine Darstellung auswählen.
        </p>
      </WidgetCard>
    );
  }

  const limit = config.limit ?? 10;
  let result: Awaited<ReturnType<typeof getProcessedReport>> | null = null;
  let error: string | null = null;
  try {
    result = await getProcessedReport(
      ctx.siteId,
      { from: ctx.range.from, to: ctx.range.to },
      {
        apiModule: config.apiModule,
        apiAction: config.apiAction,
        filterLimit: limit,
        sortColumn: config.sortColumn,
        segment: config.segment,
      },
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Fehler beim Laden";
  }

  if (error || !result) {
    return (
      <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground">Daten konnten nicht geladen werden.</p>
      </WidgetCard>
    );
  }

  // Ausgewaehlte Metriken (oder alle, falls keine gewaehlt)
  const selected =
    config.metrics && config.metrics.length > 0
      ? result.measures.filter((m) => config.metrics!.includes(m.id))
      : result.measures;
  const measures = selected.length > 0 ? selected : result.measures;
  const primary = measures[0]?.id;

  if (result.rows.length === 0) {
    return (
      <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground">Keine Daten für diesen Zeitraum.</p>
      </WidgetCard>
    );
  }

  // Balken / Donut: erste gewaehlte Metrik ueber die Dimension
  if ((config.display === "bar" || config.display === "donut") && primary) {
    const data = result.rows.map((r) => ({ name: r.label || "—", value: r.values[primary] ?? 0 }));
    return (
      <WidgetCard
        title={displayTitle}
        icon={<Compass className="h-4 w-4" />}
        scroll={config.display === "bar"}
        center={config.display === "donut"}
      >
        {config.display === "bar" ? (
          <BarListClient data={data} />
        ) : (
          <DonutChartClient data={data} />
        )}
      </WidgetCard>
    );
  }

  // Tabelle (Default): Dimension + gewaehlte Metriken
  const maxPrimary = primary
    ? result.rows.reduce((m, r) => Math.max(m, r.values[primary] ?? 0), 0)
    : 0;

  return (
    <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />} scroll>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8">{result.dimensionLabel || "Wert"}</TableHead>
            {measures.map((m) => (
              <TableHead key={m.id} className="h-8 text-right">
                {m.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell className="max-w-xs truncate py-2 text-sm text-foreground">
                {r.label || "—"}
              </TableCell>
              {measures.map((m, mi) => (
                <TableCell key={m.id} className="py-2 text-right text-sm tabular-nums text-foreground">
                  {mi === 0 && primary ? (
                    <div className="flex items-center justify-end gap-2">
                      <span className="w-16 text-right">{fmt(r.values[m.id] ?? 0)}</span>
                      <div className="hidden w-24 sm:block">
                        <InlineBar fraction={maxPrimary ? (r.values[m.id] ?? 0) / maxPrimary : 0} />
                      </div>
                    </div>
                  ) : (
                    fmt(r.values[m.id] ?? 0)
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </WidgetCard>
  );
}
