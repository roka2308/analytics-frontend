import { requireUser } from "@/lib/auth/requireUser";
import { getVisibleProjectsForSession } from "@/lib/db/queries";
import { AppShell } from "@/components/layout/AppShell";
import { Topbar } from "@/components/layout/Topbar";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function KontoPage() {
  const session = await requireUser();
  const projects = await getVisibleProjectsForSession(session);

  return (
    <AppShell
      projects={projects.map((p) => ({ slug: p.slug, name: p.name }))}
      dashboards={[]}
    >
      <Topbar
        title="Mein Konto"
        subtitle={<span>Angemeldet als {session.user.email}.</span>}
      />
      <main className="px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <ChangePasswordForm />
        </div>
      </main>
    </AppShell>
  );
}
