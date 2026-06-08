import { requireAdmin } from "@/lib/auth/requireUser";
import {
  listDeletedCustomers,
  listDeletedOrganizations,
  listDeletedDashboards,
  getCustomerById,
  getOrgById,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { TrashList, type TrashItem } from "@/components/settings/TrashList";

export const dynamic = "force-dynamic";

export default async function PapierkorbPage() {
  const session = await requireAdmin();

  const [delCustomers, delOrgs, delDashboards, projects] = await Promise.all([
    listDeletedCustomers(),
    listDeletedOrganizations(),
    listDeletedDashboards(),
    getVisibleProjectsForSession(session),
  ]);

  const fmt = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" }) : "–";

  const items: TrashItem[] = [];
  for (const c of delCustomers) {
    items.push({ id: c.id, label: c.name, kind: "customer", deletedAtLabel: fmt(c.deletedAt) });
  }
  for (const o of delOrgs) {
    const cust = o.customerId ? await getCustomerById(o.customerId) : null;
    items.push({
      id: o.id,
      label: o.name,
      sublabel: cust ? `Kunde: ${cust.name}` : undefined,
      kind: "project",
      deletedAtLabel: fmt(o.deletedAt),
    });
  }
  for (const d of delDashboards) {
    const org = await getOrgById(d.organizationId);
    items.push({
      id: d.id,
      label: d.name,
      sublabel: org ? `Projekt: ${org.name}` : undefined,
      kind: "dashboard",
      deletedAtLabel: fmt(d.deletedAt),
    });
  }

  return (
    <AppShell projects={projects.map((p) => ({ slug: p.slug, name: p.name }))} dashboards={[]}>
      <Topbar
        title="Papierkorb"
        subtitle={
          <span>Gelöschte Kunden, Projekte und Dashboards wiederherstellen oder endgültig entfernen.</span>
        }
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-3xl">
          <TrashList items={items} />
        </div>
      </main>
    </AppShell>
  );
}
