import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  getDashboardBySlug,
  getOrgBySlug,
  getWidgetsForDashboard,
  listDashboardsForOrg,
  listSectionsForDashboard,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardEditor } from "@/components/editor/DashboardEditor";

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

  const [widgets, sections, allDashboards, allProjects] = await Promise.all([
    getWidgetsForDashboard(dashboard.id),
    listSectionsForDashboard(dashboard.id),
    listDashboardsForOrg(project.id),
    getVisibleProjectsForSession(session),
  ]);

  return (
    <AppShell
      projects={allProjects.map((p) => ({ slug: p.slug, name: p.name }))}
      currentProjectSlug={project.slug}
      currentProjectLogo={project.brandingLogoBase64}
      dashboards={allDashboards.map((d) => ({
        slug: d.slug,
        name: d.name,
        isDefault: d.isDefault,
      }))}
      currentDashboardSlug={dashboard.slug}
    >
      <Topbar
        title={`${dashboard.name} – Bearbeiten`}
        subtitle={<span>Widgets, Abschnitte und Konfiguration anpassen.</span>}
        right={
          <Link
            href={`/projekte/${project.slug}/dashboards/${dashboard.slug}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zum Dashboard
          </Link>
        }
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <DashboardEditor
            dashboardId={dashboard.id}
            dashboardName={dashboard.name}
            widgets={widgets.map((w) => ({
              id: w.id,
              sectionId: w.sectionId,
              type: w.type,
              title: w.title,
              config: w.config,
              position: w.position,
            }))}
            sections={sections.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              position: s.position,
            }))}
          />
        </div>
      </main>
    </AppShell>
  );
}
