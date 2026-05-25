import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { redirect } from "next/navigation";
import { getOrCreateDefaultOrg, getSiteByMatomoId } from "@/lib/db/queries";

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}

/**
 * Prüft, ob der aktuelle Nutzer Zugriff auf die angegebene Matomo-Site hat.
 * - Admin: hat Zugriff auf alle Sites
 * - Viewer: nur Sites seiner Organisation
 */
export async function assertSiteAccess(matomoSiteId: number): Promise<void> {
  const session = await requireUser();

  // Admins haben Zugriff auf alles (innerhalb der Default-Org für M4.2)
  // Spätere Erweiterung: Mehrere Organisationen pro Admin
  const org = await getOrCreateDefaultOrg();

  const orgIdToCheck = session.user.role === "admin"
    ? org.id
    : session.user.organizationId ?? org.id;

  const site = await getSiteByMatomoId(orgIdToCheck, matomoSiteId);
  if (!site) {
    redirect("/settings?error=no-access");
  }
}
