import { headers } from "next/headers";
import { requireUser } from "@/lib/auth/requireUser";
import {
  ensureSeedSite,
  getAllSitesWithOrg,
  getOrCreateDefaultOrg,
  getSitesForOrg,
  getVisibleProjectsForSession,
  listDashboardsForOrg,
  listOrganizations,
} from "@/lib/db/queries";
import { ensureSeedDashboard } from "@/lib/widgets/seed";
import { listShareTokensForDashboard } from "@/lib/sharing/tokens";
import { listUsers } from "@/lib/auth/users";
import { Header } from "@/components/dashboard/Header";
import { OrgList } from "@/components/settings/OrgList";
import { SiteList } from "@/components/settings/SiteList";
import { UserList } from "@/components/settings/UserList";
import { DashboardList } from "@/components/settings/DashboardList";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { ProjectBrandingForm } from "@/components/settings/ProjectBrandingForm";
import { hslToHex } from "@/lib/branding";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await requireUser();
  const isAdmin = session.user.role === "admin";

  const defaultOrg = await getOrCreateDefaultOrg();
  await ensureSeedSite(defaultOrg.id);
  await ensureSeedDashboard(defaultOrg.id);

  const orgs = isAdmin ? await listOrganizations() : [];
  const sites = isAdmin ? await getAllSitesWithOrg() : [];
  const usersRaw = isAdmin ? await listUsers() : [];
  const dashboardsRaw = isAdmin ? await listDashboardsForOrg(defaultOrg.id) : [];

  // Share-Tokens und Default-Projekt-Sites laden (fuer DashboardList)
  const sitesForDefaultProject = isAdmin
    ? await getSitesForOrg(defaultOrg.id)
    : [];
  const shareTokensByDashboard = new Map<string, Awaited<ReturnType<typeof listShareTokensForDashboard>>>();
  if (isAdmin) {
    for (const d of dashboardsRaw) {
      shareTokensByDashboard.set(d.id, await listShareTokensForDashboard(d.id));
    }
  }

  // Base-URL fuer Share-Links zusammenbauen
  const hdrs = headers();
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const host = hdrs.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  const projectsForHeader = await getVisibleProjectsForSession(session);

  const orgById = new Map(orgs.map((o) => [o.id, o.name] as const));
  const usersForUi = usersRaw.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    organizationId: u.organizationId,
    orgName: u.organizationId ? orgById.get(u.organizationId) ?? "—" : "—",
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        projects={projectsForHeader.map((p) => ({ slug: p.slug, name: p.name }))}
      />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-10">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Einstellungen</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? "Verwalte Projekte, Dashboards, Websites, Nutzer und dein eigenes Passwort."
                : "Hier kannst du dein Passwort ändern."}
            </p>
          </div>

          {searchParams.error === "no-access" && (
            <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
              Du hast versucht, eine Ressource aufzurufen, zu der du keinen Zugriff hast.
            </div>
          )}

          {isAdmin && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-foreground">Projekte</h2>
              <OrgList orgs={orgs.map((o) => ({ id: o.id, name: o.name, slug: o.slug }))} />
            </section>
          )}

          {isAdmin && (
            <section id="branding" className="space-y-3 scroll-mt-24">
              <h2 className="text-lg font-medium text-foreground">Branding pro Projekt</h2>
              <p className="text-sm text-muted-foreground">
                Logo und Akzentfarbe pro Projekt. Das Logo erscheint dezent im Header,
                die Akzentfarbe wird für Buttons, Hervorhebungen und Charts genutzt.
              </p>
              <ProjectBrandingForm
                projects={orgs.map((o) => ({
                  id: o.id,
                  name: o.name,
                  slug: o.slug,
                  brandingLogoBase64: o.brandingLogoBase64 ?? null,
                  brandingAccentHex: o.brandingAccentHsl
                    ? hslToHex(o.brandingAccentHsl)
                    : null,
                }))}
              />
            </section>
          )}

          {isAdmin && (
            <section id="dashboards" className="space-y-3 scroll-mt-24">
              <h2 className="text-lg font-medium text-foreground">Dashboards (Standard-Projekt)</h2>
              <p className="text-sm text-muted-foreground">
                Aktuell werden hier die Dashboards des Default-Projekts angezeigt.
                Projekt-spezifische Dashboard-Verwaltung kommt in der nächsten Phase.
              </p>
              <DashboardList
                baseUrl={baseUrl}
                sites={sitesForDefaultProject.map((s) => ({
                  matomoSiteId: s.matomoSiteId,
                  label: s.label,
                }))}
                dashboards={dashboardsRaw.map((d) => ({
                  id: d.id,
                  slug: d.slug,
                  name: d.name,
                  description: d.description,
                  isDefault: d.isDefault,
                  defaultRangePreset: d.defaultRangePreset,
                  defaultRangeFrom: d.defaultRangeFrom,
                  defaultRangeTo: d.defaultRangeTo,
                  defaultCompareMode: d.defaultCompareMode,
                  shareTokens: shareTokensByDashboard.get(d.id) ?? [],
                }))}
              />
            </section>
          )}

          {isAdmin && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-foreground">Websites</h2>
              <SiteList
                sites={sites.map((s) => ({
                  id: s.id,
                  matomoSiteId: s.matomoSiteId,
                  label: s.label,
                  orgName: s.orgName,
                }))}
                orgs={orgs.map((o) => ({ id: o.id, name: o.name }))}
              />
            </section>
          )}

          {isAdmin && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-foreground">Nutzerkonten</h2>
              <UserList
                users={usersForUi}
                orgs={orgs.map((o) => ({ id: o.id, name: o.name }))}
                currentUserId={session.user.id}
              />
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-foreground">Mein Konto</h2>
            <ChangePasswordForm />
          </section>
        </div>
      </main>
    </div>
  );
}
