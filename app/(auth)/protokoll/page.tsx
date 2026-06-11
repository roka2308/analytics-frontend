import { requireAdmin } from "@/lib/auth/requireUser";
import { getVisibleProjectsForSession } from "@/lib/db/queries";
import { listAudit } from "@/lib/audit";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  "user.login": "Login",
  "user.create": "Nutzer angelegt",
  "user.delete": "Nutzer gelöscht",
  "user.role": "Rolle geändert",
  "user.password_reset": "Passwort zurückgesetzt",
  "user.invite": "Einladung erstellt",
  "customer.create": "Kunde angelegt",
  "customer.delete": "Kunde gelöscht",
  "customer.restore": "Kunde wiederhergestellt",
  "project.create": "Projekt angelegt",
  "project.delete": "Projekt gelöscht",
  "project.restore": "Projekt wiederhergestellt",
  "dashboard.delete": "Dashboard gelöscht",
  "dashboard.restore": "Dashboard wiederhergestellt",
};

export default async function ProtokollPage() {
  const session = await requireAdmin();
  const [entries, projects] = await Promise.all([
    listAudit(150),
    getVisibleProjectsForSession(session),
  ]);

  const fmt = (d: Date) =>
    new Date(d).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });

  return (
    <AppShell projects={projects.map((p) => ({ slug: p.slug, name: p.name, customerName: p.customerName }))} dashboards={[]}>
      <Topbar
        title="Protokoll"
        subtitle={<span>Administrative Aktionen und Logins (neueste zuerst, letzte 150).</span>}
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-4xl">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Einträge.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Zeitpunkt</th>
                    <th className="px-4 py-2 font-medium">Nutzer</th>
                    <th className="px-4 py-2 font-medium">Aktion</th>
                    <th className="px-4 py-2 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((e) => (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap px-4 py-2 text-muted-foreground">
                        {fmt(e.createdAt)}
                      </td>
                      <td className="px-4 py-2 text-foreground">{e.actorEmail ?? "System"}</td>
                      <td className="px-4 py-2 text-foreground">
                        {ACTION_LABEL[e.action] ?? e.action}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{e.summary ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
