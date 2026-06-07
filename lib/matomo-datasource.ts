// =============================================================
//  MatomoDataSource – legt die bestehende Matomo-Schicht
//  (lib/matomo/*) hinter das gemeinsame DataSource-Interface.
//
//  WICHTIG: server-only. Holt Token/URL aus .env.local, ruft die
//  bereits gecachte Transform-Schicht auf und normalisiert in die
//  drei gemeinsamen Formate (scalar / timeseries / table).
//
//  siteId: Das gemeinsame Query-Objekt kennt keine siteId. Matomo
//  braucht sie -> wir lesen sie aus query.filters.siteId, sonst
//  DEFAULT_MATOMO_SITE_ID. So bleibt die Einzel-Registrierung intakt.
// =============================================================
import "server-only";
import type {
  DataSource,
  DataResult,
  MetricDescriptor,
  Query,
  TimeSeriesResult,
} from "./datasource";
import { matomoRequest } from "./matomo/client";
import { withCache } from "./matomo/cache";
import {
  getVisitorsOverviewForRange,
  getTopPagesForRange,
  getBreakdownForRange,
  type BreakdownSource,
} from "./matomo/transforms";

// Breakdown-Metriken: metricId -> Matomo-Breakdown-Quelle
const BREAKDOWN_METRICS: Record<string, { source: BreakdownSource; label: string }> = {
  country:        { source: "country",        label: "Länder" },
  device_type:    { source: "device-type",    label: "Gerätetypen" },
  browser:        { source: "browser",        label: "Browser" },
  os:             { source: "os",             label: "Betriebssysteme" },
  referrer_type:  { source: "referrer-type",  label: "Referrer-Typen" },
  search_engine:  { source: "search-engine",  label: "Suchmaschinen" },
  social_network: { source: "social-network", label: "Soziale Netzwerke" },
  event_category: { source: "event-category", label: "Event-Kategorien" },
  event_action:   { source: "event-action",   label: "Event-Aktionen" },
};

// Matomo liefert Zeitreihen als Objekt mit Datums-Keys ("2024-03-05" bzw.
// für week/month als Range-/Pretty-Strings). Wir ziehen das ISO-Datum heraus.
function normalizeMatomoDateKey(key: string): string {
  const m = key.match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : key;
}

interface VisitsSummaryRow {
  nb_visits?: number;
}

export class MatomoDataSource implements DataSource {
  readonly id = "matomo";
  readonly label = "Matomo Web-Analytics";

  private siteId(q: Query): number {
    const fromFilter = q.filters?.siteId;
    const fallback = process.env.DEFAULT_MATOMO_SITE_ID;
    const raw = fromFilter ?? fallback;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      throw new Error(
        "Matomo: keine siteId (query.filters.siteId oder DEFAULT_MATOMO_SITE_ID setzen)",
      );
    }
    return n;
  }

  async listMetrics(): Promise<MetricDescriptor[]> {
    const scalars: MetricDescriptor[] = [
      { id: "visits",             label: "Besuche",            kind: "scalar", source: this.id },
      { id: "unique_visitors",    label: "Eindeutige Besucher", kind: "scalar", source: this.id },
      { id: "pageviews",          label: "Seitenaufrufe",      kind: "scalar", source: this.id },
      { id: "bounce_rate",        label: "Absprungrate",       kind: "scalar", source: this.id },
      { id: "avg_visit_duration", label: "Ø Besuchsdauer",     kind: "scalar", source: this.id },
    ];
    const series: MetricDescriptor[] = [
      { id: "visits_timeseries", label: "Besuche (Verlauf)", kind: "timeseries", source: this.id },
    ];
    const tables: MetricDescriptor[] = [
      { id: "top_pages", label: "Top-Seiten", kind: "table", source: this.id },
      ...Object.entries(BREAKDOWN_METRICS).map(([id, def]) => ({
        id,
        label: def.label,
        kind: "table" as const,
        source: this.id,
      })),
    ];
    return [...scalars, ...series, ...tables];
  }

  async fetch(metricId: string, query: Query): Promise<DataResult> {
    const siteId = this.siteId(query);
    const range = { from: query.from, to: query.to };

    if (metricId === "visits_timeseries") {
      return this.visitsTimeseries(siteId, query);
    }
    if (metricId === "top_pages") {
      return this.topPages(siteId, range);
    }
    if (metricId in BREAKDOWN_METRICS) {
      return this.breakdown(metricId, siteId, range);
    }
    // sonst: Scalar aus der VisitsSummary
    return this.scalar(metricId, siteId, range);
  }

  // ---- Scalars (VisitsSummary) ----
  private async scalar(
    metricId: string,
    siteId: number,
    range: { from: string; to: string },
  ): Promise<DataResult> {
    const o = await getVisitorsOverviewForRange(siteId, range);
    switch (metricId) {
      case "visits":
        return { kind: "scalar", metric: "nb_visits", unit: "count", label: "Besuche", value: o.visits };
      case "unique_visitors":
        return { kind: "scalar", metric: "nb_uniq_visitors", unit: "count", label: "Eindeutige Besucher", value: o.uniqueVisitors };
      case "pageviews":
        return { kind: "scalar", metric: "nb_pageviews", unit: "count", label: "Seitenaufrufe", value: o.pageviews };
      case "bounce_rate":
        // bounceRateNum ist 0..100 -> auf Bruch (0..1) wie bei der SQL-Quelle
        return { kind: "scalar", metric: "bounce_rate", unit: "percent", label: "Absprungrate", value: o.bounceRateNum / 100 };
      case "avg_visit_duration":
        // Sekunden – keine passende Einheit im Schema, daher ohne unit
        return { kind: "scalar", metric: "avg_time_on_site", label: "Ø Besuchsdauer (Sek.)", value: o.avgVisitDurationSeconds };
      default:
        throw new Error(`Matomo: unbekannte Metrik ${metricId}`);
    }
  }

  // ---- Zeitreihe (Besuche je Periode, ISO-Datum) ----
  private async visitsTimeseries(siteId: number, q: Query): Promise<TimeSeriesResult> {
    const key = `ds_visits_ts_${siteId}_${q.granularity}_${q.from}_${q.to}`;
    const points = await withCache(key, 600, async () => {
      const data = await matomoRequest<Record<string, VisitsSummaryRow>>({
        method: "VisitsSummary.get",
        idSite: siteId,
        period: q.granularity,
        date: `${q.from},${q.to}`,
      });
      return Object.entries(data ?? {}).map(([dateKey, stats]) => ({
        date: normalizeMatomoDateKey(dateKey),
        value: Number(stats?.nb_visits ?? 0),
      }));
    });
    return { kind: "timeseries", metric: "nb_visits", unit: "count", label: "Besuche", points };
  }

  // ---- Tabelle: Top-Seiten ----
  private async topPages(
    siteId: number,
    range: { from: string; to: string },
  ): Promise<DataResult> {
    const pages = await getTopPagesForRange(siteId, range, 10);
    return {
      kind: "table",
      label: "Top-Seiten",
      columns: [
        { key: "label",     label: "Seite" },
        { key: "visits",    label: "Besuche",       unit: "count" },
        { key: "pageviews", label: "Seitenaufrufe", unit: "count" },
      ],
      rows: pages.map((p) => ({ label: p.label, visits: p.visits, pageviews: p.pageviews })),
    };
  }

  // ---- Tabelle: generischer Breakdown ----
  private async breakdown(
    metricId: string,
    siteId: number,
    range: { from: string; to: string },
  ): Promise<DataResult> {
    const def = BREAKDOWN_METRICS[metricId];
    const entries = await getBreakdownForRange(def.source, siteId, range, 10);
    return {
      kind: "table",
      label: def.label,
      columns: [
        { key: "label",  label: def.label },
        { key: "visits", label: "Besuche", unit: "count" },
      ],
      rows: entries.map((e) => ({ label: e.label, visits: e.visits })),
    };
  }
}
