import "server-only";
import { db } from "./index";
import { organizations, matomoSites } from "./schema";
import { eq, asc } from "drizzle-orm";

const DEFAULT_ORG_NAME = "Standard-Organisation";

/**
 * Gibt die Default-Organisation zurück. Legt sie an, wenn noch keine existiert.
 * Im Single-User-Modus (M4.1) hat alles dieselbe Org.
 * In M4.2 wird das durch echte User-Org-Zuordnungen ersetzt.
 */
export async function getOrCreateDefaultOrg() {
  const existing = await db.select().from(organizations).limit(1);
  if (existing.length > 0) return existing[0];

  const id = crypto.randomUUID();
  await db.insert(organizations).values({ id, name: DEFAULT_ORG_NAME });
  const [created] = await db.select().from(organizations).where(eq(organizations.id, id));
  return created;
}

/**
 * Beim allerersten Start: Wenn DEFAULT_MATOMO_SITE_ID in .env gesetzt ist
 * und noch keine Site existiert, wird sie automatisch angelegt.
 */
export async function ensureSeedSite(orgId: string) {
  const existing = await db.select().from(matomoSites).where(eq(matomoSites.organizationId, orgId)).limit(1);
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

export async function getSiteByMatomoId(orgId: string, matomoSiteId: number) {
  const rows = await db
    .select()
    .from(matomoSites)
    .where(eq(matomoSites.organizationId, orgId))
    .limit(50);
  return rows.find((r) => r.matomoSiteId === matomoSiteId) ?? null;
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
 * Bequemer Helfer: Default-Org abrufen, Seed-Site sicherstellen, Sites zurückgeben.
 */
export async function getDefaultOrgWithSites() {
  const org = await getOrCreateDefaultOrg();
  await ensureSeedSite(org.id);
  const sites = await getSitesForOrg(org.id);
  return { org, sites };
}
