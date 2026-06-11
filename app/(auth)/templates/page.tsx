import { requireUser } from "@/lib/auth/requireUser";
import { listTemplates, getVisibleProjectsForSession } from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { TemplateLibrary } from "@/components/settings/TemplateLibrary";
import { WarmCacheButton } from "@/components/settings/WarmCacheButton";

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
        <div className="mx-auto max-w-5xl space-y-6">
          {session.user.role === "admin" && (
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">Performance: Cache-Vorwärmen</p>
              <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
                Lädt die Daten aller Dashboard-Widgets vorab in den Cache, damit Dashboards
                sofort laden. Für automatischen Betrieb einen Cron auf{" "}
                <code className="font-mono">/api/cron/warm?secret=…</code> zeigen lassen
                (Env <code className="font-mono">CRON_SECRET</code> setzen).
              </p>
              <WarmCacheButton />
            </div>
          )}
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
