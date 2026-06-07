import { getServerSession } from "next-auth";
import { authOptions } from "./config";
import { redirect } from "next/navigation";
import { getSiteByMatomoId, getSitesForOrg } from "@/lib/db/queries";

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
 * Prueft, ob der Nutzer Zugriff auf eine Site IM KONTEXT eines bestimmten
 * Projekts hat:
 * - Admin: hat Zugriff auf jede Site jedes Projekts.
 * - Viewer: nur Sites seines eigenen Projekts.
 *
 * Bei fehlendem Zugriff: redirect auf Projekt-Settings.
 */
export async function assertProjectSiteAccess(
  projectOrgId: string,
  matomoSiteId: number
): Promise<void> {
  const session = await requireUser();

  if (session.user.role === "viewer") {
    if (session.user.organizationId !== projectOrgId) {
      redirect("/settings?error=no-access");
    }
  }

  const site = await getSiteByMatomoId(projectOrgId, matomoSiteId);
  if (!site) {
    redirect(`/settings?error=no-access`);
  }
}

/**
 * Prueft fuer Viewer, ob er auf ein bestimmtes Projekt zugreifen darf.
 * Admin darf immer auf alle Projekte. Bei fehlendem Zugriff: redirect.
 */
export async function assertProjectAccess(projectOrgId: string): Promise<void> {
  const session = await requireUser();
  if (session.user.role === "admin") return;
  if (session.user.organizationId !== projectOrgId) {
    redirect("/settings?error=no-access");
  }
}

/**
 * Liefert die Sites eines spezifischen Projekts, gefiltert nach Zugriff.
 * (Admin oder eigener Viewer)
 */
export async function getProjectSitesForSession(
  projectOrgId: string,
  session: {
    user: { role: "admin" | "creator" | "viewer"; organizationId: string | null };
  }
) {
  if (session.user.role === "viewer" && session.user.organizationId !== projectOrgId) {
    return [];
  }
  return getSitesForOrg(projectOrgId);
}

/**
 * @deprecated Bitte assertProjectSiteAccess nutzen. Bleibt fuer Legacy-Routen.
 */
export async function assertSiteAccess(matomoSiteId: number): Promise<void> {
  const session = await requireUser();
  if (session.user.role === "admin") {
    const { findSiteByMatomoIdAnyOrg } = await import("@/lib/db/queries");
    const site = await findSiteByMatomoIdAnyOrg(matomoSiteId);
    if (!site) redirect("/settings?error=no-access");
    return;
  }
  const orgId = session.user.organizationId;
  if (!orgId) redirect("/settings?error=no-access");
  const site = await getSiteByMatomoId(orgId, matomoSiteId);
  if (!site) redirect("/settings?error=no-access");
}
