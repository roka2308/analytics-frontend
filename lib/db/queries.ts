import "server-only";
import { db } from "./index";
import { organizations, matomoSites, users } from "./schema";
import { eq, asc, count } from "drizzle-orm";

const DEFAULT_ORG_NAME = "Standard-Organisation";

// ──────────────────────────────────────────────────────────────
// Organizations
// ──────────────────────────────────────────────────────────────

export async function listOrganizations() {
  return db.select().from(organizations).orderBy(asc(organizations.name));
}

export async function getOrgById(id: string) {
  const rows = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOrCreateDefaultOrg() {
  const existing = await db.select().from(organizations).limit(1);
  if (existing.length > 0) return existing[0];

  const id = crypto.randomUUID();
  await db.insert(organizations).values({ id, name: DEFAULT_ORG_NAME });
  const [created] = await db.select().from(organizations).where(eq(organizations.id, id));
  return created;
}

export async function createOrganization(name: string) {
  const id = crypto.randomUUID();
  await db.insert(organizations).values({ id, name });
  const [created] = await db.select().from(organizations).where(eq(organizations.id, id));
  return created;
}

export async function renameOrganization(id: string, name: string) {
  await db.update(organizations).set({ name }).where(eq(organizations.id, id));
}

export async function deleteOrganization(id: string) {
  await db.delete(organizations).where(eq(organizations.id, id));
}

export async function countUsersInOrg(orgId: string): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.organizationId, orgId));
  return result[0]?.value ?? 0;
}

export async function countSitesInOrg(orgId: string): Promise<number> {
  const result = await db
    .select({ value: count() })
    .from(matomoSites)
    .where(eq(matomoSites.organizationId, orgId));
  return result[0]?.value ?? 0;
}

// ──────────────────────────────────────────────────────────────
// Sites
// ──────────────────────────────────────────────────────────────

/**
 * Auto-Seed beim allerersten Start: Wenn noch keine Site existiert
 * und DEFAULT_MATOMO_SITE_ID in .env gesetzt ist, wird sie der Default-Org
 * zugeordnet.
 */
export async function ensureSeedSite(orgId: string) {
  const existing = await db
    .select()
    .from(matomoSites)
    .where(eq(matomoSites.organizationId, orgId))
    .limit(1);
  if (existing.length > 0) return;

  const envSiteId = process.env.DEFAULT_MATOMO_SITE_ID;
  if (!envSiteId) return;

  await db.insert(matomoSites).values({
    organizationId: orgId,
    matomoSiteId: parseInt(envSiteId, 10),
    label: "Hauptwebsite",
  });
}

export async function getSitesForOrg(orgId: string) {
  return db
    .select()
    .from(matomoSites)
    .where(eq(matomoSites.organizationId, orgId))
    .orderBy(asc(matomoSites.createdAt));
}

export interface SiteWithOrg {
  id: string;
  matomoSiteId: number;
  label: string;
  organizationId: string;
  orgName: string;
  createdAt: Date;
}

export async function getAllSitesWithOrg(): Promise<SiteWithOrg[]> {
  const rows = await db
    .select({
      id: matomoSites.id,
      matomoSiteId: matomoSites.matomoSiteId,
      label: matomoSites.label,
      organizationId: matomoSites.organizationId,
      orgName: organizations.name,
      createdAt: matomoSites.createdAt,
    })
    .from(matomoSites)
    .innerJoin(organizations, eq(matomoSites.organizationId, organizations.id))
    .orderBy(asc(organizations.name), asc(matomoSites.createdAt));
  return rows;
}

export async function getSiteByMatomoId(orgId: string, matomoSiteId: number) {
  const rows = await db
    .select()
    .from(matomoSites)
    .where(eq(matomoSites.organizationId, orgId))
    .limit(100);
  return rows.find((r) => r.matomoSiteId === matomoSiteId) ?? null;
}

export async function findSiteByMatomoIdAnyOrg(matomoSiteId: number) {
  const all = await db.select().from(matomoSites);
  return all.find((r) => r.matomoSiteId === matomoSiteId) ?? null;
}

export async function addSite(orgId: string, matomoSiteId: number, label: string) {
  await db.insert(matomoSites).values({
    organizationId: orgId,
    matomoSiteId,
    label,
  });
}

export async function removeSite(siteId: string) {
  await db.delete(matomoSites).where(eq(matomoSites.id, siteId));
}

/**
 * Liefert die im aktuellen Session-Kontext sichtbaren Sites:
 * - Admin: alle Sites aller Organisationen (mit Org-Namen für UI-Prefix)
 * - Viewer: nur Sites seiner zugewiesenen Organisation
 */
export async function getVisibleSitesForSession(session: {
  user: { role: "admin" | "viewer"; organizationId: string | null };
}): Promise<SiteWithOrg[]> {
  if (session.user.role === "admin") {
    return getAllSitesWithOrg();
  }

  if (!session.user.organizationId) return [];

  const sites = await getSitesForOrg(session.user.organizationId);
  const org = await getOrgById(session.user.organizationId);
  const orgName = org?.name ?? "—";
  return sites.map((s) => ({
    id: s.id,
    matomoSiteId: s.matomoSiteId,
    label: s.label,
    organizationId: s.organizationId,
    orgName,
    createdAt: s.createdAt,
  }));
}

/**
 * Legacy-Helfer aus M4.1 – wird vom Dashboard-Setup verwendet, um beim ersten
 * Start die Default-Org plus Seed-Site bereitzustellen.
 */
export async function getDefaultOrgWithSites() {
  const org = await getOrCreateDefaultOrg();
  await ensureSeedSite(org.id);
  const sites = await getSitesForOrg(org.id);
  return { org, sites };
}
