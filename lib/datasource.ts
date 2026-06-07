// =============================================================
//  Daten-Abstraktionsschicht
//  Ziel: UI weiß nicht, ob Daten aus Matomo oder SQL kommen.
//  Jede Quelle liefert dasselbe normalisierte Format.
// =============================================================

// ----------------------------------------------
// 1) Gemeinsames Query-Objekt
//    Geht an JEDE Quelle. Erzwingt gemeinsame
//    Zeitachse/Granularität -> Voraussetzung fürs Mischen.
// ----------------------------------------------
export type Granularity = "day" | "week" | "month";

export interface Query {
  /** ISO-Date, inkl. */
  from: string;
  /** ISO-Date, inkl. */
  to: string;
  granularity: Granularity;
  /** z.B. { channel: "organic" } – Quelle ignoriert, was sie nicht kennt */
  filters?: Record<string, string>;
}

// ----------------------------------------------
// 2) Die drei normalisierten Ergebnis-Formen
//    (decken Matomo UND die 5 SQL-Views ab)
// ----------------------------------------------

/** Einzelwert / KPI – z.B. funnel_overall, CVR gesamt */
export interface ScalarResult {
  kind: "scalar";
  metric: string;          // "purchase_conversion_rate"
  value: number;           // 0.53
  unit?: "percent" | "currency" | "count";
  label?: string;          // "Purchase Conversion Rate"
}

/** Ein Punkt einer Zeitreihe */
export interface TimePoint {
  date: string;            // normalisiert auf ISO, IMMER gleiches Format
  value: number;
}

/** Zeitreihe – z.B. monthly_revenue */
export interface TimeSeriesResult {
  kind: "timeseries";
  metric: string;          // "total_revenue"
  unit?: "percent" | "currency" | "count";
  label?: string;
  points: TimePoint[];
}

/** Tabelle – z.B. revenue_by_channel, bounce_by_channel */
export interface TableResult {
  kind: "table";
  columns: { key: string; label: string; unit?: string }[];
  rows: Record<string, string | number>[];
  label?: string;
}

export type DataResult = ScalarResult | TimeSeriesResult | TableResult;

// ----------------------------------------------
// 3) Welche Metriken kann eine Quelle liefern?
//    Katalog -> UI kann dynamisch anbieten,
//    welche Quelle was kann.
// ----------------------------------------------
export interface MetricDescriptor {
  id: string;              // "revenue_by_channel"
  label: string;
  kind: DataResult["kind"];
  source: string;          // "matomo" | "sql"
}

// ----------------------------------------------
// 4) Das zentrale Interface
//    Matomo und SQL implementieren BEIDE genau das.
// ----------------------------------------------
export interface DataSource {
  readonly id: string;     // "matomo" | "sql"
  readonly label: string;

  /** Was kann diese Quelle? */
  listMetrics(): Promise<MetricDescriptor[]>;

  /** Eine Metrik in normalisiertem Format holen */
  fetch(metricId: string, query: Query): Promise<DataResult>;
}

// =============================================================
//  5) Aggregations-/Registry-Schicht
//     Hier wird gemischt ODER durchgereicht.
//     UI redet NUR mit dieser Schicht.
// =============================================================
export class DataRegistry {
  private sources = new Map<string, DataSource>();

  register(source: DataSource) {
    this.sources.set(source.id, source);
  }

  /** Getrennte View: genau eine Quelle */
  async fetchFrom(
    sourceId: string,
    metricId: string,
    query: Query,
  ): Promise<DataResult> {
    const src = this.sources.get(sourceId);
    if (!src) throw new Error(`Unknown source: ${sourceId}`);
    return src.fetch(metricId, query);
  }

  /**
   * Kombinierte View: dieselbe Metrik-Art aus mehreren Quellen,
   * zu EINER Zeitreihe pro Quelle zusammengeführt.
   * Voraussetzung: gleiche Query (from/to/granularity) an alle.
   */
  async fetchCombinedTimeSeries(
    requests: { sourceId: string; metricId: string }[],
    query: Query,
  ): Promise<{ series: { name: string; points: TimePoint[] }[] }> {
    const results = await Promise.all(
      requests.map(async (r) => {
        const res = await this.fetchFrom(r.sourceId, r.metricId, query);
        if (res.kind !== "timeseries") {
          throw new Error(
            `${r.sourceId}/${r.metricId} ist kein timeseries-Ergebnis`,
          );
        }
        return { name: `${res.label ?? res.metric} (${r.sourceId})`, points: res.points };
      }),
    );
    return { series: results };
  }

  async listAllMetrics(): Promise<MetricDescriptor[]> {
    const all = await Promise.all(
      Array.from(this.sources.values()).map((s) => s.listMetrics()),
    );
    return all.flat();
  }
}
