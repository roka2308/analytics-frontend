import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  getCustomerBySlug,
  listOrganizationsForCustomer,
  listDashboardsForOrg,
  listDataSourcesForOrg,
  listGrantsForUser,
} from "@/lib/db/queries";
import { listUsers } from "@/lib/auth/users";
import { hslToHex } from "@/lib/branding";
import { CustomerBrandingForm } from "@/components/settings/CustomerBrandingForm";
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
        dashboards: dashboards.map((d) => ({ id: d.id, name: d.name, slug: d.slug })),
        dataSources: dataSources.map((ds) => ({
          id: ds.id,
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
      <div>
        <h1 className="heading-display text-2xl text-foreground">{customer.name}</h1>
        <p className="text-sm text-muted-foreground">/kunden/{customer.slug}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Projekte</h2>
        <ProjectsManager customerId={customer.id} projects={projects} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Nutzer</h2>
        <CustomerUsersManager customerId={customer.id} users={customerUsers} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-foreground">Branding</h2>
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
    </div>
  );
}
