import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import {
  requireUser,
  assertProjectAccess,
  assertProjectSiteAccess,
  getProjectSitesForSession,
} from "@/lib/auth/requireUser";
import {
  ensureSeedSite,
  getDashboardBySlug,
  getOrgBySlug,
  getOrCreateDefaultOrg,
  getVisibleProjectsForSession,
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
  params: { orgSlug: string; slug: string };
  searchParams: {
    range?: string;
    from?: string;
    to?: string;
    compare?: string;
    site?: string;
  };
}

export default async function ProjectDashboardPage({ params, searchParams }: PageProps) {
  const session = await requireUser();
  const isAdmin = session.user.role === "admin";

  // Bei allerersten Aufruf: Default-Org sicherstellen
  await getOrCreateDefaultOrg();

  // Projekt anhand Slug auflösen
  const project = await getOrgBySlug(params.orgSlug);
  if (!project) notFound();

  // Viewer darf nur seine Org sehen
  await assertProjectAccess(project.id);

  // Auto-Seed im Projekt-Kontext
  await ensureSeedSite(project.id);
  await ensureSeedDashboard(project.id);

  // Dashboard im Projekt-Kontext nachschlagen
  const dashboard = await getDashboardBySlug(project.id, params.slug);
  if (!dashboard) notFound();

  // Header-Daten
  const allProjects = await getVisibleProjectsForSession(session);
  const allDashboards = await listDashboardsForOrg(project.id);

  // Sites des Projekts
  const sites = await getProjectSitesForSession(project.id, session);
  if (sites.length === 0) {
    if (isAdmin) redirect(`/settings?error=no-sites-in-project`);
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header
          projects={allProjects.map((p) => ({ slug: p.slug, name: p.name }))}
          currentProjectSlug={project.slug}
        />
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-6 text-center">
              <p className="font-medium text-foreground">Keine Websites zugewiesen</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Im Projekt „{project.name}" ist noch keine Website hinterlegt. Bitte
                wende dich an einen Admin.
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

  await assertProjectSiteAccess(project.id, currentSiteId);

  const range = resolveDateRange({
    preset: searchParams.range,
    from: searchParams.from,
    to: searchParams.to,
    compare: searchParams.compare,
  });
  const compareRange = computeCompareRange(range);

  const currentSite = sites.find((s) => s.matomoSiteId === currentSiteId);
  const currentSiteLabel = currentSite?.label ?? "";

  const widgets = await getWidgetsForDashboard(dashboard.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        projects={allProjects.map((p) => ({ slug: p.slug, name: p.name }))}
        currentProjectSlug={project.slug}
        currentProjectLogo={project.brandingLogoBase64}
        dashboards={allDashboards.map((d) => ({ slug: d.slug, name: d.name }))}
        currentDashboardSlug={dashboard.slug}
      />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{dashboard.name}</h1>
              <p className="mt-1 flex flex-wrap items-center text-sm text-muted-foreground">
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
                    orgName: project.name,
                  }))}
                  currentSiteId={currentSiteId}
                  showOrgGroups={false}
                />
              )}
              <Suspense fallback={<Skeleton className="h-10 w-72" />}>
                <DateRangePicker />
              </Suspense>
            </div>
          </div>

          <DashboardRenderer
            widgets={widgets}
            ctx={{ siteId: currentSiteId, range, compareRange }}
          />
        </div>
      </main>
    </div>
  );
}
