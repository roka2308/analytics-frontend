import "server-only";
import { db } from "./index";
import {
  organizations,
  matomoSites,
  users,
  dashboards,
  dashboardWidgets,
} from "./schema";
import { eq, asc, count, and } from "drizzle-orm";

const DEFAULT_ORG_NAME = "Standard-Organisation";

// ──────────────────────────────────────────────────────────────
// Organizations
// ──────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function ensureUniqueOrgSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || "projekt";
  let counter = 2;
  while (true) {
    const existing = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    if (existing.length === 0) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function listOrganizations() {
  return db.select().from(organizations).orderBy(asc(organizations.name));
}

export async function getOrgById(id: string) {
  const rows = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getOrgBySlug(slug: string) {
  const rows = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getOrCreateDefaultOrg() {
  const existing = await db.select().from(organizations).limit(1);
  if (existing.length > 0) return existing[0];

  const id = crypto.randomUUID();
  const slug = await ensureUniqueOrgSlug(slugify(DEFAULT_ORG_NAME));
  await db.insert(organizations).values({ id, name: DEFAULT_ORG_NAME, slug });
  const [created] = await db.select().from(organizations).where(eq(organizations.id, id));
  return created;
}

export async function createOrganization(name: string) {
  const id = crypto.randomUUID();
  const slug = await ensureUniqueOrgSlug(slugify(name));
  await db.insert(organizations).values({ id, name, slug });
  const [created] = await db.select().from(organizations).where(eq(organizations.id, id));
  return created;
}

export async function renameOrganization(id: string, name: string) {
  await db.update(organizations).set({ name }).where(eq(organizations.id, id));
}

export async function deleteOrganization(id: string) {
  await db.delete(organizations).where(eq(organizations.id, id));
}

/**
 * Liefert die im aktuellen Session-Kontext sichtbaren Projekte:
 * - Admin: alle Projekte
 * - Viewer: nur das eigene Projekt
 */
export async function getVisibleProjectsForSession(session: {
  user: { role: "admin" | "viewer"; organizationId: string | null };
}) {
  if (session.user.role === "admin") {
    return listOrganizations();
  }
  if (!session.user.organizationId) return [];
  const org = await getOrgById(session.user.organizationId);
  return org ? [org] : [];
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

// ──────────────────────────────────────────────────────────────
// Dashboards
// ──────────────────────────────────────────────────────────────

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardWidgetRow {
  id: string;
  dashboardId: string;
  type: string;
  title: string | null;
  layout: WidgetLayout;
  config: Record<string, unknown>;
  position: number;
}

export interface DashboardRow {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  position: number;
}

function parseWidget(raw: typeof dashboardWidgets.$inferSelect): DashboardWidgetRow {
  let layout: WidgetLayout;
  let config: Record<string, unknown>;
  try {
    layout = JSON.parse(raw.layout);
  } catch {
    layout = { x: 0, y: 0, w: 12, h: 4 };
  }
  try {
    config = JSON.parse(raw.config);
  } catch {
    config = {};
  }
  return {
    id: raw.id,
    dashboardId: raw.dashboardId,
    type: raw.type,
    title: raw.title,
    layout,
    config,
    position: raw.position,
  };
}

export async function listDashboardsForOrg(orgId: string): Promise<DashboardRow[]> {
  const rows = await db
    .select()
    .from(dashboards)
    .where(eq(dashboards.organizationId, orgId))
    .orderBy(asc(dashboards.position), asc(dashboards.createdAt));
  return rows.map((r) => ({
    id: r.id,
    organizationId: r.organizationId,
    slug: r.slug,
    name: r.name,
    description: r.description,
    isDefault: r.isDefault,
    position: r.position,
  }));
}

export async function getDashboardBySlug(
  orgId: string,
  slug: string
): Promise<DashboardRow | null> {
  const rows = await db
    .select()
    .from(dashboards)
    .where(and(eq(dashboards.organizationId, orgId), eq(dashboards.slug, slug)))
    .limit(1);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    organizationId: r.organizationId,
    slug: r.slug,
    name: r.name,
    description: r.description,
    isDefault: r.isDefault,
    position: r.position,
  };
}

export async function getDefaultDashboardForOrg(orgId: string): Promise<DashboardRow | null> {
  const list = await listDashboardsForOrg(orgId);
  return list.find((d) => d.isDefault) ?? list[0] ?? null;
}

export async function getWidgetsForDashboard(dashboardId: string): Promise<DashboardWidgetRow[]> {
  const rows = await db
    .select()
    .from(dashboardWidgets)
    .where(eq(dashboardWidgets.dashboardId, dashboardId))
    .orderBy(asc(dashboardWidgets.position), asc(dashboardWidgets.createdAt));
  return rows.map(parseWidget);
}

export interface CreateDashboardInput {
  organizationId: string;
  slug: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  position?: number;
}

export async function createDashboard(input: CreateDashboardInput): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(dashboards).values({
    id,
    organizationId: input.organizationId,
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    isDefault: input.isDefault ?? false,
    position: input.position ?? 0,
  });
  return id;
}

export interface CreateWidgetInput {
  dashboardId: string;
  type: string;
  title?: string | null;
  layout: WidgetLayout;
  config: Record<string, unknown>;
  position?: number;
}

export async function createWidget(input: CreateWidgetInput): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(dashboardWidgets).values({
    id,
    dashboardId: input.dashboardId,
    type: input.type,
    title: input.title ?? null,
    layout: JSON.stringify(input.layout),
    config: JSON.stringify(input.config),
    position: input.position ?? 0,
  });
  return id;
}

export async function renameDashboard(dashboardId: string, name: string, description: string | null) {
  await db
    .update(dashboards)
    .set({ name, description, updatedAt: new Date() })
    .where(eq(dashboards.id, dashboardId));
}

export async function deleteDashboard(dashboardId: string) {
  await db.delete(dashboards).where(eq(dashboards.id, dashboardId));
}

export async function setDefaultDashboard(orgId: string, dashboardId: string) {
  // erst alle der Org auf false setzen
  await db
    .update(dashboards)
    .set({ isDefault: false })
    .where(eq(dashboards.organizationId, orgId));
  // dann das gewuenschte auf true
  await db
    .update(dashboards)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(eq(dashboards.id, dashboardId));
}

export async function countDashboardsForOrg(orgId: string): Promise<number> {
  const res = await db
    .select({ value: count() })
    .from(dashboards)
    .where(eq(dashboards.organizationId, orgId));
  return res[0]?.value ?? 0;
}
