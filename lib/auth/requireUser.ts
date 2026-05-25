import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { redirect } from "next/navigation";
import { findSiteByMatomoIdAnyOrg, getSiteByMatomoId } from "@/lib/db/queries";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/dashboard");
  return session;
}

/**
 * Prüft, ob der aktuelle Nutzer Zugriff auf die angegebene Matomo-Site hat.
 * - Admin: hat Zugriff auf alle Sites in der gesamten DB (alle Orgs)
 * - Viewer: nur Sites seiner zugewiesenen Organisation
 *
 * Bei fehlendem Zugriff: redirect("/settings?error=no-access")
 */
export async function assertSiteAccess(matomoSiteId: number): Promise<void> {
  const session = await requireUser();

  if (session.user.role === "admin") {
    const site = await findSiteByMatomoIdAnyOrg(matomoSiteId);
    if (!site) redirect("/settings?error=no-access");
    return;
  }

  // Viewer
  const orgId = session.user.organizationId;
  if (!orgId) redirect("/settings?error=no-access");

  const site = await getSiteByMatomoId(orgId, matomoSiteId);
  if (!site) redirect("/settings?error=no-access");
}
