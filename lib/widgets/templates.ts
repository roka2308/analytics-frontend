/**
 * Dashboard-Templates: vordefinierte Widget-Sets für typische
 * Web-Analytics-Anwendungsfälle.
 *
 * Templates bringen mit:
 *  - widgets[]: Liste von Widget-Specs (Type, Layout, Config, Titel)
 *  - defaultRange: empfohlene Default-Zeitraum-Werte fuer das Dashboard
 *    (siehe Phase F – wird beim Anlegen direkt persistiert)
 *
 * Neue Templates hinzufuegen:
 *  - Hier einen Eintrag ergaenzen
 *  - Optional: in TEMPLATE_GROUPS gruppieren fuer die UI
 *  - createDashboardAction findet sie automatisch
 */

import type { WidgetLayout } from "@/lib/db/queries";

export interface TemplateWidgetSpec {
  type: string;
  title?: string | null;
  layout: WidgetLayout;
  config: Record<string, unknown>;
  position: number;
}

export interface TemplateDefaultRange {
  preset: string | null;
  compare: string | null;
}

export interface DashboardTemplate {
  id: string;
  label: string;
  description: string;
  /** Kurzer Anwendungshinweis fuer die UI */
  bestFor?: string;
  defaultRange?: TemplateDefaultRange;
  widgets: TemplateWidgetSpec[];
}

// ──────────────────────────────────────────────────────────────
// Wiederverwendbare Layout-Bausteine
// ──────────────────────────────────────────────────────────────

const ROW_4_KPIS: TemplateWidgetSpec[] = [
  {
    type: "kpi-card",
    title: null,
    layout: { x: 0, y: 0, w: 3, h: 2 },
    config: { metric: "visits", accent: true },
    position: 0,
  },
  {
    type: "kpi-card",
    title: null,
    layout: { x: 3, y: 0, w: 3, h: 2 },
    config: { metric: "pageviews" },
    position: 1,
  },
  {
    type: "kpi-card",
    title: null,
    layout: { x: 6, y: 0, w: 3, h: 2 },
    config: { metric: "bounceRate" },
    position: 2,
  },
  {
    type: "kpi-card",
    title: null,
    layout: { x: 9, y: 0, w: 3, h: 2 },
    config: { metric: "avgDuration" },
    position: 3,
  },
];

const FULL_LINE_CHART: TemplateWidgetSpec = {
  type: "line-chart",
  title: "Besuchertrend – täglich",
  layout: { x: 0, y: 2, w: 12, h: 4 },
  config: { metric: "visits" },
  position: 10,
};

const FULL_TOP_PAGES: TemplateWidgetSpec = {
  type: "top-list",
  title: "Top-Seiten",
  layout: { x: 0, y: 6, w: 12, h: 6 },
  config: { source: "pages", limit: 10 },
  position: 20,
};

// ──────────────────────────────────────────────────────────────
// Template-Definitionen
// ──────────────────────────────────────────────────────────────

export const TEMPLATES: Record<string, DashboardTemplate> = {
  empty: {
    id: "empty",
    label: "Leer",
    description: "Keine Widgets – starte mit einem komplett leeren Dashboard.",
    widgets: [],
  },

  "kpi-basics": {
    id: "kpi-basics",
    label: "KPI-Grundlage",
    description: "Die vier Grundkennzahlen als Einstieg.",
    bestFor: "Schneller Überblick",
    widgets: [...ROW_4_KPIS],
  },

  onlineshop: {
    id: "onlineshop",
    label: "Onlineshop / E-Commerce",
    description:
      "Kennzahlen-Set für Shops mit Fokus auf Traffic-Qualität, Quellen und Conversion-Pfade.",
    bestFor: "Shopify, WooCommerce, Magento etc.",
    defaultRange: { preset: "30", compare: "previous" },
    widgets: [
      ...ROW_4_KPIS,
      { ...FULL_LINE_CHART },
      {
        type: "donut",
        title: "Traffic-Quellen",
        layout: { x: 0, y: 6, w: 6, h: 6 },
        config: { source: "referrer-type", limit: 6, metricRefId: "referrer-type" },
        position: 11,
      },
      {
        type: "bar-chart",
        title: "Geräte-Verteilung",
        layout: { x: 6, y: 6, w: 6, h: 6 },
        config: { source: "device-type", limit: 6, metricRefId: "device-type" },
        position: 12,
      },
      {
        ...FULL_TOP_PAGES,
        title: "Meistbesuchte Produktseiten",
        layout: { x: 0, y: 12, w: 12, h: 6 },
      },
    ],
  },

  "b2b-lead-gen": {
    id: "b2b-lead-gen",
    label: "B2B-Website / Lead-Generierung",
    description:
      "Fokus auf Reichweite, Engagement-Qualität und Lead-relevante Seiten.",
    bestFor: "Beratung, Software-B2B, Industrie",
    defaultRange: { preset: "this-month", compare: "year" },
    widgets: [
      {
        type: "kpi-card",
        title: null,
        layout: { x: 0, y: 0, w: 3, h: 2 },
        config: { metric: "uniqueVisitors", accent: true },
        position: 0,
      },
      {
        type: "kpi-card",
        title: null,
        layout: { x: 3, y: 0, w: 3, h: 2 },
        config: { metric: "visits" },
        position: 1,
      },
      {
        type: "kpi-card",
        title: null,
        layout: { x: 6, y: 0, w: 3, h: 2 },
        config: { metric: "avgDuration" },
        position: 2,
      },
      {
        type: "kpi-card",
        title: null,
        layout: { x: 9, y: 0, w: 3, h: 2 },
        config: { metric: "bounceRate" },
        position: 3,
      },
      { ...FULL_LINE_CHART },
      {
        type: "donut",
        title: "Traffic-Quellen",
        layout: { x: 0, y: 6, w: 6, h: 6 },
        config: { source: "referrer-type", limit: 6, metricRefId: "referrer-type" },
        position: 11,
      },
      {
        type: "bar-chart",
        title: "Top-Länder",
        layout: { x: 6, y: 6, w: 6, h: 6 },
        config: { source: "country", limit: 8, metricRefId: "country" },
        position: 12,
      },
      {
        ...FULL_TOP_PAGES,
        title: "Meistbesuchte Lösungs- und Service-Seiten",
        layout: { x: 0, y: 12, w: 12, h: 6 },
      },
    ],
  },

  "content-blog": {
    id: "content-blog",
    label: "Content / Blog / Magazin",
    description:
      "Engagement-zentrierte Sicht für Content-Marketing und redaktionelle Sites.",
    bestFor: "Blog, Magazin, Knowledge-Hub",
    defaultRange: { preset: "30", compare: "previous" },
    widgets: [
      {
        type: "kpi-card",
        title: null,
        layout: { x: 0, y: 0, w: 3, h: 2 },
        config: { metric: "visits", accent: true },
        position: 0,
      },
      {
        type: "kpi-card",
        title: null,
        layout: { x: 3, y: 0, w: 3, h: 2 },
        config: { metric: "uniqueVisitors" },
        position: 1,
      },
      {
        type: "kpi-card",
        title: null,
        layout: { x: 6, y: 0, w: 3, h: 2 },
        config: { metric: "avgDuration" },
        position: 2,
      },
      {
        type: "kpi-card",
        title: null,
        layout: { x: 9, y: 0, w: 3, h: 2 },
        config: { metric: "pageviews" },
        position: 3,
      },
      { ...FULL_LINE_CHART },
      { ...FULL_TOP_PAGES, title: "Meistgelesene Artikel" },
      {
        type: "text-block",
        title: "Lesetipp",
        layout: { x: 0, y: 12, w: 12, h: 2 },
        config: {
          text:
            "Lange Ø Verweildauer ist bei Content meist ein gutes Zeichen – Nutzer lesen wirklich. Achte bei Top-Artikeln auf interne Verlinkung zu verwandten Themen, um Pageviews pro Besuch zu erhöhen.",
          variant: "body",
        },
        position: 30,
      },
    ],
  },

  "landing-page": {
    id: "landing-page",
    label: "Landing-Page / Kampagne",
    description:
      "Schnelle, fokussierte Übersicht für eine einzelne Kampagne oder LP.",
    bestFor: "Performance-Kampagnen, Produkt-Launches",
    defaultRange: { preset: "7", compare: "previous" },
    widgets: [
      {
        type: "kpi-card",
        title: null,
        layout: { x: 0, y: 0, w: 4, h: 2 },
        config: { metric: "visits", accent: true },
        position: 0,
      },
      {
        type: "kpi-card",
        title: null,
        layout: { x: 4, y: 0, w: 4, h: 2 },
        config: { metric: "bounceRate" },
        position: 1,
      },
      {
        type: "kpi-card",
        title: null,
        layout: { x: 8, y: 0, w: 4, h: 2 },
        config: { metric: "avgDuration" },
        position: 2,
      },
      { ...FULL_LINE_CHART },
      {
        type: "text-block",
        title: "Kampagnen-Tracking",
        layout: { x: 0, y: 6, w: 12, h: 2 },
        config: {
          text:
            "Für genaue Kampagnenmessung markiere alle Anzeigen-Links mit utm_source, utm_medium und utm_campaign. So kannst du in Matomo später unter Akquisition genau sehen, welche Quelle welche Konversionen bringt.",
          variant: "body",
        },
        position: 10,
      },
    ],
  },

  "saas-app": {
    id: "saas-app",
    label: "SaaS / Web-App",
    description:
      "Nutzungs-orientierte Sicht für Web-Anwendungen mit eingeloggten Nutzern.",
    bestFor: "Web-Apps, Tools, Plattformen",
    defaultRange: { preset: "30", compare: "previous" },
    widgets: [
      {
        type: "kpi-card",
        title: "Aktive Nutzer",
        layout: { x: 0, y: 0, w: 3, h: 2 },
        config: { metric: "uniqueVisitors", accent: true },
        position: 0,
      },
      {
        type: "kpi-card",
        title: "Sessions",
        layout: { x: 3, y: 0, w: 3, h: 2 },
        config: { metric: "visits" },
        position: 1,
      },
      {
        type: "kpi-card",
        title: "Aktionen / Aufrufe",
        layout: { x: 6, y: 0, w: 3, h: 2 },
        config: { metric: "pageviews" },
        position: 2,
      },
      {
        type: "kpi-card",
        title: "Ø Session-Dauer",
        layout: { x: 9, y: 0, w: 3, h: 2 },
        config: { metric: "avgDuration" },
        position: 3,
      },
      { ...FULL_LINE_CHART, title: "Nutzungstrend" },
      {
        ...FULL_TOP_PAGES,
        title: "Meistgenutzte Bereiche",
      },
    ],
  },

  "social-intranet": {
    id: "social-intranet",
    label: "Social Intranet / internes Portal",
    description:
      "Engagement der Belegschaft im internen Portal – Aktivität und beliebte Inhalte.",
    bestFor: "Confluence, SharePoint, Custom-Intranet",
    defaultRange: { preset: "7", compare: "previous" },
    widgets: [
      {
        type: "kpi-card",
        title: "Aktive Mitarbeitende",
        layout: { x: 0, y: 0, w: 3, h: 2 },
        config: { metric: "uniqueVisitors", accent: true },
        position: 0,
      },
      {
        type: "kpi-card",
        title: "Aufrufe gesamt",
        layout: { x: 3, y: 0, w: 3, h: 2 },
        config: { metric: "pageviews" },
        position: 1,
      },
      {
        type: "kpi-card",
        title: "Bounce Rate",
        layout: { x: 6, y: 0, w: 3, h: 2 },
        config: { metric: "bounceRate" },
        position: 2,
      },
      {
        type: "kpi-card",
        title: "Ø Verweildauer",
        layout: { x: 9, y: 0, w: 3, h: 2 },
        config: { metric: "avgDuration" },
        position: 3,
      },
      { ...FULL_LINE_CHART, title: "Aktivität – täglich" },
      { ...FULL_TOP_PAGES, title: "Beliebteste Inhalte" },
    ],
  },
};

// ──────────────────────────────────────────────────────────────
// Gruppierung fuer die UI
// ──────────────────────────────────────────────────────────────

export const TEMPLATE_GROUPS: Array<{
  label: string;
  templates: string[];
}> = [
  {
    label: "Standard",
    templates: ["empty", "kpi-basics"],
  },
  {
    label: "Branchen-Templates",
    templates: [
      "onlineshop",
      "b2b-lead-gen",
      "content-blog",
      "landing-page",
      "saas-app",
      "social-intranet",
    ],
  },
];

export function getTemplate(id: string): DashboardTemplate | null {
  return TEMPLATES[id] ?? null;
}

export function listTemplates(): DashboardTemplate[] {
  return Object.values(TEMPLATES);
}
