import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  requireAdmin,
} from "@/lib/auth/requireUser";
import {
  getDashboardBySlug,
  getOrgBySlug,
  getWidgetsForDashboard,
  listDashboardsForOrg,
  listSectionsForDashboard,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { Header } from "@/components/dashboard/Header";
import { DashboardEditor } from "@/components/editor/DashboardEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { orgSlug: string; slug: string };
}

export default async function DashboardEditPage({ params }: PageProps) {
  // Edit ist Admin-only
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        projects={allProjects.map((p) => ({ slug: p.slug, name: p.name }))}
        currentProjectSlug={project.slug}
        currentProjectLogo={project.brandingLogoBase64}
        dashboards={allDashboards.map((d) => ({ slug: d.slug, name: d.name }))}
        currentDashboardSlug={dashboard.slug}
      />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link
            href={`/projekte/${project.slug}/dashboards/${dashboard.slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Zurück zum Dashboard
          </Link>

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
    </div>
  );
}
