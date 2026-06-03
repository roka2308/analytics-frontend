import { Suspense } from "react";
import { notFound } from "next/navigation";
import { resolveActiveShareToken } from "@/lib/sharing/tokens";
import {
  getDashboardBySlug,
  getOrgById,
  getSitesForOrg,
  getWidgetsForDashboard,
} from "@/lib/db/queries";
import { resolveDateRange, computeCompareRange } from "@/lib/dateRange";
import { DashboardRenderer } from "@/components/dashboard/DashboardRenderer";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { ProjectThemeStyle } from "@/components/providers/ProjectThemeStyle";
import { ShareHeader } from "@/components/share/ShareHeader";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { token: string };
  searchParams: {
    range?: string;
    from?: string;
    to?: string;
    compare?: string;
  };
}

export default async function SharePage({ params, searchParams }: PageProps) {
  // Token-Lookup: nur aktive, nicht widerrufene, nicht abgelaufene Tokens
  const resolved = await resolveActiveShareToken(params.token);
  if (!resolved) {
    notFound();
  }

  // Dashboard via dashboardId nachschlagen
  const project = await getOrgById(resolved.organizationId);
  if (!project) notFound();

  const sites = await getSitesForOrg(project.id);
  if (sites.length === 0) {
    return (
      <ProjectThemeStyle accentHsl={project.brandingAccentHsl}>
        <div className="flex min-h-screen flex-col bg-background">
          <ShareHeader
            projectName={project.name}
            projectLogo={project.brandingLogoBase64}
            dashboardName="Dashboard"
            shareLabel={resolved.token.label}
          />
          <main className="flex-1 px-6 py-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm text-muted-foreground">
                Keine Daten verfügbar.
              </p>
            </div>
          </main>
        </div>
      </ProjectThemeStyle>
    );
  }

  // Site: entweder vom Token fixiert oder erste Site des Projekts
  const fixedSiteId = resolved.token.matomoSiteId;
  const currentSiteId =
    fixedSiteId && sites.some((s) => s.matomoSiteId === fixedSiteId)
      ? fixedSiteId
      : sites[0].matomoSiteId;

  // Dashboard laden (via Token nur dashboardId, also direkt aus dashboards-Tabelle)
  // Wir nutzen den Trick, dass listDashboardsForOrg + Filter zum gleichen Ergebnis fuehrt:
  // einfacher ist eine direkte Query – wir holen sie ueber slug aus dem dashboard-Eintrag.
  // resolved.token gibt uns dashboardId; wir koennen dashboard via dashboards.id direkt holen.
  const { db } = await import("@/lib/db");
  const { dashboards } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  const dashboardRows = await db
    .select()
    .from(dashboards)
    .where(eq(dashboards.id, resolved.dashboardId))
    .limit(1);
  const dashboard = dashboardRows[0];
  if (!dashboard) notFound();

  // Default-Range vom Dashboard, ueberschreibbar durch URL-Parameter
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

  const widgets = await getWidgetsForDashboard(dashboard.id);
  const currentSite = sites.find((s) => s.matomoSiteId === currentSiteId);

  return (
    <ProjectThemeStyle accentHsl={project.brandingAccentHsl}>
      <div className="flex min-h-screen flex-col bg-background">
        <ShareHeader
          projectName={project.name}
          projectLogo={project.brandingLogoBase64}
          dashboardName={dashboard.name}
          shareLabel={resolved.token.label}
        />
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-7xl space-y-8">

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  {dashboard.name}
                </h1>
                <p className="mt-1 flex flex-wrap items-center text-sm text-muted-foreground">
                  <span className="mr-2 font-medium text-foreground">
                    {currentSite?.label}
                  </span>
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
              <Suspense fallback={<Skeleton className="h-10 w-72" />}>
                <DateRangePicker />
              </Suspense>
            </div>

            <DashboardRenderer
              widgets={widgets}
              ctx={{ siteId: currentSiteId, range, compareRange }}
            />

            <footer className="mt-12 border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Geteilt aus dem Analytics Dashboard ·
                <span className="ml-1">
                  Read-only-Ansicht für {project.name}
                </span>
              </p>
            </footer>
          </div>
        </main>
      </div>
    </ProjectThemeStyle>
  );
}
