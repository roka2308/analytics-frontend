import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser, assertSiteAccess } from "@/lib/auth/requireUser";
import {
  ensureSeedSite,
  getOrCreateDefaultOrg,
  getVisibleSitesForSession,
} from "@/lib/db/queries";
import { Header } from "@/components/dashboard/Header";
import { KpiCard, KpiCardSkeleton } from "@/components/dashboard/KpiCard";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { SiteSelector } from "@/components/dashboard/SiteSelector";
import { TopPagesTable } from "@/components/dashboard/TopPagesTable";
import { VisitorTrendChart } from "@/components/charts/VisitorTrendChart";
import { Skeleton } from "@/components/ui/skeleton";
import { getVisitorsOverview, getVisitorTrend } from "@/lib/matomo/transforms";
import { getCacheAge } from "@/lib/matomo/cache";
import { formatDuration } from "@/lib/utils";

function getRangeConfig(range: string) {
  switch (range) {
    case "today":
      return { period: "day" as const, date: "today", label: "Heute", trendDays: 7 };
    case "30":
      return { period: "range" as const, date: "last30", label: "letzten 30 Tage", trendDays: 30 };
    case "90":
      return { period: "range" as const, date: "last90", label: "letzten 90 Tage", trendDays: 90 };
    default:
      return { period: "range" as const, date: "last7", label: "letzten 7 Tage", trendDays: 7 };
  }
}

async function KpiSection({
  siteId,
  period,
  date,
}: {
  siteId: number;
  period: "day" | "range";
  date: string;
}) {
  let overview;
  let cacheAgeMinutes: number | null = null;
  let error: string | null = null;

  try {
    overview = await getVisitorsOverview(siteId, period, date);
    cacheAgeMinutes = await getCacheAge(`visitors_overview_${siteId}_${period}_${date}`);
  } catch (e) {
    error = e instanceof Error ? e.message : "Unbekannter Fehler";
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
        <p className="font-medium text-destructive">Matomo ist nicht erreichbar</p>
        <p className="mt-1 text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-2">
      {cacheAgeMinutes !== null && cacheAgeMinutes > 0 && (
        <p className="text-xs text-muted-foreground">
          Daten von vor {cacheAgeMinutes} {cacheAgeMinutes === 1 ? "Minute" : "Minuten"} ·
          wird alle 10 Min. aktualisiert
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard accent title="Besuche" value={overview.visits.toLocaleString("de-DE")} />
        <KpiCard title="Seitenaufrufe" value={overview.pageviews.toLocaleString("de-DE")} />
        <KpiCard
          title="Bounce Rate"
          value={overview.bounceRate}
          description="Anteil Einzel-Seitenbesuche"
        />
        <KpiCard
          title="Ø Verweildauer"
          value={formatDuration(overview.avgVisitDurationSeconds)}
          description="pro Besuch"
        />
      </div>
    </div>
  );
}

async function TrendSection({ siteId, trendDays }: { siteId: number; trendDays: number }) {
  let data: Awaited<ReturnType<typeof getVisitorTrend>> = [];
  try {
    data = await getVisitorTrend(siteId, trendDays);
  } catch {}
  return <VisitorTrendChart data={data} />;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { range?: string; site?: string };
}) {
  const session = await requireUser();
  const isAdmin = session.user.role === "admin";

  const defaultOrg = await getOrCreateDefaultOrg();
  await ensureSeedSite(defaultOrg.id);

  const sites = await getVisibleSitesForSession(session);

  if (sites.length === 0) {
    if (isAdmin) redirect("/settings");
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-6 text-center">
              <p className="font-medium text-foreground">Keine Websites zugewiesen</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Bitte wende dich an einen Admin, um Zugriff auf eine Website zu erhalten.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const requestedSiteId = searchParams.site ? parseInt(searchParams.site, 10) : null;
  const currentSiteId =
    requestedSiteId && sites.some((s) => s.matomoSiteId === requestedSiteId)
      ? requestedSiteId
      : sites[0].matomoSiteId;

  await assertSiteAccess(currentSiteId);

  const range = searchParams.range ?? "7";
  const { period, date, label, trendDays } = getRangeConfig(range);
  const currentSite = sites.find((s) => s.matomoSiteId === currentSiteId);
  const currentSiteLabel = currentSite?.label ?? "";
  const currentOrgName = currentSite?.orgName ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Titel-Zeile mit Site-Selector und Zeitraum-Picker */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{currentSiteLabel}</h1>
              <p className="mt-1 flex items-center text-sm text-muted-foreground">
                {isAdmin && currentOrgName && (
                  <span className="mr-2 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                    {currentOrgName}
                  </span>
                )}
                Daten der {label}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {sites.length > 1 && (
                <SiteSelector
                  sites={sites.map((s) => ({
                    matomoSiteId: s.matomoSiteId,
                    label: s.label,
                    orgName: s.orgName,
                  }))}
                  currentSiteId={currentSiteId}
                  showOrgGroups={isAdmin}
                />
              )}
              <Suspense fallback={<Skeleton className="h-10 w-72" />}>
                <DateRangePicker />
              </Suspense>
            </div>
          </div>

          {/* KPI-Karten */}
          <Suspense
            key={`kpi-${currentSiteId}-${range}`}
            fallback={
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCardSkeleton /><KpiCardSkeleton />
                <KpiCardSkeleton /><KpiCardSkeleton />
              </div>
            }
          >
            <KpiSection siteId={currentSiteId} period={period} date={date} />
          </Suspense>

          {/* Besuchertrend */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-foreground">
              Besuchertrend – täglich
            </h2>
            <Suspense
              key={`trend-${currentSiteId}-${trendDays}`}
              fallback={<Skeleton className="h-52 w-full" />}
            >
              <TrendSection siteId={currentSiteId} trendDays={trendDays} />
            </Suspense>
          </div>

          {/* Top-Seiten */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-medium text-foreground">Top-Seiten</h2>
            <Suspense
              key={`pages-${currentSiteId}-${range}`}
              fallback={
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              }
            >
              <TopPagesTable siteId={currentSiteId} period={period} date={date} />
            </Suspense>
          </div>

        </div>
      </main>
    </div>
  );
}
