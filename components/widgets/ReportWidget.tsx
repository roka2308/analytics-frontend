import { Compass } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProcessedReport, getMetricEvolution, getReportCatalog } from "@/lib/matomo/metadata";
import { getCrossRecords, getGroupedRecords, type ReportRef } from "@/lib/matomo/crosstab";
import { buildPivot } from "@/lib/analytics/pivot";
import { InlineBar } from "@/components/charts/InlineBar";
import { BarListClient } from "@/components/charts/BarListClient";
import { DonutChartClient } from "@/components/charts/DonutChartClient";
import { PivotTable } from "@/components/charts/PivotTable";
import { GroupedTable } from "@/components/charts/GroupedTable";
import { EvolutionChart } from "@/components/charts/EvolutionChart";
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
  display?: "table" | "bar" | "donut" | "pivot" | "grouped" | "line" | "area" | "kpi";
  segment?: string;
  // Pivot (R3): Zeilen-/Spalten-Dimensionen (Reports) + Kennzahl
  pivotRows?: ReportRef[];
  pivotCols?: ReportRef[];
  pivotMeasure?: string;
  pivotMeasureLabel?: string;
  // Gruppierte Tabelle: mehrere Dimensionen + mehrere Metriken (ohne Kreuzung)
  groupDims?: ReportRef[];
  groupMetrics?: { id: string; label: string }[];
}

function fmt(n: number): string {
  return n.toLocaleString("de-DE", { maximumFractionDigits: 2 });
}

export async function ReportWidget({ config, title, ctx }: WidgetProps<ReportWidgetConfig>) {
  const displayTitle = title ?? config.reportLabel ?? "Report-Explorer";

  // ── Pivot (Multi-Level Kreuztabelle) ──────────────────────────
  if (config.display === "pivot") {
    const rows = config.pivotRows ?? [];
    const cols = config.pivotCols ?? [];
    const measure = config.pivotMeasure ?? "nb_visits";
    if (rows.length === 0 || cols.length === 0) {
      return (
        <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
          <p className="text-sm text-muted-foreground">
            Für die Pivot-Darstellung bitte mindestens eine Zeilen- und eine
            Spalten-Dimension wählen.
          </p>
        </WidgetCard>
      );
    }
    try {
      const records = await getCrossRecords(
        ctx.siteId,
        { from: ctx.range.from, to: ctx.range.to },
        { rowReports: rows, colReports: cols, measure, limitPerLevel: config.limit ?? 6 },
      );
      const model = buildPivot(records, {
        rowDims: rows.map((_, i) => `r${i}`),
        colDims: cols.map((_, i) => `c${i}`),
        measure,
      });
      return (
        <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />} scroll>
          {model.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Daten für diese Kombination.</p>
          ) : (
            <PivotTable
              model={model}
              rowDimLabels={rows.map((r) => r.label ?? "Dimension")}
              colDimLabels={cols.map((c) => c.label ?? "Dimension")}
              measureLabel={config.pivotMeasureLabel ?? measure}
            />
          )}
        </WidgetCard>
      );
    } catch {
      return (
        <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
          <p className="text-sm text-muted-foreground">Pivot konnte nicht geladen werden.</p>
        </WidgetCard>
      );
    }
  }

  // ── Gruppierte/mehrdimensionale Tabelle (ohne Spalten-Kreuzung) ──
  if (config.display === "grouped") {
    const dims = config.groupDims ?? [];
    const gms = config.groupMetrics ?? [];
    if (dims.length === 0 || gms.length === 0) {
      return (
        <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
          <p className="text-sm text-muted-foreground">
            Für die gruppierte Tabelle bitte mindestens eine Dimension und eine Metrik wählen.
          </p>
        </WidgetCard>
      );
    }
    try {
      const records = await getGroupedRecords(
        ctx.siteId,
        { from: ctx.range.from, to: ctx.range.to },
        { dimReports: dims, metrics: gms.map((m) => m.id), limitPerLevel: config.limit ?? 8 },
      );
      return (
        <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />} scroll>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Daten für diese Kombination.</p>
          ) : (
            <GroupedTable
              records={records}
              dimKeys={dims.map((_, i) => `d${i}`)}
              dimLabels={dims.map((d) => d.label ?? "Dimension")}
              metrics={gms}
            />
          )}
        </WidgetCard>
      );
    } catch {
      return (
        <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
          <p className="text-sm text-muted-foreground">Tabelle konnte nicht geladen werden.</p>
        </WidgetCard>
      );
    }
  }

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

  // ── Verlauf (Linie/Fläche) und KPI (Einzelwert) ──────────────
  if (config.display === "line" || config.display === "area" || config.display === "kpi") {
    const metricIds = config.metrics && config.metrics.length > 0 ? config.metrics : ["nb_visits"];
    try {
      const [evo, catalog] = await Promise.all([
        getMetricEvolution(
          ctx.siteId,
          { from: ctx.range.from, to: ctx.range.to },
          { apiModule: config.apiModule, apiAction: config.apiAction, metrics: metricIds, segment: config.segment },
        ),
        getReportCatalog(ctx.siteId).catch(() => []),
      ]);
      const report = catalog.find(
        (r) => r.module === config.apiModule && r.action === config.apiAction,
      );
      const labelOf = (id: string) => report?.metrics[id] ?? id;

      if (config.display === "kpi") {
        const primary = evo.series[0];
        const total = primary ? primary.points.reduce((s, p) => s + p, 0) : 0;
        return (
          <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />} center>
            <div className="text-center">
              <div className="text-3xl font-semibold tabular-nums text-foreground">{fmt(total)}</div>
              <p className="mt-1 text-sm text-muted-foreground">{labelOf(primary?.id ?? "")}</p>
            </div>
          </WidgetCard>
        );
      }

      const data = evo.buckets.map((b, bi) => {
        const row: Record<string, unknown> = { t: b.label };
        for (const s of evo.series) row[labelOf(s.id)] = s.points[bi] ?? 0;
        return row;
      });
      const categories = evo.series.map((s) => labelOf(s.id));
      return (
        <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
          <EvolutionChart data={data} index="t" categories={categories} type={config.display === "area" ? "area" : "line"} />
        </WidgetCard>
      );
    } catch {
      return (
        <WidgetCard title={displayTitle} icon={<Compass className="h-4 w-4" />}>
          <p className="text-sm text-muted-foreground">Verlauf konnte nicht geladen werden.</p>
        </WidgetCard>
      );
    }
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
