import "server-only";
import { matomoRequest } from "./client";
import { withCache } from "./cache";
import type { VisitorsOverview, TopPage, DeviceBreakdown } from "@/types";

interface MatomoVisitsSummary {
  nb_visits: number;
  nb_uniq_visitors: number;
  bounce_rate: string;
  avg_time_on_site: number;
  nb_pageviews: number;  // verfügbar bei period=day/week/month
  nb_actions: number;    // verfügbar bei period=range (enthält Seitenaufrufe)
}

interface MatomoPageRow {
  label: string;
  nb_visits: number;
  nb_hits: number; // Matomo Actions-API: Seitenaufrufe heißen nb_hits, nicht nb_pageviews
}

interface MatomoDeviceRow {
  label: string;
  nb_visits: number;
}

export async function getVisitorsOverview(
  siteId: number,
  period: "day" | "week" | "month" | "range" = "week",
  date: string = "last7"
): Promise<VisitorsOverview> {
  const cacheKey = `visitors_overview_${siteId}_${period}_${date}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoVisitsSummary>({
      method: "VisitsSummary.get",
      idSite: siteId,
      period,
      date,
    });

    return {
      visits: data.nb_visits ?? 0,
      uniqueVisitors: data.nb_uniq_visitors ?? 0,
      bounceRate: data.bounce_rate ?? "0%",
      avgVisitDurationSeconds: data.avg_time_on_site ?? 0,
      pageviews: data.nb_pageviews ?? data.nb_actions ?? 0,
    };
  });
}

export async function getTopPages(
  siteId: number,
  period: "day" | "week" | "month" | "range" = "week",
  date: string = "last7",
  limit = 10
): Promise<TopPage[]> {
  const cacheKey = `top_pages_${siteId}_${period}_${date}_${limit}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoPageRow[]>({
      method: "Actions.getPageUrls",
      idSite: siteId,
      period,
      date,
      filter_limit: limit,
    });

    return (data ?? []).map((row) => ({
      label: row.label,
      visits: row.nb_visits ?? 0,
      pageviews: row.nb_hits ?? 0,
    }));
  });
}

export interface TrendDataPoint {
  date: string;
  Besuche: number;
}

export async function getVisitorTrend(
  siteId: number,
  days: number = 7
): Promise<TrendDataPoint[]> {
  const cacheKey = `visitor_trend_${siteId}_${days}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<Record<string, { nb_visits: number }>>({
      method: "VisitsSummary.get",
      idSite: siteId,
      period: "day",
      date: `last${days}`,
    });

    return Object.entries(data ?? {}).map(([dateStr, stats]) => ({
      date: new Date(dateStr).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "short",
      }),
      Besuche: stats?.nb_visits ?? 0,
    }));
  });
}

export async function getDeviceBreakdown(
  siteId: number,
  period: "day" | "week" | "month" | "range" = "week",
  date: string = "last7"
): Promise<DeviceBreakdown[]> {
  const cacheKey = `devices_${siteId}_${period}_${date}`;

  return withCache(cacheKey, 600, async () => {
    const data = await matomoRequest<MatomoDeviceRow[]>({
      method: "DevicesDetection.getType",
      idSite: siteId,
      period,
      date,
    });

    return (data ?? []).map((row) => ({
      label: row.label,
      visits: row.nb_visits ?? 0,
    }));
  });
}
