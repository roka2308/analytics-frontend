import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireUser, assertSiteAccess } from "@/lib/auth/requireUser";
import {
  ensureSeedSite,
  getDashboardBySlug,
  getOrCreateDefaultOrg,
  getVisibleSitesForSession,
  getWidgetsForDashboard,
  listDashboardsForOrg,
} from "@/lib/db/queries";
import { ensureSeedDashboard } from "@/lib/widgets/seed";
import { resolveDateRange, computeCompareRange } from "@/lib/dateRange";
import { Header } from "@/components/dashboard/Header";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { SiteSelector } from "@/components/dashboard/SiteSelector";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
  searchParams: {
    range?: string;
    from?: string;
    to?: string;
    compare?: string;
    site?: string;
  };
}

export default async function DashboardSlugPage({ params, searchParams }: PageProps) {
  const session = await requireUser();
  const isAdmin = session.user.role === "admin";

  const defaultOrg = await getOrCreateDefaultOrg();
  const orgId = isAdmin ? defaultOrg.id : session.user.organizationId ?? defaultOrg.id;

  await ensureSeedSite(defaultOrg.id);
  await ensureSeedDashboard(orgId);

  const dashboard = await getDashboardBySlug(orgId, params.slug);
  if (!dashboard) notFound();

  const allDashboards = await listDashboardsForOrg(orgId);

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

  // Range + Compare zentral aufloesen
  const range = resolveDateRange({
    preset: searchParams.range,
    from: searchParams.from,
    to: searchParams.to,
    compare: searchParams.compare,
  });
  const compareRange = computeCompareRange(range);

  const currentSite = sites.find((s) => s.matomoSiteId === currentSiteId);
  const currentSiteLabel = currentSite?.label ?? "";
  const currentOrgName = currentSite?.orgName ?? "";

  const widgets = await getWidgetsForDashboard(dashboard.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        dashboards={allDashboards.map((d) => ({ slug: d.slug, name: d.name }))}
        currentDashboardSlug={dashboard.slug}
      />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">

          {/* Titel + Steuerung */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{dashboard.name}</h1>
              <p className="mt-1 flex flex-wrap items-center text-sm text-muted-foreground">
                {isAdmin && currentOrgName && (
                  <span className="mr-2 inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
                    {currentOrgName}
                  </span>
                )}
                <span className="mr-2 font-medium text-foreground">{currentSiteLabel}</span>
                <span className="mx-1">·</span>
                <span>{range.label}</span>
                {compareRange && (
                  <>
                    <span className="mx-1">·</span>
                    <span className="text-accent-text">vs. {compareRange.label}</span>
                  </>
                )}
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

          {/* Widget-Grid */}
          <DashboardRenderer
            widgets={widgets}
            ctx={{ siteId: currentSiteId, range, compareRange }}
          />
        </div>
      </main>
    </div>
  );
}
