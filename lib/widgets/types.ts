import type { ReactNode } from "react";
import type { WidgetLayout } from "@/lib/db/queries";
import type { CompareRange, DateRangeValue } from "@/lib/dateRange";

/**
 * Vereinheitlichter Render-Kontext fuer alle Widgets.
 * Wird zentral vom DashboardRenderer an jedes Widget geliefert.
 */
export interface WidgetRenderContext {
  siteId: number;
  /** Aktiver Zeitraum (komplett aufgeloest) */
  range: DateRangeValue;
  /** Berechneter Vergleichszeitraum, oder null wenn deaktiviert */
  compareRange: CompareRange | null;
}

export interface WidgetProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  title?: string | null;
  ctx: WidgetRenderContext;
}

/**
 * Schema fuer eine einzelne Widget-Config-Property.
 * Wird verwendet, um automatisch Forms zur Konfiguration zu generieren.
 *
 * Bewusst minimal: text, number, select.
 * Erweiterbar in spaeteren Phasen (boolean, color, etc.).
 */
export type WidgetConfigFieldType = "text" | "number" | "select" | "checkbox";

export interface WidgetConfigField {
  key: string;
  label: string;
  type: WidgetConfigFieldType;
  description?: string;
  options?: { value: string; label: string }[];
  /** Default-Wert, falls in der Config nicht gesetzt */
  defaultValue?: string | number | boolean;
}

export interface WidgetDefinition<TConfig = Record<string, unknown>> {
  type: string;
  label: string;
  description: string;
  component: (props: WidgetProps<TConfig>) => ReactNode | Promise<ReactNode>;
  defaultConfig: TConfig;
  defaultLayout: WidgetLayout;
  /** Optional: Schema fuer die Konfigurations-UI (Phase I.1) */
  configSchema?: WidgetConfigField[];
}
