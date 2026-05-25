import { requireUser } from "@/lib/auth/requireUser";
import { getDefaultOrgWithSites } from "@/lib/db/queries";
import { listUsers } from "@/lib/auth/users";
import { Header } from "@/components/dashboard/Header";
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

  const { sites } = await getDefaultOrgWithSites();
  const users = isAdmin ? await listUsers() : [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Einstellungen</h1>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "Verwalte Websites, Nutzer und dein eigenes Passwort."
                : "Hier kannst du dein Passwort ändern."}
            </p>
          </div>

          {searchParams.error === "no-access" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Du hast versucht, eine Website aufzurufen, die nicht (mehr) verknüpft ist.
            </div>
          )}

          {isAdmin && (
            <section className="space-y-2">
              <h2 className="text-lg font-medium text-slate-800">Websites</h2>
              <SiteList
                sites={sites.map((s) => ({
                  id: s.id,
                  matomoSiteId: s.matomoSiteId,
                  label: s.label,
                }))}
              />
            </section>
          )}

          {isAdmin && (
            <section className="space-y-2">
              <h2 className="text-lg font-medium text-slate-800">Nutzerkonten</h2>
              <UserList
                users={users.map((u) => ({
                  id: u.id,
                  email: u.email,
                  name: u.name,
                  role: u.role,
                  createdAt: u.createdAt,
                }))}
                currentUserId={session.user.id}
              />
            </section>
          )}

          <section className="space-y-2">
            <h2 className="text-lg font-medium text-slate-800">Mein Konto</h2>
            <ChangePasswordForm />
          </section>
        </div>
      </main>
    </div>
  );
}
