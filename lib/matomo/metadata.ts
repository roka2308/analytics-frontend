// =============================================================
//  Matomo-Metadaten-Schicht (server-only, gecacht)
//
//  Macht ALLE Reports/Dimensionen/Metriken der Matomo-Instanz generisch
//  verfuegbar (statt hardcodierter Listen). Basis fuer das Report-Explorer-
//  Widget und die katalog-faehigen Widgets.
// =============================================================
import "server-only";
import { matomoRequest } from "./client";
import { withCache } from "./cache";
import { toMatomoDate } from "@/lib/dateRange";

export interface ReportMeta {
  uniqueId: string;
  category: string;
  label: string;
  module: string;
  action: string;
  /** Dimension des Reports (null = reiner Kennzahl-Report wie VisitsSummary.get) */
  dimension: string | null;
  /** Verfuegbare Metriken: id -> menschenlesbares Label */
  metrics: Record<string, string>;
}

interface RawReport {
  uniqueId?: string;
  category?: string;
  name?: string;
  module?: string;
  action?: string;
  dimension?: string;
  metrics?: Record<string, string>;
  processedMetrics?: Record<string, string>;
}

/** Vollstaendiger Report-Katalog der Instanz (lange TTL – aendert sich selten). */
export async function getReportCatalog(siteId: number): Promise<ReportMeta[]> {
  return withCache(`report_catalog_${siteId}`, 3600, async () => {
    const data = await matomoRequest<RawReport[]>({
      method: "API.getReportMetadata",
      idSite: siteId,
      period: "day",
      date: "yesterday",
    });
    return (data ?? [])
      .filter((r) => r.module && r.action)
      .map((r) => ({
        uniqueId: r.uniqueId ?? `${r.module}.${r.action}`,
        category: r.category ?? "Sonstige",
        label: r.name ?? r.action ?? "",
        module: r.module as string,
        action: r.action as string,
        dimension: r.dimension ?? null,
        metrics: { ...(r.metrics ?? {}), ...(r.processedMetrics ?? {}) },
      }));
  });
}

export interface ProcessedReportRow {
  label: string;
  values: Record<string, number>;
}

export interface ProcessedReportResult {
  dimensionLabel: string;
  measures: { id: string; label: string }[];
  rows: ProcessedReportRow[];
}

export interface ProcessedReportOpts {
  apiModule: string;
  apiAction: string;
  segment?: string;
  flat?: boolean;
  filterLimit?: number;
  sortColumn?: string;
  /** Native 2D-Pivot-Dimension (z.B. "DevicesDetection.getType") */
  pivotBy?: string;
  pivotByColumn?: string;
}

interface RawProcessedReport {
  columns?: Record<string, string>;
  reportData?: Record<string, unknown>[] | Record<string, Record<string, unknown>>;
}

/** Generischer Report-Abruf -> normalisiertes long-format. */
export async function getProcessedReport(
  siteId: number,
  range: { from: string; to: string },
  opts: ProcessedReportOpts,
): Promise<ProcessedReportResult> {
  const key = [
    "proc_report",
    siteId,
    range.from,
    range.to,
    `${opts.apiModule}.${opts.apiAction}`,
    opts.segment ?? "",
    opts.flat ? 1 : 0,
    opts.filterLimit ?? "",
    opts.sortColumn ?? "",
    opts.pivotBy ?? "",
    opts.pivotByColumn ?? "",
  ].join("_");

  return withCache(key, 600, async () => {
    const data = await matomoRequest<RawProcessedReport>({
      method: "API.getProcessedReport",
      idSite: siteId,
      period: "range",
      date: toMatomoDate(range),
      apiModule: opts.apiModule,
      apiAction: opts.apiAction,
      segment: opts.segment,
      flat: opts.flat ? 1 : undefined,
      filter_limit: opts.filterLimit,
      filter_sort_column: opts.sortColumn,
      pivotBy: opts.pivotBy,
      pivotByColumn: opts.pivotByColumn,
    });

    const columns = data?.columns ?? {};
    const measures = Object.entries(columns)
      .filter(([id]) => id !== "label")
      .map(([id, label]) => ({ id, label: String(label) }));

    const rd = data?.reportData ?? [];
    const rowsArr = Array.isArray(rd) ? rd : Object.values(rd);
    const rows: ProcessedReportRow[] = rowsArr.map((r) => {
      const row = r as Record<string, unknown>;
      const values: Record<string, number> = {};
      for (const m of measures) {
        const raw = row[m.id];
        const n =
          typeof raw === "string" ? parseFloat(raw.replace(/[^0-9.,-]/g, "").replace(",", ".")) : Number(raw);
        values[m.id] = Number.isFinite(n) ? n : 0;
      }
      return { label: String(row.label ?? ""), values };
    });

    return { dimensionLabel: String(columns.label ?? ""), measures, rows };
  });
}
