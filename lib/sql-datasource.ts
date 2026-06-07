// =============================================================
//  SqlDataSource – liest die 5 vorberechneten MySQL-Views
//  und normalisiert sie ins gemeinsame Format.
//
//  WICHTIG: Läuft SERVERSEITIG (Next.js Route Handler /
//  Server Component). Niemals im Client – DB-Credentials
//  dürfen nie ins Browser-Bundle.
// =============================================================

import type {
  DataSource,
  DataResult,
  MetricDescriptor,
  Query,
} from "./datasource";

// z.B. mysql2/promise – Pool wird serverseitig einmal erstellt.
// Der konkrete Adapter liegt in lib/sql/pool.ts (server-only).
export interface DbPool {
  query(sql: string, params?: unknown[]): Promise<[Record<string, any>[], unknown]>;
}

// ---- kleine Normalisierungs-Helfer ----------------------------------

// Vereinheitlicht Prozentwerte auf einen Bruch (0..1). Die Views liefern
// teils 0..1, teils 0..100 -> hier wird EINE Konvention erzwungen, damit
// das Frontend einheitlich formatieren kann (siehe docs/sql-views.md).
function toFraction(v: unknown): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return n > 1 ? n / 100 : n;
}

// Errät die Einheit einer Spalte anhand ihres Namens (für Views, deren
// Spalten wir nicht fest kennen, z.B. funnel_channel).
function inferUnit(key: string): "percent" | "currency" | "count" | undefined {
  const k = key.toLowerCase();
  if (/(rate|cvr|conversion|bounce|ratio|pct|percent)/.test(k)) return "percent";
  if (/(revenue|amount|value|price|sales|umsatz)/.test(k)) return "currency";
  if (/(count|sessions|transactions|users|visits|views|orders|quantity|anzahl)/.test(k))
    return "count";
  return undefined;
}

// "total_revenue" -> "Total revenue" (lesbarer Spaltentitel als Fallback)
function humanize(key: string): string {
  const s = key.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export class SqlDataSource implements DataSource {
  readonly id = "sql";
  readonly label = "E-Commerce DB";

  constructor(private db: DbPool) {}

  // Katalog: was die Views deiner Kollegin hergeben
  async listMetrics(): Promise<MetricDescriptor[]> {
    return [
      { id: "monthly_revenue",    label: "Umsatz pro Monat",     kind: "timeseries", source: this.id },
      { id: "funnel_overall",     label: "Conversion gesamt",    kind: "scalar",     source: this.id },
      { id: "revenue_by_channel", label: "Umsatz pro Channel",   kind: "table",      source: this.id },
      { id: "bounce_by_channel",  label: "Bounce-Rate/Channel",  kind: "table",      source: this.id },
      { id: "funnel_channel",     label: "Funnel pro Channel",   kind: "table",      source: this.id },
    ];
  }

  async fetch(metricId: string, query: Query): Promise<DataResult> {
    switch (metricId) {
      case "monthly_revenue":
        return this.monthlyRevenue(query);
      case "funnel_overall":
        return this.funnelOverall();
      case "revenue_by_channel":
        return this.revenueByChannel();
      case "bounce_by_channel":
        return this.bounceByChannel();
      case "funnel_channel":
        return this.funnelChannel();
      default:
        throw new Error(`SQL: unbekannte Metrik ${metricId}`);
    }
  }

  // ---- Zeitreihe ----
  // Die View liefert month "YYYY-MM" -> auf ISO normalisieren,
  // damit es zu Matomos Datumsformat passt.
  private async monthlyRevenue(q: Query): Promise<DataResult> {
    const [rows] = await this.db.query(
      `SELECT month, total_revenue
         FROM monthly_revenue
        WHERE month BETWEEN ? AND ?
        ORDER BY month`,
      [q.from.slice(0, 7), q.to.slice(0, 7)],
    );
    return {
      kind: "timeseries",
      metric: "total_revenue",
      unit: "currency",
      label: "Umsatz pro Monat",
      points: rows.map((r) => ({
        date: `${r.month}-01`,           // "2025-03" -> "2025-03-01"
        value: Number(r.total_revenue),
      })),
    };
  }

  // ---- Einzelwert ----
  private async funnelOverall(): Promise<DataResult> {
    const [rows] = await this.db.query(`SELECT * FROM funnel_overall LIMIT 1`);
    return {
      kind: "scalar",
      metric: "purchase_conversion_rate",
      unit: "percent",
      label: "Purchase Conversion Rate",
      value: toFraction(rows[0].purchase_conversion_rate),
    };
  }

  // ---- Tabelle ----
  private async revenueByChannel(): Promise<DataResult> {
    const [rows] = await this.db.query(`SELECT * FROM revenue_by_channel`);
    return {
      kind: "table",
      label: "Umsatz pro Channel",
      columns: [
        { key: "channel",            label: "Channel" },
        { key: "total_revenue",      label: "Umsatz",    unit: "currency" },
        { key: "total_transactions", label: "Trans.",    unit: "count" },
        { key: "avg_order_value",    label: "Ø Bestellwert", unit: "currency" },
      ],
      rows,
    };
  }

  private async bounceByChannel(): Promise<DataResult> {
    const [rows] = await this.db.query(`SELECT * FROM bounce_by_channel`);
    return {
      kind: "table",
      label: "Bounce-Rate pro Channel",
      columns: [
        { key: "channel",          label: "Channel" },
        { key: "total_sessions",   label: "Sessions",  unit: "count" },
        { key: "bounced_sessions", label: "Bounced",   unit: "count" },
        { key: "bounce_rate",      label: "Bounce %",  unit: "percent" },
      ],
      // Bounce-Rate auf Bruch (0..1) vereinheitlichen
      rows: rows.map((r) => ({ ...r, bounce_rate: toFraction(r.bounce_rate) })),
    };
  }

  // ---- Tabelle (Spalten zur Laufzeit erkannt) ----
  // Die genauen Spalten von funnel_channel sind nicht dokumentiert, daher
  // leiten wir Spalten + Einheiten dynamisch aus der ersten Zeile ab und
  // normalisieren erkannte Prozentspalten auf Bruch (0..1).
  private async funnelChannel(): Promise<DataResult> {
    const [rows] = await this.db.query(`SELECT * FROM funnel_channel`);
    const keys = rows.length ? Object.keys(rows[0]) : [];
    return {
      kind: "table",
      label: "Funnel pro Channel",
      columns: keys.map((key) => ({
        key,
        label: humanize(key),
        unit: inferUnit(key),
      })),
      rows: rows.map((r) => {
        const out: Record<string, string | number> = {};
        for (const k of keys) {
          out[k] = inferUnit(k) === "percent" ? toFraction(r[k]) : r[k];
        }
        return out;
      }),
    };
  }
}
