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

function toNum(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw !== "string") return 0;
  const cleaned = raw.replace(/[^0-9.,-]/g, "");
  if (!cleaned) return 0;
  const n = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
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

// ── Evolution / Zeitreihe ─────────────────────────────────────

export interface EvolutionResult {
  buckets: { key: string; label: string }[];
  /** je Metrik die aggregierten Werte je Zeit-Bucket (Summe ueber Dimension) */
  series: { id: string; points: number[] }[];
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

function formatBucket(key: string): string {
  const m = key.match(/\d{4}-\d{2}-\d{2}/);
  if (m) {
    return new Date(m[0]).toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
  }
  const mm = key.match(/^(\d{4})-(\d{2})$/);
  if (mm) return new Date(`${key}-01`).toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
  return key;
}

function bucketTotal(value: unknown, metric: string): number {
  if (Array.isArray(value)) {
    return value.reduce<number>((s, r) => s + toNum((r as Record<string, unknown>)?.[metric]), 0);
  }
  if (value && typeof value === "object") {
    return toNum((value as Record<string, unknown>)[metric]);
  }
  return 0;
}

/**
 * Zeitreihe einer/mehrerer Kennzahlen ueber den Zeitraum. Granularitaet je nach
 * Zeitraumlaenge (Tag/Woche/Monat). Pro Bucket wird die Metrik ueber alle Zeilen
 * der Dimension summiert (Gesamt der Kennzahl im Zeitverlauf).
 */
export async function getMetricEvolution(
  siteId: number,
  range: { from: string; to: string },
  opts: { apiModule: string; apiAction: string; metrics: string[]; segment?: string },
): Promise<EvolutionResult> {
  const days = daysBetween(range.from, range.to);
  const period = days <= 31 ? "day" : days <= 210 ? "week" : "month";
  const metrics = opts.metrics.length ? opts.metrics : ["nb_visits"];
  const key = [
    "evo",
    siteId,
    range.from,
    range.to,
    period,
    `${opts.apiModule}.${opts.apiAction}`,
    metrics.join(","),
    opts.segment ?? "",
  ].join("_");

  return withCache(key, 600, async () => {
    const data = await matomoRequest<Record<string, unknown>>({
      method: `${opts.apiModule}.${opts.apiAction}`,
      idSite: siteId,
      period,
      date: toMatomoDate(range),
      filter_limit: -1,
      segment: opts.segment,
    });
    const entries = Object.entries(data ?? {});
    const buckets = entries.map(([k]) => ({ key: k, label: formatBucket(k) }));
    const series = metrics.map((m) => ({
      id: m,
      points: entries.map(([, v]) => bucketTotal(v, m)),
    }));
    return { buckets, series };
  });
}
