import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { redirect } from "next/navigation";
import { getOrCreateDefaultOrg, getSiteByMatomoId } from "@/lib/db/queries";

export async function requireUser() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Prüft, ob der aktuelle Nutzer Zugriff auf die angegebene Matomo-Site hat.
 * Im Single-User-Modus (M4.1): Site muss in der Default-Org existieren.
 * In M4.2/3: Hier kommt die echte User→Org→Site-Prüfung dazu.
 *
 * Wirft (redirect zu /settings), wenn kein Zugriff besteht.
 */
export async function assertSiteAccess(matomoSiteId: number): Promise<void> {
  const org = await getOrCreateDefaultOrg();
  const site = await getSiteByMatomoId(org.id, matomoSiteId);
  if (!site) {
    redirect("/settings?error=no-access");
  }
}
