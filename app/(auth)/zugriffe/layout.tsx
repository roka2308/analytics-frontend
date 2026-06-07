import { requireAdmin } from "@/lib/auth/requireUser";
import { getVisibleProjectsForSession } from "@/lib/db/queries";
import { listUsers } from "@/lib/auth/users";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
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
      <div className="flex min-h-[calc(100vh-8rem)]">
        <aside className="w-72 shrink-0 border-r border-border">
          <UserSidebarList
            users={users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role }))}
          />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppShell>
  );
}
