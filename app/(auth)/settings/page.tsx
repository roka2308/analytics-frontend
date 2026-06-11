import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { getVisibleProjectsForSession } from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";

export const dynamic = "force-dynamic";

/**
 * Die frühere Einstellungen-Sammelseite wurde aufgeteilt in /kunden
 * (Verwaltung) und /zugriffe (Rechte); das Konto liegt unter /konto.
 * Diese Route bleibt nur als sichere Landeseite für Alt-Redirects
 * (z.B. ?error=no-access) erhalten.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await requireUser();

  // Ohne Fehlermeldung gibt es hier nichts mehr zu sehen -> Konto.
  if (!searchParams.error) redirect("/konto");

  const projects = await getVisibleProjectsForSession(session);
  const isAdmin = session.user.role === "admin";

  return (
    <AppShell
      projects={projects.map((p) => ({ slug: p.slug, name: p.name, customerName: p.customerName }))}
      dashboards={[]}
    >
      <Topbar title="Hinweis" />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
            Du hast versucht, eine Ressource aufzurufen, zu der du keinen Zugriff hast.
          </div>
          <div className="flex gap-3 text-sm">
            {isAdmin && (
              <Link href="/kunden" className="text-accent-text hover:underline">
                Zur Kundenverwaltung
              </Link>
            )}
            <Link href="/konto" className="text-accent-text hover:underline">
              Mein Konto
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
