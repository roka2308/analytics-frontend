import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  getCustomerBySlug,
  listCustomers,
  listOrganizationsForCustomer,
  listDashboardsForOrg,
  listDataSourcesForOrg,
  listGrantsForUser,
} from "@/lib/db/queries";
import { listUsers } from "@/lib/auth/users";
import { hslToHex } from "@/lib/branding";
import { CustomerBrandingForm } from "@/components/settings/CustomerBrandingForm";
import { CustomerHeaderActions } from "@/components/settings/CustomerHeaderActions";
import { ProjectBrandingForm } from "@/components/settings/ProjectBrandingForm";
import { ProjectsManager, type ProjectVM } from "@/components/settings/ProjectsManager";
import { CustomerUsersManager } from "@/components/settings/CustomerUsersManager";

export const dynamic = "force-dynamic";

export default async function KundeDetailPage({
  params,
}: {
  params: { customerSlug: string };
}) {
  await requireAdmin();

  const customer = await getCustomerBySlug(params.customerSlug);
  if (!customer) notFound();

  const orgs = await listOrganizationsForCustomer(customer.id);
  const projects: ProjectVM[] = await Promise.all(
    orgs.map(async (o) => {
      const [dashboards, dataSources] = await Promise.all([
        listDashboardsForOrg(o.id),
        listDataSourcesForOrg(o.id),
      ]);
      return {
        id: o.id,
        name: o.name,
        slug: o.slug,
        dashboards: dashboards.map((d) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          isDefault: d.isDefault,
        })),
        dataSources: dataSources.map((ds) => ({
          id: ds.id,
          type: ds.type,
          label: ds.label,
          matomoSiteId: ds.matomoSiteId,
        })),
      };
    }),
  );

  // Nutzer dieses Kunden: organizationId in einem Projekt ODER Grant auf den
  // Kunden / eines seiner Projekte.
  const projectIds = new Set(orgs.map((o) => o.id));
  const allUsers = await listUsers();
  const allCustomers = await listCustomers();
  const customerUsers = [];
  for (const u of allUsers) {
    let belongs = u.organizationId ? projectIds.has(u.organizationId) : false;
    if (!belongs) {
      const grants = await listGrantsForUser(u.id);
      belongs = grants.some(
        (g) =>
          (g.scopeType === "customer" && g.scopeId === customer.id) ||
          (g.scopeType === "project" && projectIds.has(g.scopeId)),
      );
    }
    if (belongs) {
      customerUsers.push({ id: u.id, email: u.email, name: u.name, role: u.role });
    }
  }

  return (
    <div className="space-y-10 p-6">
      <CustomerHeaderActions id={customer.id} name={customer.name} slug={customer.slug} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Projekte", value: projects.length },
          { label: "Dashboards", value: projects.reduce((a, p) => a + p.dashboards.length, 0) },
          { label: "Datenquellen", value: projects.reduce((a, p) => a + p.dataSources.length, 0) },
          { label: "Nutzer", value: customerUsers.length },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-2xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Projekte</h2>
        <ProjectsManager
          customerId={customer.id}
          projects={projects}
          customers={allCustomers.map((c) => ({ id: c.id, name: c.name }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Nutzer</h2>
        <CustomerUsersManager
          customerId={customer.id}
          users={customerUsers}
          allUsers={allUsers.map((u) => ({ id: u.id, email: u.email, name: u.name }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Branding (Kunde-Default)</h2>
        <CustomerBrandingForm
          customer={{
            id: customer.id,
            name: customer.name,
            brandingLogoBase64: customer.brandingLogoBase64 ?? null,
            brandingAccentHex: customer.brandingAccentHsl
              ? hslToHex(customer.brandingAccentHsl)
              : null,
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Projekt-Branding (Override)</h2>
        <p className="text-sm text-muted-foreground">
          Optionaler Override pro Projekt. Leer = das Projekt erbt das Kunde-Default-Branding.
        </p>
        <ProjectBrandingForm
          projects={orgs.map((o) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            brandingLogoBase64: o.brandingLogoBase64 ?? null,
            brandingAccentHex: o.brandingAccentHsl ? hslToHex(o.brandingAccentHsl) : null,
          }))}
        />
      </section>
    </div>
  );
}
