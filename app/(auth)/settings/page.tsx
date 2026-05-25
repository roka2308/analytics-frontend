import { requireUser } from "@/lib/auth/requireUser";
import { Header } from "@/components/dashboard/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Einstellungen</h1>
            <p className="mt-1 text-sm text-slate-500">
              Site-Verwaltung
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Matomo-Sites</CardTitle>
              <CardDescription>
                Verwaltung der verknüpften Sites – wird in M4 vollständig implementiert.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                Site-Verwaltung wird in Meilenstein 4 (Multi-Tenancy) eingebaut.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
