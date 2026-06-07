import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Monitor } from "lucide-react";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  getDashboardBySlug,
  getOrgBySlug,
  getWidgetsForDashboard,
  listDashboardsForOrg,
  getVisibleProjectsForSession,
  resolveOrgBranding,
} from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardGridEditor } from "@/components/editor/DashboardGridEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { orgSlug: string; slug: string };
}

export default async function DashboardEditPage({ params }: PageProps) {
  const session = await requireAdmin();

  const project = await getOrgBySlug(params.orgSlug);
  if (!project) notFound();

  const dashboard = await getDashboardBySlug(project.id, params.slug);
  if (!dashboard) notFound();

  const [widgets, allDashboards, allProjects, branding] = await Promise.all([
    getWidgetsForDashboard(dashboard.id),
    listDashboardsForOrg(project.id),
    getVisibleProjectsForSession(session),
    resolveOrgBranding(project.id),
  ]);

  return (
    <AppShell
      projects={allProjects.map((p) => ({ slug: p.slug, name: p.name }))}
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
        title={`${dashboard.name} bearbeiten`}
        subtitle={
          <span>Widgets per Drag &amp; Drop anordnen und Größe ändern.</span>
        }
        right={
          <Link
            href={`/projekte/${project.slug}/dashboards/${dashboard.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück
          </Link>
        }
      />

      {/* Mobile-Hinweis: Bearbeiten nur am Desktop */}
      <div className="px-4 py-10 md:hidden">
        <div className="mx-auto max-w-sm rounded-xl border border-border bg-card p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Monitor className="h-6 w-6" />
          </div>
          <p className="font-medium text-foreground">Bearbeiten am Desktop</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Das Anordnen von Widgets per Drag &amp; Drop funktioniert am besten am
            Computer. Bitte öffne diese Seite an einem größeren Bildschirm.
          </p>
          <Link
            href={`/projekte/${project.slug}/dashboards/${dashboard.slug}`}
            className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zum Dashboard
          </Link>
        </div>
      </div>

      {/* Desktop-Editor */}
      <main className="hidden px-6 py-6 md:block">
        <div className="mx-auto max-w-7xl">
          <DashboardGridEditor
            dashboardId={dashboard.id}
            projectSlug={project.slug}
            dashboardSlug={dashboard.slug}
            initialWidgets={widgets.map((w) => ({
              id: w.id,
              type: w.type,
              title: w.title,
              config: w.config,
              layout: w.layout,
            }))}
          />
        </div>
      </main>
    </AppShell>
  );
}
