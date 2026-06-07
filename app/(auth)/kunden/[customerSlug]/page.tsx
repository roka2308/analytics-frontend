import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  getCustomerBySlug,
  listOrganizationsForCustomer,
  countDataSourcesInOrg,
  countUsersInOrg,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { hslToHex } from "@/lib/branding";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { CustomerBrandingForm } from "@/components/settings/CustomerBrandingForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function KundeOverviewPage({
  params,
}: {
  params: { customerSlug: string };
}) {
  const session = await requireAdmin();

  const customer = await getCustomerBySlug(params.customerSlug);
  if (!customer) notFound();

  const orgs = await listOrganizationsForCustomer(customer.id);
  const projects = await Promise.all(
    orgs.map(async (o) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      dataSourceCount: await countDataSourcesInOrg(o.id),
      userCount: await countUsersInOrg(o.id),
    })),
  );

  const headerProjects = await getVisibleProjectsForSession(session);

  return (
    <AppShell
      projects={headerProjects.map((p) => ({ slug: p.slug, name: p.name }))}
      dashboards={[]}
    >
      <Topbar
        title={customer.name}
        subtitle={
          <span>
            <Link href="/kunden" className="hover:text-accent-text">
              Kunden
            </Link>{" "}
            / {customer.name}
          </span>
        }
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-3xl space-y-10">
          <section className="space-y-3">
            <h2 className="text-lg font-medium text-foreground">Projekte</h2>
            <Card>
              <CardHeader>
                <CardTitle>Projekte dieses Kunden</CardTitle>
                <CardDescription>
                  Jedes Projekt bündelt Datenquellen und Dashboards. Verwaltung der
                  Projekte erfolgt aktuell in den Einstellungen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Projekte. Lege Projekte in den{" "}
                    <Link href="/settings" className="text-accent-text hover:underline">
                      Einstellungen
                    </Link>{" "}
                    an.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {projects.map((p) => (
                      <div key={p.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.dataSourceCount} Datenquelle(n) · {p.userCount} Nutzer ·
                            /projekte/{p.slug}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" asChild>
                          <Link href={`/projekte/${p.slug}`}>Öffnen</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
      </main>
    </AppShell>
  );
}
