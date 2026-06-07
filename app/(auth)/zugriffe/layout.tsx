import { requireAdmin } from "@/lib/auth/requireUser";
import { getVisibleProjectsForSession } from "@/lib/db/queries";
import { listUsers } from "@/lib/auth/users";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { MasterDetailShell } from "@/components/layout/MasterDetailShell";
import { UserSidebarList } from "@/components/settings/UserSidebarList";

export const dynamic = "force-dynamic";

export default async function ZugriffeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const [users, projects] = await Promise.all([
    listUsers(),
    getVisibleProjectsForSession(session),
  ]);

  return (
    <AppShell projects={projects.map((p) => ({ slug: p.slug, name: p.name }))} dashboards={[]}>
      <Topbar
        title="Zugriffsrechte"
        subtitle={<span>Nutzer anlegen und gezielt auf Kunden, Projekte oder Dashboards berechtigen.</span>}
      />
      <MasterDetailShell
        basePath="/zugriffe"
        backLabel="Alle Nutzer"
        list={
          <UserSidebarList
            users={users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role }))}
          />
        }
      >
        {children}
      </MasterDetailShell>
    </AppShell>
  );
}
