import type { ReactNode } from "react";
import type { WidgetLayout } from "@/lib/db/queries";

/**
 * Vereinheitlichter Render-Kontext fuer alle Widgets.
 * Wird zentral vom DashboardRenderer an jedes Widget geliefert.
 */
export interface WidgetRenderContext {
  siteId: number;
  period: "day" | "week" | "month" | "range";
  date: string;
  /** Anzahl Tage fuer Trend-Charts (abgeleitet aus period/date) */
  trendDays: number;
}

/**
 * Props, die jede Widget-Komponente bekommt.
 */
export interface WidgetProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  title?: string | null;
  ctx: WidgetRenderContext;
}

/**
 * Eintrag in der Widget-Registry.
 *
 * Bewusst minimal gehalten – fuer Phase B reicht Component + DefaultConfig.
 * In Phase F (Drag-Drop-Editor) kommen configSchema und settingsComponent dazu.
 */
export interface WidgetDefinition<TConfig = Record<string, unknown>> {
  /** Eindeutiger Type-Identifier in der DB-Tabelle dashboard_widgets.type */
  type: string;
  /** Anzeigename im Editor (Phase F) */
  label: string;
  /** Kurzbeschreibung im Editor */
  description: string;
  /** React-Server-Component oder Client-Component */
  component: (props: WidgetProps<TConfig>) => ReactNode | Promise<ReactNode>;
  /** Default-Werte beim Erzeugen einer neuen Widget-Instanz */
  defaultConfig: TConfig;
  /** Empfohlene Default-Groesse im 12-Spalten-Grid */
  defaultLayout: WidgetLayout;
}
