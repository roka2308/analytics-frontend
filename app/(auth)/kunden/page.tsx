import { requireAdmin } from "@/lib/auth/requireUser";
import {
  listCustomers,
  countOrgsInCustomer,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { CustomerList } from "@/components/settings/CustomerList";

export const dynamic = "force-dynamic";

export default async function KundenPage() {
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
    <AppShell
      projects={projects.map((p) => ({ slug: p.slug, name: p.name }))}
      dashboards={[]}
    >
      <Topbar
        title="Kunden"
        subtitle={<span>Verwalte Kunden, ihre Projekte, Datenquellen, Nutzer und Branding.</span>}
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <CustomerList customers={customers} />
        </div>
      </main>
    </AppShell>
  );
}
