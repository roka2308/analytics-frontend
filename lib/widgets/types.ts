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

export interface WidgetDefinition<TConfig = Record<string, unknown>> {
  type: string;
  label: string;
  description: string;
  component: (props: WidgetProps<TConfig>) => ReactNode | Promise<ReactNode>;
  defaultConfig: TConfig;
  defaultLayout: WidgetLayout;
}
