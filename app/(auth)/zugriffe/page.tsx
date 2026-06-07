import { requireAdmin } from "@/lib/auth/requireUser";
import {
  listCustomers,
  listOrganizations,
  listDashboardsForOrg,
  listGrantsForUser,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { listUsers } from "@/lib/auth/users";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import {
  AccessGrantsEditor,
  type GrantView,
} from "@/components/settings/AccessGrantsEditor";

export const dynamic = "force-dynamic";

export default async function ZugriffePage() {
  const session = await requireAdmin();

  const [customers, projects, usersRaw] = await Promise.all([
    listCustomers(),
    listOrganizations(),
    listUsers(),
  ]);

  // Alle Dashboards mit Projekt-Label sammeln
  const dashboardTargets: { id: string; name: string }[] = [];
  const dashboardName = new Map<string, string>();
  for (const org of projects) {
    const dashes = await listDashboardsForOrg(org.id);
    for (const d of dashes) {
      const label = `${d.name} (${org.name})`;
      dashboardTargets.push({ id: d.id, name: label });
      dashboardName.set(d.id, label);
    }
  }

  const customerName = new Map(customers.map((c) => [c.id, c.name] as const));
  const projectName = new Map(projects.map((p) => [p.id, p.name] as const));

  // Grants je Nutzer mit lesbarem Label
  const grantsByUser: Record<string, GrantView[]> = {};
  for (const u of usersRaw) {
    const grants = await listGrantsForUser(u.id);
    grantsByUser[u.id] = grants.map((g) => {
      const label =
        g.scopeType === "customer"
          ? customerName.get(g.scopeId) ?? g.scopeId
          : g.scopeType === "project"
            ? projectName.get(g.scopeId) ?? g.scopeId
            : dashboardName.get(g.scopeId) ?? g.scopeId;
      return {
        id: g.id,
        scopeType: g.scopeType,
        scopeId: g.scopeId,
        label,
        role: g.role,
      };
    });
  }

  const headerProjects = await getVisibleProjectsForSession(session);

  return (
    <AppShell
      projects={headerProjects.map((p) => ({ slug: p.slug, name: p.name }))}
      dashboards={[]}
    >
      <Topbar
        title="Zugriffsrechte"
        subtitle={
          <span>
            Berechtige Nutzer gezielt auf Kunden, Projekte oder einzelne Dashboards.
          </span>
        }
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <AccessGrantsEditor
            users={usersRaw.map((u) => ({
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
            }))}
            targets={{
              customer: customers.map((c) => ({ id: c.id, name: c.name })),
              project: projects.map((p) => ({ id: p.id, name: p.name })),
              dashboard: dashboardTargets,
            }}
            grantsByUser={grantsByUser}
          />
        </div>
      </main>
    </AppShell>
  );
}
