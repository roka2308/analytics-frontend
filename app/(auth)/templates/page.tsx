import { requireUser } from "@/lib/auth/requireUser";
import { listTemplates, getVisibleProjectsForSession } from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { TemplateLibrary } from "@/components/settings/TemplateLibrary";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const session = await requireUser();
  const [templates, projects] = await Promise.all([
    listTemplates(),
    getVisibleProjectsForSession(session),
  ]);

  return (
    <AppShell
      projects={projects.map((p) => ({ slug: p.slug, name: p.name }))}
      dashboards={[]}
    >
      <Topbar
        title="Vorlagen"
        subtitle={<span>Dashboard-Vorlagen-Library – einmal bauen, auf beliebige Projekte anwenden.</span>}
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <TemplateLibrary
            templates={templates.map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              category: t.category,
              widgetCount: t.widgetCount,
            }))}
            projects={projects.map((p) => ({ id: p.id, name: p.name, slug: p.slug }))}
            isAdmin={session.user.role === "admin"}
          />
        </div>
      </main>
    </AppShell>
  );
}
