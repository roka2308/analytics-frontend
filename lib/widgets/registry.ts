import { KpiCardWidget, type KpiCardConfig } from "@/components/widgets/KpiCardWidget";
import { LineChartWidget, type LineChartConfig } from "@/components/widgets/LineChartWidget";
import { TopListWidget, type TopListConfig } from "@/components/widgets/TopListWidget";
import { TextBlockWidget, type TextBlockConfig } from "@/components/widgets/TextBlockWidget";
import {
  BreakdownWidget,
  type BreakdownConfig,
} from "@/components/widgets/BreakdownWidget";
import { DonutWidget, type DonutConfig } from "@/components/widgets/DonutWidget";
import {
  BarChartWidget,
  type BarChartConfig,
} from "@/components/widgets/BarChartWidget";
import {
  CrossTabWidget,
  type CrossTabConfig,
} from "@/components/widgets/CrossTabWidget";
import type { WidgetDefinition } from "./types";

/**
 * Zentrale Registry aller verfuegbaren Widget-Typen.
 *
 * Neuen Widget-Typ hinzufuegen:
 *  1) Komponente in components/widgets/<Name>Widget.tsx anlegen
 *  2) Hier importieren und in WIDGET_REGISTRY eintragen
 *  3) Fertig – keine Schema- oder Renderer-Aenderung noetig.
 */
export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  "kpi-card": {
    type: "kpi-card",
    label: "KPI-Karte",
    description: "Eine Kennzahl gross dargestellt (Besuche, Bounce Rate, etc.).",
    component: KpiCardWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { metric: "visits", accent: false } satisfies KpiCardConfig,
    defaultLayout: { x: 0, y: 0, w: 3, h: 2 },
  },
  "line-chart": {
    type: "line-chart",
    label: "Liniendiagramm",
    description: "Trend einer Kennzahl ueber Zeit (taeglich).",
    component: LineChartWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { metric: "visits" } satisfies LineChartConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 4 },
  },
  "top-list": {
    type: "top-list",
    label: "Top-Liste",
    description: "Tabelle mit den Top-Eintraegen (z.B. Top-Seiten).",
    component: TopListWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { source: "pages", limit: 10 } satisfies TopListConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 6 },
  },
  "text-block": {
    type: "text-block",
    label: "Text-Block",
    description: "Beliebiger Text/Hinweis zur Strukturierung des Dashboards.",
    component: TextBlockWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { text: "Neue Notiz", variant: "body" } satisfies TextBlockConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 2 },
  },
  // Phase H – neue Visualisierungs-Typen
  breakdown: {
    type: "breakdown",
    label: "Breakdown-Tabelle",
    description:
      "Top-N einer Dimension als Tabelle (z.B. Geraete, Laender, Browser).",
    component: BreakdownWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { source: "device-type", limit: 10 } satisfies BreakdownConfig,
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
  },
  donut: {
    type: "donut",
    label: "Donut-Diagramm",
    description: "Anteilige Verteilung einer Dimension als Tortendiagramm.",
    component: DonutWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { source: "device-type", limit: 6 } satisfies DonutConfig,
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
  },
  "bar-chart": {
    type: "bar-chart",
    label: "Balken-Diagramm",
    description: "Horizontale Balken fuer Rankings (z.B. Traffic-Quellen).",
    component: BarChartWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { source: "referrer-type", limit: 8 } satisfies BarChartConfig,
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
  },
  "cross-tab": {
    type: "cross-tab",
    label: "Pivot-Tabelle (Seiten × Events)",
    description: "Verknuepfung von Top-Seiten mit ihren Top-Ereignissen.",
    component: CrossTabWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { topPagesLimit: 5, topEventsPerPage: 3 } satisfies CrossTabConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 6 },
  },
};

export function getWidgetDefinition(type: string): WidgetDefinition | null {
  return WIDGET_REGISTRY[type] ?? null;
}

export function listWidgetDefinitions(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY);
}
