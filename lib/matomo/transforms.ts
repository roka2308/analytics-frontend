import "server-only";
import { matomoRequest } from "./client";
import { withCache } from "./cache";
import type { VisitorsOverview, TopPage, DeviceBreakdown } from "@/types";
import { toMatomoDate, type CompareRange } from "@/lib/dateRange";

interface MatomoVisitsSummary {
  nb_visits: number;
  nb_uniq_visitors: number;
  bounce_rate: string;
  avg_time_on_site: number;
  nb_pageviews: number;
  nb_actions: number;
}

interface MatomoPageRow {
  label: string;
  nb_visits: number;
  nb_hits: number;
}

interface MatomoDeviceRow {
  label: string;
  nb_visits: number;
}

// ──────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ──────────────────────────────────────────────────────────────

function parsePercent(s: string | undefined): number {
  if (!s) return 0;
  const m = s.match(/(-?\d+(?:[.,]\d+)?)/);
  if (!m) return 0;
  return parseFloat(m[1].replace(",", "."));
}

function summaryFromMatomo(data: MatomoVisitsSummary): VisitorsOverview {
  return {
    visits: data.nb_visits ?? 0,
    uniqueVisitors: data.nb_uniq_visitors ?? 0,
    bounceRate: data.bounce_rate ?? "0%",
    bounceRateNum: parsePercent(data.bounce_rate),
    avgVisitDurationSeconds: data.avg_time_on_site ?? 0,
    pageviews: data.nb_pageviews ?? data.nb_actions ?? 0,
  };
}

// ──────────────────────────────────────────────────────────────
// Legacy-API (period/date string) – bleibt erhalten fuer Code,
// der noch nicht auf Range-basierte Calls umgestellt ist.
// ──────────────────────────────────────────────────────────────

export async function getVisitorsOverview(
  siteId: number,
  period: "day" | "week" | "month" | "range" = "week",
  date: string = "last7"
): Promise<VisitorsOverview> {
  const cacheKey = `visitors_overview_${siteId}_${period}_${date}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoVisitsSummary>({
      method: "VisitsSummary.get",
      idSite: siteId,
      period,
      date,
    });
    return summaryFromMatomo(data);
  });
}

export async function getTopPages(
  siteId: number,
  period: "day" | "week" | "month" | "range" = "week",
  date: string = "last7",
  limit = 10
): Promise<TopPage[]> {
  const cacheKey = `top_pages_${siteId}_${period}_${date}_${limit}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoPageRow[]>({
      method: "Actions.getPageUrls",
      idSite: siteId,
      period,
      date,
      filter_limit: limit,
    });

    return (data ?? []).map((row) => ({
      label: row.label,
      visits: row.nb_visits ?? 0,
      pageviews: row.nb_hits ?? 0,
    }));
  });
}

export interface TrendDataPoint {
  date: string;
  Besuche: number;
  /** Optional: Wert aus Vergleichszeitraum (gleicher Index im Array) */
  Vergleich?: number;
}

export async function getVisitorTrend(
  siteId: number,
  days: number = 7
): Promise<TrendDataPoint[]> {
  const cacheKey = `visitor_trend_${siteId}_${days}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<Record<string, { nb_visits: number }>>({
      method: "VisitsSummary.get",
      idSite: siteId,
      period: "day",
      date: `last${days}`,
    });

    return Object.entries(data ?? {}).map(([dateStr, stats]) => ({
      date: new Date(dateStr).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "short",
      }),
      Besuche: stats?.nb_visits ?? 0,
    }));
  });
}

export async function getDeviceBreakdown(
  siteId: number,
  period: "day" | "week" | "month" | "range" = "week",
  date: string = "last7"
): Promise<DeviceBreakdown[]> {
  const cacheKey = `devices_${siteId}_${period}_${date}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoDeviceRow[]>({
      method: "DevicesDetection.getType",
      idSite: siteId,
      period,
      date,
    });

    return (data ?? []).map((row) => ({
      label: row.label,
      visits: row.nb_visits ?? 0,
    }));
  });
}

// ──────────────────────────────────────────────────────────────
// Neue Range-basierte API (Phase C)
// ──────────────────────────────────────────────────────────────

export interface VisitorsOverviewWithCompare {
  current: VisitorsOverview;
  /** Vergleichszeitraum-Werte, falls aktiviert */
  previous: VisitorsOverview | null;
  /**
   * Vorzeichenrichtige Deltas pro Metrik.
   * deltaAbs = current - previous
   * deltaPct = (current - previous) / previous * 100  (null wenn previous = 0)
   */
  delta: {
    visits: { abs: number; pct: number | null };
    pageviews: { abs: number; pct: number | null };
    uniqueVisitors: { abs: number; pct: number | null };
    bounceRate: { abs: number; pct: number | null };
    avgDuration: { abs: number; pct: number | null };
  } | null;
}

function emptyDelta(): VisitorsOverviewWithCompare["delta"] {
  return {
    visits: { abs: 0, pct: null },
    pageviews: { abs: 0, pct: null },
    uniqueVisitors: { abs: 0, pct: null },
    bounceRate: { abs: 0, pct: null },
    avgDuration: { abs: 0, pct: null },
  };
}

function computeDelta(
  current: VisitorsOverview,
  previous: VisitorsOverview
): NonNullable<VisitorsOverviewWithCompare["delta"]> {
  const pct = (curr: number, prev: number): number | null =>
    prev === 0 ? (curr === 0 ? 0 : null) : ((curr - prev) / prev) * 100;

  return {
    visits: { abs: current.visits - previous.visits, pct: pct(current.visits, previous.visits) },
    pageviews: {
      abs: current.pageviews - previous.pageviews,
      pct: pct(current.pageviews, previous.pageviews),
    },
    uniqueVisitors: {
      abs: current.uniqueVisitors - previous.uniqueVisitors,
      pct: pct(current.uniqueVisitors, previous.uniqueVisitors),
    },
    bounceRate: {
      abs: current.bounceRateNum - previous.bounceRateNum,
      pct: pct(current.bounceRateNum, previous.bounceRateNum),
    },
    avgDuration: {
      abs: current.avgVisitDurationSeconds - previous.avgVisitDurationSeconds,
      pct: pct(current.avgVisitDurationSeconds, previous.avgVisitDurationSeconds),
    },
  };
}

export interface RangeInput {
  from: string;
  to: string;
}

export async function getVisitorsOverviewForRange(
  siteId: number,
  range: RangeInput
): Promise<VisitorsOverview> {
  const cacheKey = `vo_range_${siteId}_${range.from}_${range.to}`;
  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoVisitsSummary>({
      method: "VisitsSummary.get",
      idSite: siteId,
      period: "range",
      date: toMatomoDate(range),
    });
    return summaryFromMatomo(data);
  });
}

/**
 * Holt aktuellen Zeitraum + (optional) Vergleichszeitraum parallel.
 * Liefert berechnete Deltas mit.
 */
export async function getVisitorsOverviewWithCompare(
  siteId: number,
  range: RangeInput,
  compareRange: CompareRange | null
): Promise<VisitorsOverviewWithCompare> {
  if (!compareRange) {
    const current = await getVisitorsOverviewForRange(siteId, range);
    return { current, previous: null, delta: null };
  }

  const [current, previous] = await Promise.all([
    getVisitorsOverviewForRange(siteId, range),
    getVisitorsOverviewForRange(siteId, compareRange),
  ]);

  return { current, previous, delta: computeDelta(current, previous) };
}

/**
 * Trend-Linie fuer einen beliebigen Zeitraum (taeglich aufgeschluesselt).
 * Optional mit Vergleichszeitraum als zweite Datenreihe.
 */
export async function getVisitorTrendForRange(
  siteId: number,
  range: RangeInput,
  compareRange: CompareRange | null = null
): Promise<TrendDataPoint[]> {
  const fetchSeries = (r: RangeInput) =>
    withCache(`trend_range_${siteId}_${r.from}_${r.to}`, 600, async () => {
      const data = await matomoRequest<Record<string, { nb_visits: number }>>({
        method: "VisitsSummary.get",
        idSite: siteId,
        period: "day",
        date: toMatomoDate(r),
      });
      return Object.entries(data ?? {}).map(([dateStr, stats]) => ({
        date: dateStr,
        visits: stats?.nb_visits ?? 0,
      }));
    });

  if (!compareRange) {
    const series = await fetchSeries(range);
    return series.map((p) => ({
      date: new Date(p.date).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "short",
      }),
      Besuche: p.visits,
    }));
  }

  const [currentSeries, prevSeries] = await Promise.all([
    fetchSeries(range),
    fetchSeries(compareRange),
  ]);

  // Auf gleiche Anzahl Punkte normalisieren – wir alignen "Tag 1 von N"
  // mit "Tag 1 von N" im Vergleichszeitraum.
  return currentSeries.map((p, i) => ({
    date: new Date(p.date).toLocaleDateString("de-DE", {
      day: "numeric",
      month: "short",
    }),
    Besuche: p.visits,
    Vergleich: prevSeries[i]?.visits ?? 0,
  }));
}

export async function getTopPagesForRange(
  siteId: number,
  range: RangeInput,
  limit = 10
): Promise<TopPage[]> {
  const cacheKey = `top_pages_range_${siteId}_${range.from}_${range.to}_${limit}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoPageRow[]>({
      method: "Actions.getPageUrls",
      idSite: siteId,
      period: "range",
      date: toMatomoDate(range),
      filter_limit: limit,
    });

    return (data ?? []).map((row) => ({
      label: row.label,
      visits: row.nb_visits ?? 0,
      pageviews: row.nb_hits ?? 0,
    }));
  });
}

// ──────────────────────────────────────────────────────────────
// Generische Breakdown-API (Phase H)
// ──────────────────────────────────────────────────────────────

export type BreakdownSource =
  | "device-type"
  | "device-brand"
  | "browser"
  | "os"
  | "country"
  | "referrer-type"
  | "search-engine"
  | "social-network"
  | "event-category"
  | "event-action";

export interface BreakdownEntry {
  label: string;
  visits: number;
}

interface MatomoBreakdownRow {
  label: string;
  nb_visits?: number;
}

const BREAKDOWN_METHODS: Record<BreakdownSource, string> = {
  "device-type": "DevicesDetection.getType",
  "device-brand": "DevicesDetection.getBrand",
  browser: "DevicesDetection.getBrowsers",
  os: "DevicesDetection.getOsFamilies",
  country: "UserCountry.getCountry",
  "referrer-type": "Referrers.getReferrerType",
  "search-engine": "Referrers.getSearchEngines",
  "social-network": "Referrers.getSocials",
  "event-category": "Events.getCategory",
  "event-action": "Events.getAction",
};

export async function getBreakdownForRange(
  source: BreakdownSource,
  siteId: number,
  range: RangeInput,
  limit = 10
): Promise<BreakdownEntry[]> {
  const cacheKey = `breakdown_${source}_${siteId}_${range.from}_${range.to}_${limit}`;
  const method = BREAKDOWN_METHODS[source];

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoBreakdownRow[]>({
      method,
      idSite: siteId,
      period: "range",
      date: toMatomoDate(range),
      filter_limit: limit,
    });

    return (data ?? []).map((row) => ({
      label: row.label ?? "—",
      visits: row.nb_visits ?? 0,
    }));
  });
}

// ──────────────────────────────────────────────────────────────
// Cross-Tab: Top-Pages × Events
// ──────────────────────────────────────────────────────────────

export interface CrossTabCell {
  category: string;
  visits: number;
}

export interface CrossTabRow {
  page: string;
  totalVisits: number;
  topEvents: CrossTabCell[];
}

/**
 * Fuer jede der Top-N Seiten werden parallel die Top-Events
 * (Categories) ueber Matomo-Segment geholt.
 *
 * Hinweis: Das sind O(N) Matomo-Calls pro Widget. Mit Cache (10 Min)
 * fuer normale Dashboard-Nutzung okay. Bei sehr hohen Seitenzahlen
 * sollte topPagesLimit konservativ gewaehlt werden (max 5–10).
 */
export async function getPageEventCrossTab(
  siteId: number,
  range: RangeInput,
  topPagesLimit = 5,
  topEventsPerPage = 3
): Promise<CrossTabRow[]> {
  const cacheKey = `crosstab_pages_events_${siteId}_${range.from}_${range.to}_${topPagesLimit}_${topEventsPerPage}`;

  return withCache(cacheKey, 600, async () => {
    const pages = await getTopPagesForRange(siteId, range, topPagesLimit);
    if (pages.length === 0) return [];

    const eventCalls = pages.map((page) =>
      matomoRequest<MatomoBreakdownRow[]>({
        method: "Events.getCategory",
        idSite: siteId,
        period: "range",
        date: toMatomoDate(range),
        segment: `pageUrl==${encodeURIComponent(page.label)}`,
        filter_limit: topEventsPerPage,
      }).catch(() => [] as MatomoBreakdownRow[])
    );

    const eventResults = await Promise.all(eventCalls);

    return pages.map((page, i) => ({
      page: page.label,
      totalVisits: page.visits,
      topEvents: (eventResults[i] ?? []).map((e) => ({
        category: e.label ?? "—",
        visits: e.nb_visits ?? 0,
      })),
    }));
  });
}
