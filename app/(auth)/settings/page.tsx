import { requireUser } from "@/lib/auth/requireUser";
import { getDefaultOrgWithSites } from "@/lib/db/queries";
import { Header } from "@/components/dashboard/Header";
import { SiteList } from "@/components/settings/SiteList";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  await requireUser();
  const { sites } = await getDefaultOrgWithSites();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Einstellungen</h1>
            <p className="mt-1 text-sm text-slate-500">
              Websites verwalten, die im Dashboard auswählbar sind.
            </p>
          </div>

          {searchParams.error === "no-access" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Du hast versucht, eine Website aufzurufen, die nicht (mehr) verknüpft ist.
              Wähle unten eine verfügbare Website oder füge eine neue hinzu.
            </div>
          )}

          <SiteList sites={sites.map((s) => ({
            id: s.id,
            matomoSiteId: s.matomoSiteId,
            label: s.label,
          }))} />
        </div>
      </main>
    </div>
  );
}
