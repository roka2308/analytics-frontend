import { Suspense } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
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
  resolveOrgBranding,
} from "@/lib/db/queries";
import { ensureSeedDashboard } from "@/lib/widgets/seed";
import { resolveDateRange, computeCompareRange } from "@/lib/dateRange";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { SiteSelector } from "@/components/dashboard/SiteSelector";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";
import { ShareButton } from "@/components/dashboard/ShareButton";
import { listShareTokensForDashboard } from "@/lib/sharing/tokens";
import { headers } from "next/headers";
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
  const branding = await resolveOrgBranding(project.id);

  // Sites des Projekts
  const sites = await getProjectSitesForSession(project.id, session);
  if (sites.length === 0) {
    if (isAdmin) redirect(`/settings?error=no-sites-in-project`);
    return (
      <AppShell
        projects={allProjects.map((p) => ({ slug: p.slug, name: p.name, customerName: p.customerName }))}
        currentProjectSlug={project.slug}
        currentProjectLogo={branding.logoBase64}
        dashboards={allDashboards.map((d) => ({
          slug: d.slug,
          name: d.name,
          isDefault: d.isDefault,
        }))}
        currentDashboardSlug={dashboard.slug}
      >
        <Topbar title={dashboard.name} />
        <main className="px-6 py-6">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-6 text-center">
              <p className="font-medium text-foreground">Keine Websites zugewiesen</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Im Projekt {project.name} ist noch keine Website hinterlegt. Bitte
                wende dich an einen Admin.
              </p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  const requestedSiteId = searchParams.site ? parseInt(searchParams.site, 10) : null;
  const currentSiteId =
    requestedSiteId && sites.some((s) => s.matomoSiteId === requestedSiteId)
      ? requestedSiteId
      : sites[0].matomoSiteId;

  await assertProjectSiteAccess(project.id, currentSiteId);

  // Falls die URL keinen Zeitraum vorgibt, nutze den Dashboard-Default
  // (Phase F). URL-Werte haben Vorrang, damit teilbare Links eindeutig sind.
  const effectivePreset = searchParams.range ?? dashboard.defaultRangePreset ?? undefined;
  const effectiveFrom = searchParams.from ?? dashboard.defaultRangeFrom ?? undefined;
  const effectiveTo = searchParams.to ?? dashboard.defaultRangeTo ?? undefined;
  const effectiveCompare =
    searchParams.compare ?? dashboard.defaultCompareMode ?? undefined;

  const range = resolveDateRange({
    preset: effectivePreset,
    from: effectiveFrom,
    to: effectiveTo,
    compare: effectiveCompare,
  });
  const compareRange = computeCompareRange(range);

  const currentSite = sites.find((s) => s.matomoSiteId === currentSiteId);
  const currentSiteLabel = currentSite?.label ?? "";

  const widgets = await getWidgetsForDashboard(dashboard.id);

  // Share-Links (Teilen ohne Login)
  const shareTokens = isAdmin ? await listShareTokensForDashboard(dashboard.id) : [];
  const hdrs = headers();
  const shareBaseUrl = `${hdrs.get("x-forwarded-proto") ?? "https"}://${hdrs.get("host") ?? "localhost:3000"}`;

  return (
    <AppShell
      projects={allProjects.map((p) => ({ slug: p.slug, name: p.name, customerName: p.customerName }))}
      currentProjectSlug={project.slug}
      currentProjectLogo={branding.logoBase64}
      dashboards={allDashboards.map((d) => ({
        slug: d.slug,
        name: d.name,
        isDefault: d.isDefault,
      }))}
      currentDashboardSlug={dashboard.slug}
    >
      <Topbar
        title={dashboard.name}
        subtitle={
          <>
            <span className="mr-2 font-medium text-foreground">{currentSiteLabel}</span>
            <span className="mx-1">·</span>
            <span>{range.label}</span>
            {compareRange && (
              <>
                <span className="mx-1">·</span>
                <span className="text-accent-text">vs. {compareRange.label}</span>
              </>
            )}
          </>
        }
        right={
          <>
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
            {isAdmin && (
              <ShareButton
                dashboardId={dashboard.id}
                tokens={shareTokens}
                sites={sites.map((s) => ({ matomoSiteId: s.matomoSiteId, label: s.label }))}
                baseUrl={shareBaseUrl}
              />
            )}
            {isAdmin && (
              <Link
                href={`/projekte/${project.slug}/dashboards/${dashboard.slug}/edit`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Dashboard bearbeiten"
              >
                <Pencil className="h-3.5 w-3.5" />
                Bearbeiten
              </Link>
            )}
          </>
        }
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <DashboardRenderer
            widgets={widgets}
            ctx={{ siteId: currentSiteId, range, compareRange }}
          />
        </div>
      </main>
    </AppShell>
  );
}
