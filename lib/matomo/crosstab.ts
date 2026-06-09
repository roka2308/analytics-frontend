// =============================================================
//  Matomo Cross-Tab-Fetcher (server-only)
//
//  Baut multi-dimensionale long-format Records fuer die Pivot-Engine, indem
//  je Zeile das von Matomo gelieferte `segment` zum Drill-down in die naechste
//  Dimension genutzt wird. Beliebig tief (begrenzt durch limitPerLevel + Cap).
// =============================================================
import "server-only";
import { matomoRequest } from "./client";
import { withCache } from "./cache";
import { toMatomoDate } from "@/lib/dateRange";
import type { PivotRecord } from "@/lib/analytics/pivot";

export interface ReportRef {
  module: string;
  action: string;
  label?: string;
}

function parseMatomoNumber(raw: unknown): number {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  if (typeof raw !== "string") return 0;
  // "59.636,27 €" / "76 %" / "00:01:21" -> Zahl extrahieren (de-Format)
  const cleaned = raw.replace(/[^0-9.,-]/g, "");
  if (!cleaned) return 0;
  // de: Tausenderpunkt entfernen, Komma -> Punkt
  const n = parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

interface RawRow {
  label: string;
  segment: string | null;
  value: number;
}

async function fetchRows(
  siteId: number,
  range: { from: string; to: string },
  ref: ReportRef,
  measure: string,
  limit: number,
  segment: string | undefined,
): Promise<RawRow[]> {
  const key = [
    "xtab",
    siteId,
    range.from,
    range.to,
    `${ref.module}.${ref.action}`,
    measure,
    limit,
    segment ?? "",
  ].join("_");
  return withCache(key, 600, async () => {
    const data = await matomoRequest<unknown>({
      method: `${ref.module}.${ref.action}`,
      idSite: siteId,
      period: "range",
      date: toMatomoDate(range),
      filter_limit: limit,
      filter_sort_column: measure,
      segment,
    });
    const arr = Array.isArray(data)
      ? data
      : data && typeof data === "object"
        ? Object.values(data as Record<string, unknown>)
        : [];
    return arr.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        label: String(row.label ?? "—"),
        segment: typeof row.segment === "string" ? row.segment : null,
        value: parseMatomoNumber(row[measure]),
      };
    });
  });
}

export interface CrossConfig {
  rowReports: ReportRef[];
  colReports: ReportRef[];
  measure: string;
  limitPerLevel?: number;
}

/** Sicherheits-Cap fuer die Gesamtzahl der Matomo-Abfragen. */
const MAX_FETCHES = 80;

export async function getCrossRecords(
  siteId: number,
  range: { from: string; to: string },
  cfg: CrossConfig,
): Promise<PivotRecord[]> {
  const limit = Math.max(1, Math.min(cfg.limitPerLevel ?? 6, 25));
  const dims = [
    ...cfg.rowReports.map((r, i) => ({ ref: r, key: `r${i}` })),
    ...cfg.colReports.map((r, i) => ({ ref: r, key: `c${i}` })),
  ];
  const records: PivotRecord[] = [];
  let fetches = 0;

  async function expand(
    idx: number,
    segment: string | undefined,
    dimsSoFar: Record<string, string>,
  ): Promise<void> {
    if (fetches >= MAX_FETCHES) return;
    fetches++;
    const d = dims[idx];
    const rows = await fetchRows(siteId, range, d.ref, cfg.measure, limit, segment);
    for (const row of rows) {
      const nextDims = { ...dimsSoFar, [d.key]: row.label };
      if (idx === dims.length - 1) {
        records.push({ dims: nextDims, values: { [cfg.measure]: row.value } });
      } else if (row.segment) {
        const nextSeg = segment ? `${segment};${row.segment}` : row.segment;
        await expand(idx + 1, nextSeg, nextDims);
      }
    }
  }

  await expand(0, undefined, {});
  return records;
}

// ── Gruppierte/mehrdimensionale Tabelle (mehrere Dimensionen + mehrere
//    Metriken, OHNE Spalten-Kreuzung) ──────────────────────────

interface MultiRow {
  label: string;
  segment: string | null;
  values: Record<string, number>;
}

async function fetchRowsMulti(
  siteId: number,
  range: { from: string; to: string },
  ref: ReportRef,
  metrics: string[],
  sortMetric: string,
  limit: number,
  segment: string | undefined,
): Promise<MultiRow[]> {
  const key = [
    "xtabm",
    siteId,
    range.from,
    range.to,
    `${ref.module}.${ref.action}`,
    metrics.join(","),
    sortMetric,
    limit,
    segment ?? "",
  ].join("_");
  return withCache(key, 600, async () => {
    const data = await matomoRequest<unknown>({
      method: `${ref.module}.${ref.action}`,
      idSite: siteId,
      period: "range",
      date: toMatomoDate(range),
      filter_limit: limit,
      filter_sort_column: sortMetric,
      segment,
    });
    const arr = Array.isArray(data)
      ? data
      : data && typeof data === "object"
        ? Object.values(data as Record<string, unknown>)
        : [];
    return arr.map((r) => {
      const row = r as Record<string, unknown>;
      const values: Record<string, number> = {};
      for (const m of metrics) values[m] = parseMatomoNumber(row[m]);
      return {
        label: String(row.label ?? "—"),
        segment: typeof row.segment === "string" ? row.segment : null,
        values,
      };
    });
  });
}

export interface GroupedConfig {
  dimReports: ReportRef[];
  metrics: string[];
  limitPerLevel?: number;
  sortMetric?: string;
}

export async function getGroupedRecords(
  siteId: number,
  range: { from: string; to: string },
  cfg: GroupedConfig,
): Promise<PivotRecord[]> {
  const limit = Math.max(1, Math.min(cfg.limitPerLevel ?? 8, 50));
  const metrics = cfg.metrics.length ? cfg.metrics : ["nb_visits"];
  const sortMetric = cfg.sortMetric ?? metrics[0];
  const records: PivotRecord[] = [];
  let fetches = 0;

  async function expand(
    idx: number,
    segment: string | undefined,
    dimsSoFar: Record<string, string>,
  ): Promise<void> {
    if (fetches >= MAX_FETCHES) return;
    fetches++;
    const rows = await fetchRowsMulti(
      siteId,
      range,
      cfg.dimReports[idx],
      metrics,
      sortMetric,
      limit,
      segment,
    );
    for (const row of rows) {
      const nextDims = { ...dimsSoFar, [`d${idx}`]: row.label };
      if (idx === cfg.dimReports.length - 1) {
        records.push({ dims: nextDims, values: row.values });
      } else if (row.segment) {
        const nextSeg = segment ? `${segment};${row.segment}` : row.segment;
        await expand(idx + 1, nextSeg, nextDims);
      }
    }
  }

  await expand(0, undefined, {});
  return records;
}
