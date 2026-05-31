import "server-only";
import {
  countDashboardsForOrg,
  createDashboard,
  createWidget,
  getDefaultDashboardForOrg,
  type WidgetLayout,
} from "@/lib/db/queries";

/**
 * Stellt sicher, dass eine Org mindestens ein Dashboard hat.
 * Wird beim ersten Aufruf des Dashboards aufgerufen (lazy).
 *
 * Das Standard-Dashboard entspricht den 6 Widgets, die wir vor
 * Phase B fest verdrahtet hatten – damit ist die Migration fuer
 * bestehende Nutzer transparent.
 */
export async function ensureSeedDashboard(orgId: string) {
  const existing = await countDashboardsForOrg(orgId);
  if (existing > 0) return;

  const dashboardId = await createDashboard({
    organizationId: orgId,
    slug: "standard",
    name: "Standard-Dashboard",
    description: "Automatisch erzeugte Übersicht der wichtigsten Kennzahlen.",
    isDefault: true,
    position: 0,
  });

  // 4 KPI-Karten in einer Reihe (jeweils 3 Spalten breit)
  const kpis: { metric: string; accent?: boolean }[] = [
    { metric: "visits", accent: true },
    { metric: "pageviews" },
    { metric: "bounceRate" },
    { metric: "avgDuration" },
  ];

  for (let i = 0; i < kpis.length; i++) {
    const layout: WidgetLayout = { x: i * 3, y: 0, w: 3, h: 2 };
    await createWidget({
      dashboardId,
      type: "kpi-card",
      title: null,
      layout,
      config: kpis[i],
      position: i,
    });
  }

  // Liniendiagramm Besuchertrend, ganze Breite
  await createWidget({
    dashboardId,
    type: "line-chart",
    title: "Besuchertrend – täglich",
    layout: { x: 0, y: 2, w: 12, h: 4 },
    config: { metric: "visits" },
    position: 10,
  });

  // Top-Seiten, ganze Breite
  await createWidget({
    dashboardId,
    type: "top-list",
    title: "Top-Seiten",
    layout: { x: 0, y: 6, w: 12, h: 6 },
    config: { source: "pages", limit: 10 },
    position: 20,
  });

  return dashboardId;
}

/**
 * Convenience: liefert das Default-Dashboard, legt es bei Bedarf an.
 */
export async function getOrCreateDefaultDashboard(orgId: string) {
  await ensureSeedDashboard(orgId);
  return getDefaultDashboardForOrg(orgId);
}
