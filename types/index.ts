export interface VisitorsOverview {
  visits: number;
  uniqueVisitors: number;
  bounceRate: string;
  avgVisitDurationSeconds: number;
  pageviews: number;
}

export interface TopPage {
  label: string;
  visits: number;
  pageviews: number;
}

export interface DeviceBreakdown {
  label: string;
  visits: number;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
}

export interface MatomoSite {
  id: string;
  organizationId: string;
  matomoSiteId: number;
  label: string;
  createdAt: Date;
}

export type DateRange = "today" | "last7" | "last30" | "last90";

export interface DashboardFilters {
  siteId: number;
  dateRange: DateRange;
}
