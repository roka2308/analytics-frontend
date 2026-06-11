import { requireAdmin } from "@/lib/auth/requireUser";
import {
  listCustomers,
  countOrgsInCustomer,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { MasterDetailShell } from "@/components/layout/MasterDetailShell";
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
    <AppShell projects={projects.map((p) => ({ slug: p.slug, name: p.name, customerName: p.customerName }))} dashboards={[]}>
      <Topbar
        title="Kunden"
        subtitle={<span>Kunden, Projekte, Datenquellen, Dashboards und Nutzer verwalten.</span>}
      />
      <MasterDetailShell basePath="/kunden" backLabel="Alle Kunden" list={<CustomerSidebarList customers={customers} />}>
        {children}
      </MasterDetailShell>
    </AppShell>
  );
}
