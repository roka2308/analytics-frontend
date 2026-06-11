// =============================================================
//  Cache-Vorwaermen (server-only)
//
//  Ruft fuer alle Dashboards die Daten-Abfragen ihrer Widgets vorab auf.
//  Da alle Abfragen ueber withCache laufen, landet das Ergebnis im Cache
//  (cache_entries) -> der naechste echte Aufruf laedt sofort.
//
//  Scheduler-agnostisch: nutzbar per geschuetztem Cron-Endpunkt ODER per
//  manuellem Admin-Button.
// =============================================================
import "server-only";
import {
  listOrganizations,
  getSitesForOrg,
  listDashboardsForOrg,
  getWidgetsForDashboard,
  type DashboardWidgetRow,
} from "@/lib/db/queries";
import { resolveDateRange, computeCompareRange } from "@/lib/dateRange";
import { getProcessedReport, getMetricEvolution } from "@/lib/matomo/metadata";
import { getCrossRecords, getGroupedRecords } from "@/lib/matomo/crosstab";
import { resolveDimensionConfig } from "@/lib/widgets/dimensionReport";
import {
  getVisitorsOverviewForRange,
  getVisitorTrendForRange,
  getTopPagesForRange,
  getPageEventCrossTab,
} from "@/lib/matomo/transforms";

export interface WarmSummary {
  organizations: number;
  dashboards: number;
  widgets: number;
  warmed: number;
  errors: number;
  durationMs: number;
}

/** Sicherheits-Cap, damit ein Lauf nicht ausufert (Serverless-Timeouts). */
const MAX_WIDGETS = 400;

type Range = { from: string; to: string };

async function warmWidget(
  siteId: number,
  range: Range,
  compareRange: ReturnType<typeof computeCompareRange>,
  widget: DashboardWidgetRow,
): Promise<void> {
  const config = widget.config as Record<string, unknown>;
  const display = (config.display as string) ?? "table";

  switch (widget.type) {
    case "report": {
      if (display === "line" || display === "area" || display === "kpi") {
        const metrics =
          Array.isArray(config.metrics) && config.metrics.length
            ? (config.metrics as string[])
            : ["nb_visits"];
        if (config.apiModule && config.apiAction) {
          await getMetricEvolution(siteId, range, {
            apiModule: config.apiModule as string,
            apiAction: config.apiAction as string,
            metrics,
            segment: config.segment as string | undefined,
          });
        }
      } else if (display === "pivot") {
        const rows = (config.pivotRows as { module: string; action: string }[]) ?? [];
        const cols = (config.pivotCols as { module: string; action: string }[]) ?? [];
        if (rows.length && cols.length) {
          await getCrossRecords(siteId, range, {
            rowReports: rows,
            colReports: cols,
            measure: (config.pivotMeasure as string) ?? "nb_visits",
            limitPerLevel: (config.limit as number) ?? 6,
          });
        }
      } else if (display === "grouped") {
        const dims = (config.groupDims as { module: string; action: string }[]) ?? [];
        const gms = (config.groupMetrics as { id: string }[]) ?? [];
        if (dims.length && gms.length) {
          await getGroupedRecords(siteId, range, {
            dimReports: dims,
            metrics: gms.map((m) => m.id),
            limitPerLevel: (config.limit as number) ?? 8,
          });
        }
      } else if (config.apiModule && config.apiAction) {
        await getProcessedReport(siteId, range, {
          apiModule: config.apiModule as string,
          apiAction: config.apiAction as string,
          filterLimit: (config.limit as number) ?? 10,
          sortColumn: config.sortColumn as string | undefined,
        });
      }
      break;
    }
    case "breakdown":
    case "donut":
    case "bar-chart": {
      const r = resolveDimensionConfig(config);
      await getProcessedReport(siteId, range, {
        apiModule: r.apiModule,
        apiAction: r.apiAction,
        filterLimit: r.limit,
        sortColumn: r.metric,
      });
      break;
    }
    case "kpi-card":
      await getVisitorsOverviewForRange(siteId, range);
      break;
    case "line-chart":
      await getVisitorTrendForRange(siteId, range, compareRange);
      break;
    case "top-list":
      await getTopPagesForRange(siteId, range, (config.limit as number) ?? 10);
      break;
    case "cross-tab":
      await getPageEventCrossTab(
        siteId,
        range,
        (config.topPagesLimit as number) ?? 5,
        (config.topEventsPerPage as number) ?? 3,
      );
      break;
    default:
      // text-block u.a. -> nichts zu laden
      break;
  }
}

export async function warmAllDashboards(): Promise<WarmSummary> {
  const start = Date.now();
  const summary: WarmSummary = {
    organizations: 0,
    dashboards: 0,
    widgets: 0,
    warmed: 0,
    errors: 0,
    durationMs: 0,
  };

  const orgs = await listOrganizations();
  for (const org of orgs) {
    const sites = await getSitesForOrg(org.id);
    const siteId = sites[0]?.matomoSiteId;
    if (!siteId) continue;
    summary.organizations++;

    const dashboards = await listDashboardsForOrg(org.id);
    for (const d of dashboards) {
      summary.dashboards++;
      const range = resolveDateRange({
        preset: d.defaultRangePreset ?? undefined,
        from: d.defaultRangeFrom ?? undefined,
        to: d.defaultRangeTo ?? undefined,
        compare: d.defaultCompareMode ?? undefined,
      });
      const compareRange = computeCompareRange(range);
      const rangeIO: Range = { from: range.from, to: range.to };

      const widgets = await getWidgetsForDashboard(d.id);
      for (const w of widgets) {
        if (summary.widgets >= MAX_WIDGETS) {
          summary.durationMs = Date.now() - start;
          return summary;
        }
        summary.widgets++;
        try {
          await warmWidget(siteId, rangeIO, compareRange, w);
          summary.warmed++;
        } catch {
          summary.errors++;
        }
      }
    }
  }

  summary.durationMs = Date.now() - start;
  return summary;
}
