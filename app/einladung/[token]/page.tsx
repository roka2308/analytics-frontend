import Link from "next/link";
import { getUserByInviteToken } from "@/lib/auth/users";
import { AcceptInviteForm } from "@/components/settings/AcceptInviteForm";

export const dynamic = "force-dynamic";

export default async function EinladungPage({ params }: { params: { token: string } }) {
  const user = await getUserByInviteToken(params.token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="heading-display text-xl text-foreground">Konto aktivieren</h1>
        {!user ? (
          <div className="mt-4 space-y-3">
            <p className="rounded-md bg-warning/10 px-3 py-2 text-sm text-foreground">
              Diese Einladung ist ungültig oder abgelaufen. Bitte wende dich an deinen Administrator.
            </p>
            <Link href="/login" className="text-sm text-accent-text hover:underline">
              Zur Anmeldung
            </Link>
          </div>
        ) : (
          <div className="mt-4">
            <AcceptInviteForm token={params.token} email={user.email} />
          </div>
        )}
      </div>
    </div>
  );
}
