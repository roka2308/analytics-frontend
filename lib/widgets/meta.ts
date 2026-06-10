/**
 * Widget-META-Informationen, getrennt von den Widget-Komponenten.
 *
 * WICHTIG: Diese Datei darf KEINE Widget-Komponenten importieren,
 * weil sie auch in Client-Components verwendet wird. Widget-Komponenten
 * sind Server-Components, die wiederum server-only Matomo-Code laden.
 *
 * Server-Code nutzt weiterhin lib/widgets/registry.ts (mit components).
 * Client-Code (z.B. Editor-UI) nutzt diese Meta-Datei.
 */

import type { WidgetConfigField } from "./types";
import type { WidgetLayout } from "@/lib/db/queries";

export interface WidgetMeta {
  type: string;
  label: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  defaultLayout: WidgetLayout;
  configSchema?: WidgetConfigField[];
  /** true = eigene Config-UI im Editor (statt generischem Schema-Form) */
  customConfig?: boolean;
}

const METRIC_OPTIONS = [
  { value: "visits", label: "Besuche" },
  { value: "uniqueVisitors", label: "Unique Visitors" },
  { value: "pageviews", label: "Seitenaufrufe" },
  { value: "bounceRate", label: "Bounce Rate" },
  { value: "avgDuration", label: "Ø Verweildauer" },
];

export const WIDGET_META: Record<string, WidgetMeta> = {
  "kpi-card": {
    type: "kpi-card",
    label: "KPI-Karte",
    description: "Eine Kennzahl gross dargestellt (Besuche, Bounce Rate, etc.).",
    defaultConfig: { metric: "visits", accent: false },
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
    defaultConfig: { metric: "visits" },
    defaultLayout: { x: 0, y: 0, w: 12, h: 4 },
    configSchema: [
      { key: "metric", label: "Kennzahl", type: "select", options: [{ value: "visits", label: "Besuche" }], defaultValue: "visits" },
    ],
  },
  "top-list": {
    type: "top-list",
    label: "Top-Liste",
    description: "Tabelle mit den Top-Eintraegen (z.B. Top-Seiten).",
    defaultConfig: { source: "pages", limit: 10 },
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
    defaultConfig: { text: "Neue Notiz", variant: "body" },
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
    defaultConfig: { apiModule: "UserCountry", apiAction: "getCountry", metric: "nb_visits", limit: 10, reportLabel: "Land" },
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
    customConfig: true,
  },
  donut: {
    type: "donut",
    label: "Donut-Diagramm",
    description: "Anteilige Verteilung einer beliebigen Dimension als Tortendiagramm.",
    defaultConfig: { apiModule: "DevicesDetection", apiAction: "getType", metric: "nb_visits", limit: 6, reportLabel: "Gerätetyp" },
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
    customConfig: true,
  },
  "bar-chart": {
    type: "bar-chart",
    label: "Balken-Diagramm",
    description: "Horizontale Balken fuer Rankings beliebiger Dimensionen.",
    defaultConfig: { apiModule: "Referrers", apiAction: "getReferrerType", metric: "nb_visits", limit: 8, reportLabel: "Traffic-Quelle" },
    defaultLayout: { x: 0, y: 0, w: 6, h: 6 },
    customConfig: true,
  },
  "cross-tab": {
    type: "cross-tab",
    label: "Pivot-Tabelle (Seiten × Events)",
    description: "Verknuepfung von Top-Seiten mit ihren Top-Ereignissen.",
    defaultConfig: { topPagesLimit: 5, topEventsPerPage: 3 },
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
    defaultConfig: { display: "table", limit: 10 },
    defaultLayout: { x: 0, y: 0, w: 12, h: 6 },
    customConfig: true,
  },
};

export function getWidgetMeta(type: string): WidgetMeta | null {
  return WIDGET_META[type] ?? null;
}

export function listWidgetMeta(): WidgetMeta[] {
  return Object.values(WIDGET_META);
}
