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
import {
  ReportWidget,
  type ReportWidgetConfig,
} from "@/components/widgets/ReportWidget";
import type { WidgetDefinition } from "./types";

/**
 * Zentrale Registry aller verfuegbaren Widget-Typen.
 *
 * Neuen Widget-Typ hinzufuegen:
 *  1) Komponente in components/widgets/<Name>Widget.tsx anlegen
 *  2) Hier importieren und in WIDGET_REGISTRY eintragen
 *  3) Fertig – keine Schema- oder Renderer-Aenderung noetig.
 */
const METRIC_OPTIONS = [
  { value: "visits", label: "Besuche" },
  { value: "uniqueVisitors", label: "Unique Visitors" },
  { value: "pageviews", label: "Seitenaufrufe" },
  { value: "bounceRate", label: "Bounce Rate" },
  { value: "avgDuration", label: "Ø Verweildauer" },
];

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  "kpi-card": {
    type: "kpi-card",
    label: "KPI-Karte",
    description: "Eine Kennzahl gross dargestellt (Besuche, Bounce Rate, etc.).",
    component: KpiCardWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { metric: "visits", accent: false } satisfies KpiCardConfig,
    defaultLayout: { x: 0, y: 0, w: 3, h: 2 },
    configSchema: [
      { key: "metric", label: "Kennzahl", type: "select", options: METRIC_OPTIONS, defaultValue: "visits" },
      { key: "accent", label: "Magenta-Akzent", type: "checkbox", description: "Hebt die Karte mit Akzent-Linie oben hervor", defaultValue: false },
    ],
  },
  "line-chart": {
    type: "line-chart",
    label: "Liniendiagramm",
    description: "Trend einer Kennzahl ueber Zeit (taeglich).",
    component: LineChartWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { metric: "visits" } satisfies LineChartConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 4 },
    configSchema: [
      { key: "metric", label: "Kennzahl", type: "select", options: [{ value: "visits", label: "Besuche" }], defaultValue: "visits" },
    ],
  },
  "top-list": {
    type: "top-list",
    label: "Top-Liste",
    description: "Tabelle mit den Top-Eintraegen (z.B. Top-Seiten).",
    component: TopListWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { source: "pages", limit: 10 } satisfies TopListConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 6 },
    configSchema: [
      { key: "source", label: "Quelle", type: "select", options: [{ value: "pages", label: "Seiten" }], defaultValue: "pages" },
      { key: "limit", label: "Anzahl Eintraege", type: "number", defaultValue: 10 },
    ],
  },
  "text-block": {
    type: "text-block",
    label: "Text-Block",
    description: "Beliebiger Text/Hinweis zur Strukturierung des Dashboards.",
    component: TextBlockWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { text: "Neue Notiz", variant: "body" } satisfies TextBlockConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 2 },
    configSchema: [
      { key: "text", label: "Text", type: "text", defaultValue: "Neue Notiz" },
      { key: "variant", label: "Stil", type: "select", options: [{ value: "body", label: "Normal" }, { value: "heading", label: "Überschrift" }], defaultValue: "body" },
    ],
  },
  breakdown: {
    type: "breakdown",
    label: "Breakdown-Tabelle",
    description: "Top-N einer beliebigen Dimension als Tabelle (jede Matomo-Dimension + Metrik).",
    component: BreakdownWidget as unknown as WidgetDefinition["component"],
    defaultConfig: {
      apiModule: "UserCountry",
      apiAction: "getCountry",
      metric: "nb_visits",
      limit: 10,
      reportLabel: "Land",
    } satisfies BreakdownConfig,
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
  },
  donut: {
    type: "donut",
    label: "Donut-Diagramm",
    description: "Anteilige Verteilung einer beliebigen Dimension als Tortendiagramm.",
    component: DonutWidget as unknown as WidgetDefinition["component"],
    defaultConfig: {
      apiModule: "DevicesDetection",
      apiAction: "getType",
      metric: "nb_visits",
      limit: 6,
      reportLabel: "Gerätetyp",
    } satisfies DonutConfig,
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
  },
  "bar-chart": {
    type: "bar-chart",
    label: "Balken-Diagramm",
    description: "Horizontale Balken fuer Rankings beliebiger Dimensionen.",
    component: BarChartWidget as unknown as WidgetDefinition["component"],
    defaultConfig: {
      apiModule: "Referrers",
      apiAction: "getReferrerType",
      metric: "nb_visits",
      limit: 8,
      reportLabel: "Traffic-Quelle",
    } satisfies BarChartConfig,
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
  },
  "cross-tab": {
    type: "cross-tab",
    label: "Pivot-Tabelle (Seiten × Events)",
    description: "Verknuepfung von Top-Seiten mit ihren Top-Ereignissen.",
    component: CrossTabWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { topPagesLimit: 5, topEventsPerPage: 3 } satisfies CrossTabConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 6 },
    configSchema: [
      { key: "topPagesLimit", label: "Anzahl Top-Seiten", type: "number", defaultValue: 5 },
      { key: "topEventsPerPage", label: "Events je Seite", type: "number", defaultValue: 3 },
    ],
  },
  report: {
    type: "report",
    label: "Report-Explorer",
    description:
      "Beliebigen Matomo-Report (jede Dimension) mit frei waehlbaren Metriken – als Tabelle, Balken oder Donut.",
    component: ReportWidget as unknown as WidgetDefinition["component"],
    defaultConfig: { display: "table", limit: 10 } satisfies ReportWidgetConfig,
    defaultLayout: { x: 0, y: 0, w: 12, h: 6 },
    // Eigene, katalog-getriebene Config-UI (kein statisches configSchema)
  },
};

export function getWidgetDefinition(type: string): WidgetDefinition | null {
  return WIDGET_REGISTRY[type] ?? null;
}

export function listWidgetDefinitions(): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY);
}
