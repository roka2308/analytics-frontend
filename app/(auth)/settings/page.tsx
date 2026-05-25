import { requireUser } from "@/lib/auth/requireUser";
import {
  ensureSeedSite,
  getAllSitesWithOrg,
  getOrCreateDefaultOrg,
  listOrganizations,
} from "@/lib/db/queries";
import { listUsers } from "@/lib/auth/users";
import { Header } from "@/components/dashboard/Header";
import { OrgList } from "@/components/settings/OrgList";
import { SiteList } from "@/components/settings/SiteList";
import { UserList } from "@/components/settings/UserList";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await requireUser();
  const isAdmin = session.user.role === "admin";

  // Beim allerersten Aufruf: Default-Org + Seed-Site sicherstellen
  const defaultOrg = await getOrCreateDefaultOrg();
  await ensureSeedSite(defaultOrg.id);

  const orgs = isAdmin ? await listOrganizations() : [];
  const sites = isAdmin ? await getAllSitesWithOrg() : [];
  const usersRaw = isAdmin ? await listUsers() : [];

  // Map User → orgName
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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-10">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Einstellungen</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "Verwalte Organisationen, Websites, Nutzer und dein eigenes Passwort."
                : "Hier kannst du dein Passwort ändern."}
            </p>
          </div>

          {searchParams.error === "no-access" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Du hast versucht, eine Website aufzurufen, die nicht (mehr) verknüpft ist
              oder zu der du keinen Zugriff hast.
            </div>
          )}

          {isAdmin && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-slate-800">Organisationen</h2>
              <OrgList orgs={orgs.map((o) => ({ id: o.id, name: o.name }))} />
            </section>
          )}

          {isAdmin && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-slate-800">Websites</h2>
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
              <h2 className="text-lg font-medium text-slate-800">Nutzerkonten</h2>
              <UserList
                users={usersForUi}
                orgs={orgs.map((o) => ({ id: o.id, name: o.name }))}
                currentUserId={session.user.id}
              />
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-medium text-slate-800">Mein Konto</h2>
            <ChangePasswordForm />
          </section>
        </div>
      </main>
    </div>
  );
}
