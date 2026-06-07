import { requireAdmin } from "@/lib/auth/requireUser";
import {
  listCustomers,
  countOrgsInCustomer,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { CustomerSidebarList } from "@/components/settings/CustomerSidebarList";

export const dynamic = "force-dynamic";

export default async function KundenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  const customersRaw = await listCustomers();
  const customers = await Promise.all(
    customersRaw.map(async (c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      projectCount: await countOrgsInCustomer(c.id),
    })),
  );
  const projects = await getVisibleProjectsForSession(session);

  return (
    <AppShell projects={projects.map((p) => ({ slug: p.slug, name: p.name }))} dashboards={[]}>
      <Topbar
        title="Kunden"
        subtitle={<span>Kunden, Projekte, Datenquellen, Dashboards und Nutzer verwalten.</span>}
      />
      <div className="flex min-h-[calc(100vh-8rem)]">
        <aside className="w-72 shrink-0 border-r border-border">
          <CustomerSidebarList customers={customers} />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </AppShell>
  );
}
