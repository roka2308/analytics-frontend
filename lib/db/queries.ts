import "server-only";
import { db } from "./index";
import {
  customers,
  organizations,
  dataSources,
  accessGrants,
  users,
  dashboards,
  dashboardWidgets,
  dashboardSections,
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
  const customer = await getOrCreateDefaultCustomer();
  await db.insert(organizations).values({ id, name: DEFAULT_ORG_NAME, slug, customerId: customer.id });
  const [created] = await db.select().from(organizations).where(eq(organizations.id, id));
  return created;
}

export async function createOrganization(name: string, customerId?: string) {
  const id = crypto.randomUUID();
  const slug = await ensureUniqueOrgSlug(slugify(name));
  const cid = customerId ?? (await getOrCreateDefaultCustomer()).id;
  await db.insert(organizations).values({ id, name, slug, customerId: cid });
  const [created] = await db.select().from(organizations).where(eq(organizations.id, id));
  return created;
}

export async function listOrganizationsForCustomer(customerId: string) {
  return db
    .select()
    .from(organizations)
    .where(eq(organizations.customerId, customerId))
    .orderBy(asc(organizations.name));
}

export async function setOrganizationCustomer(orgId: string, customerId: string) {
  await db.update(organizations).set({ customerId }).where(eq(organizations.id, orgId));
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
  user: { role: "admin" | "creator" | "viewer"; organizationId: string | null };
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
    .from(dataSources)
    .where(and(eq(dataSources.organizationId, orgId), eq(dataSources.type, "matomo")));
  return result[0]?.value ?? 0;
}

// ──────────────────────────────────────────────────────────────
// Sites  (Stufe 5: lesen jetzt aus data_sources(type=matomo);
//          die alte matomo_sites-Tabelle ist toter Schatten bis Cleanup.)
//          Rueckgabe-Form bleibt {id, matomoSiteId, label, organizationId,
//          createdAt} -> alle Renderer/Selector/Guards laufen unveraendert.
// ──────────────────────────────────────────────────────────────

interface SiteShape {
  id: string;
  matomoSiteId: number;
  label: string;
  organizationId: string;
  createdAt: Date;
}

function toSiteShape(r: {
  id: string;
  matomoSiteId: number | null;
  label: string;
  organizationId: string;
  createdAt: Date;
}): SiteShape {
  return {
    id: r.id,
    matomoSiteId: Number(r.matomoSiteId),
    label: r.label,
    organizationId: r.organizationId,
    createdAt: r.createdAt,
  };
}

/**
 * Auto-Seed beim allerersten Start: Wenn noch keine Matomo-Datenquelle
 * existiert und DEFAULT_MATOMO_SITE_ID in .env gesetzt ist, wird sie der
 * Org zugeordnet.
 */
export async function ensureSeedSite(orgId: string) {
  const existing = await db
    .select({ id: dataSources.id })
    .from(dataSources)
    .where(and(eq(dataSources.organizationId, orgId), eq(dataSources.type, "matomo")))
    .limit(1);
  if (existing.length > 0) return;

  const envSiteId = process.env.DEFAULT_MATOMO_SITE_ID;
  if (!envSiteId) return;

  await db.insert(dataSources).values({
    organizationId: orgId,
    type: "matomo",
    matomoSiteId: parseInt(envSiteId, 10),
    label: "Hauptwebsite",
  });
}

export async function getSitesForOrg(orgId: string): Promise<SiteShape[]> {
  const rows = await db
    .select()
    .from(dataSources)
    .where(and(eq(dataSources.organizationId, orgId), eq(dataSources.type, "matomo")))
    .orderBy(asc(dataSources.createdAt));
  return rows.map(toSiteShape);
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
      id: dataSources.id,
      matomoSiteId: dataSources.matomoSiteId,
      label: dataSources.label,
      organizationId: dataSources.organizationId,
      orgName: organizations.name,
      createdAt: dataSources.createdAt,
    })
    .from(dataSources)
    .innerJoin(organizations, eq(dataSources.organizationId, organizations.id))
    .where(eq(dataSources.type, "matomo"))
    .orderBy(asc(organizations.name), asc(dataSources.createdAt));
  return rows.map((r) => ({ ...r, matomoSiteId: Number(r.matomoSiteId) }));
}

export async function getSiteByMatomoId(orgId: string, matomoSiteId: number) {
  const sites = await getSitesForOrg(orgId);
  return sites.find((r) => r.matomoSiteId === matomoSiteId) ?? null;
}

export async function findSiteByMatomoIdAnyOrg(matomoSiteId: number) {
  const all = await db
    .select()
    .from(dataSources)
    .where(eq(dataSources.type, "matomo"));
  const hit = all.find((r) => Number(r.matomoSiteId) === matomoSiteId);
  return hit ? toSiteShape(hit) : null;
}

export async function addSite(orgId: string, matomoSiteId: number, label: string) {
  await db.insert(dataSources).values({
    organizationId: orgId,
    type: "matomo",
    matomoSiteId,
    label,
  });
}

export async function removeSite(siteId: string) {
  await db.delete(dataSources).where(eq(dataSources.id, siteId));
}

/**
 * Liefert die im aktuellen Session-Kontext sichtbaren Sites:
 * - Admin: alle Sites aller Organisationen (mit Org-Namen für UI-Prefix)
 * - Viewer: nur Sites seiner zugewiesenen Organisation
 */
export async function getVisibleSitesForSession(session: {
  user: { role: "admin" | "creator" | "viewer"; organizationId: string | null };
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
  sectionId: string | null;
  type: string;
  title: string | null;
  layout: WidgetLayout;
  config: Record<string, unknown>;
  position: number;
}

export interface DashboardSectionRow {
  id: string;
  dashboardId: string;
  title: string;
  description: string | null;
  position: number;
  collapsed: boolean;
}

export interface DashboardRow {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  position: number;
  defaultRangePreset: string | null;
  defaultRangeFrom: string | null;
  defaultRangeTo: string | null;
  defaultCompareMode: string | null;
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
    sectionId: raw.sectionId,
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
    defaultRangePreset: r.defaultRangePreset,
    defaultRangeFrom: r.defaultRangeFrom,
    defaultRangeTo: r.defaultRangeTo,
    defaultCompareMode: r.defaultCompareMode,
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
    defaultRangePreset: r.defaultRangePreset,
    defaultRangeFrom: r.defaultRangeFrom,
    defaultRangeTo: r.defaultRangeTo,
    defaultCompareMode: r.defaultCompareMode,
  };
}

export async function getDashboardById(id: string): Promise<DashboardRow | null> {
  const rows = await db.select().from(dashboards).where(eq(dashboards.id, id)).limit(1);
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
    defaultRangePreset: r.defaultRangePreset,
    defaultRangeFrom: r.defaultRangeFrom,
    defaultRangeTo: r.defaultRangeTo,
    defaultCompareMode: r.defaultCompareMode,
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

export interface DashboardDefaultRange {
  preset: string | null;
  from: string | null;
  to: string | null;
  compare: string | null;
}

export async function setDashboardDefaultRange(
  dashboardId: string,
  value: DashboardDefaultRange
) {
  await db
    .update(dashboards)
    .set({
      defaultRangePreset: value.preset,
      defaultRangeFrom: value.from,
      defaultRangeTo: value.to,
      defaultCompareMode: value.compare,
      updatedAt: new Date(),
    })
    .where(eq(dashboards.id, dashboardId));
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

// ──────────────────────────────────────────────────────────────
// Sections (Phase I.1)
// ──────────────────────────────────────────────────────────────

function parseSection(raw: typeof dashboardSections.$inferSelect): DashboardSectionRow {
  return {
    id: raw.id,
    dashboardId: raw.dashboardId,
    title: raw.title,
    description: raw.description,
    position: raw.position,
    collapsed: raw.collapsed,
  };
}

export async function listSectionsForDashboard(dashboardId: string): Promise<DashboardSectionRow[]> {
  const rows = await db
    .select()
    .from(dashboardSections)
    .where(eq(dashboardSections.dashboardId, dashboardId))
    .orderBy(asc(dashboardSections.position), asc(dashboardSections.createdAt));
  return rows.map(parseSection);
}

export async function createSection(input: {
  dashboardId: string;
  title: string;
  description?: string | null;
  position?: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(dashboardSections).values({
    id,
    dashboardId: input.dashboardId,
    title: input.title,
    description: input.description ?? null,
    position: input.position ?? 0,
  });
  return id;
}

export async function renameSection(
  sectionId: string,
  title: string,
  description: string | null
) {
  await db
    .update(dashboardSections)
    .set({ title, description })
    .where(eq(dashboardSections.id, sectionId));
}

export async function deleteSection(sectionId: string) {
  // Widgets behalten – section_id wird beim Delete nicht automatisch genullt,
  // daher hier explizit
  await db
    .update(dashboardWidgets)
    .set({ sectionId: null })
    .where(eq(dashboardWidgets.sectionId, sectionId));
  await db.delete(dashboardSections).where(eq(dashboardSections.id, sectionId));
}

export async function reorderSections(items: { id: string; position: number }[]) {
  for (const it of items) {
    await db
      .update(dashboardSections)
      .set({ position: it.position })
      .where(eq(dashboardSections.id, it.id));
  }
}

// ──────────────────────────────────────────────────────────────
// Widget-Operations (Phase I.1)
// ──────────────────────────────────────────────────────────────

export async function deleteWidget(widgetId: string) {
  await db.delete(dashboardWidgets).where(eq(dashboardWidgets.id, widgetId));
}

export async function updateWidgetConfig(
  widgetId: string,
  config: Record<string, unknown>,
  title: string | null
) {
  await db
    .update(dashboardWidgets)
    .set({
      config: JSON.stringify(config),
      title,
    })
    .where(eq(dashboardWidgets.id, widgetId));
}

export async function updateWidgetLayout(widgetId: string, layout: WidgetLayout) {
  await db
    .update(dashboardWidgets)
    .set({ layout: JSON.stringify(layout) })
    .where(eq(dashboardWidgets.id, widgetId));
}

export async function reorderWidgets(items: { id: string; position: number }[]) {
  for (const it of items) {
    await db
      .update(dashboardWidgets)
      .set({ position: it.position })
      .where(eq(dashboardWidgets.id, it.id));
  }
}

export async function moveWidgetToSection(
  widgetId: string,
  sectionId: string | null
) {
  await db
    .update(dashboardWidgets)
    .set({ sectionId })
    .where(eq(dashboardWidgets.id, widgetId));
}

export async function getWidgetById(widgetId: string): Promise<DashboardWidgetRow | null> {
  const rows = await db
    .select()
    .from(dashboardWidgets)
    .where(eq(dashboardWidgets.id, widgetId))
    .limit(1);
  if (rows.length === 0) return null;
  return parseWidget(rows[0]);
}

// ──────────────────────────────────────────────────────────────
// Customers (Kunde) – oberste Ebene (Stufe 2)
// ──────────────────────────────────────────────────────────────

const DEFAULT_CUSTOMER_ID = "cust_default";
const DEFAULT_CUSTOMER_NAME = "Standard-Kunde";

async function ensureUniqueCustomerSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || "kunde";
  let counter = 2;
  while (true) {
    const existing = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.slug, slug))
      .limit(1);
    if (existing.length === 0) return slug;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function listCustomers() {
  return db.select().from(customers).orderBy(asc(customers.name));
}

export async function getCustomerById(id: string) {
  const rows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCustomerBySlug(slug: string) {
  const rows = await db.select().from(customers).where(eq(customers.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getOrCreateDefaultCustomer() {
  const existing = await getCustomerById(DEFAULT_CUSTOMER_ID);
  if (existing) return existing;
  // Falls schon irgendein Kunde existiert, nimm den ersten
  const any = await db.select().from(customers).limit(1);
  if (any.length > 0) return any[0];
  await db.insert(customers).values({
    id: DEFAULT_CUSTOMER_ID,
    name: DEFAULT_CUSTOMER_NAME,
    slug: "standard-kunde",
  });
  return (await getCustomerById(DEFAULT_CUSTOMER_ID))!;
}

export async function createCustomer(name: string) {
  const id = crypto.randomUUID();
  const slug = await ensureUniqueCustomerSlug(slugify(name));
  await db.insert(customers).values({ id, name, slug });
  return (await getCustomerById(id))!;
}

export async function renameCustomer(id: string, name: string) {
  await db.update(customers).set({ name }).where(eq(customers.id, id));
}

export async function deleteCustomer(id: string) {
  await db.delete(customers).where(eq(customers.id, id));
}

export async function setCustomerBranding(
  id: string,
  logoBase64: string | null,
  accentHsl: string | null,
) {
  await db
    .update(customers)
    .set({ brandingLogoBase64: logoBase64, brandingAccentHsl: accentHsl })
    .where(eq(customers.id, id));
}

export async function countOrgsInCustomer(customerId: string): Promise<number> {
  const r = await db
    .select({ value: count() })
    .from(organizations)
    .where(eq(organizations.customerId, customerId));
  return r[0]?.value ?? 0;
}

/**
 * Branding-Auflösung: Projekt-Override hat Vorrang, sonst Kunde-Default.
 * Eine null-Spalte des Projekts erbt vom Kunden.
 */
export interface ResolvedBranding {
  logoBase64: string | null;
  accentHsl: string | null;
}

export async function resolveOrgBranding(orgId: string): Promise<ResolvedBranding> {
  const org = await getOrgById(orgId);
  if (!org) return { logoBase64: null, accentHsl: null };
  const customer = org.customerId ? await getCustomerById(org.customerId) : null;
  return {
    logoBase64: org.brandingLogoBase64 ?? customer?.brandingLogoBase64 ?? null,
    accentHsl: org.brandingAccentHsl ?? customer?.brandingAccentHsl ?? null,
  };
}

// ──────────────────────────────────────────────────────────────
// Data Sources (Datenquelle) – verallgemeinert matomo_sites (Stufe 2)
// ──────────────────────────────────────────────────────────────

export interface DataSourceRow {
  id: string;
  organizationId: string;
  type: string;
  label: string;
  matomoSiteId: number | null;
  config: string | null;
  createdAt: Date;
}

export async function listDataSourcesForOrg(orgId: string): Promise<DataSourceRow[]> {
  return db
    .select()
    .from(dataSources)
    .where(eq(dataSources.organizationId, orgId))
    .orderBy(asc(dataSources.createdAt));
}

export async function getDataSourceById(id: string): Promise<DataSourceRow | null> {
  const rows = await db.select().from(dataSources).where(eq(dataSources.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface CreateDataSourceInput {
  organizationId: string;
  type?: string;
  label: string;
  matomoSiteId?: number | null;
  config?: string | null;
}

export async function createDataSource(input: CreateDataSourceInput): Promise<string> {
  const id = crypto.randomUUID();
  await db.insert(dataSources).values({
    id,
    organizationId: input.organizationId,
    type: input.type ?? "matomo",
    label: input.label,
    matomoSiteId: input.matomoSiteId ?? null,
    config: input.config ?? null,
  });
  return id;
}

export async function updateDataSource(
  id: string,
  fields: { label?: string; matomoSiteId?: number | null; config?: string | null },
) {
  await db.update(dataSources).set(fields).where(eq(dataSources.id, id));
}

export async function deleteDataSource(id: string) {
  await db.delete(dataSources).where(eq(dataSources.id, id));
}

export async function countDataSourcesInOrg(orgId: string): Promise<number> {
  const r = await db
    .select({ value: count() })
    .from(dataSources)
    .where(eq(dataSources.organizationId, orgId));
  return r[0]?.value ?? 0;
}

// ──────────────────────────────────────────────────────────────
// Access Grants (datengetriebenes Rechtemodell, Stufe 2)
// ──────────────────────────────────────────────────────────────

export type GrantRole = "admin" | "creator" | "viewer";
export type GrantScopeType = "customer" | "project" | "dashboard";

export interface AccessGrantRow {
  id: string;
  userId: string;
  scopeType: GrantScopeType;
  scopeId: string;
  role: GrantRole | null;
}

function parseGrant(raw: typeof accessGrants.$inferSelect): AccessGrantRow {
  return {
    id: raw.id,
    userId: raw.userId,
    scopeType: raw.scopeType as GrantScopeType,
    scopeId: raw.scopeId,
    role: (raw.role as GrantRole | null) ?? null,
  };
}

export async function listGrantsForUser(userId: string): Promise<AccessGrantRow[]> {
  const rows = await db.select().from(accessGrants).where(eq(accessGrants.userId, userId));
  return rows.map(parseGrant);
}

export async function listGrantsForScope(
  scopeType: GrantScopeType,
  scopeId: string,
): Promise<AccessGrantRow[]> {
  const rows = await db
    .select()
    .from(accessGrants)
    .where(and(eq(accessGrants.scopeType, scopeType), eq(accessGrants.scopeId, scopeId)));
  return rows.map(parseGrant);
}

/** Upsert: legt einen Grant an oder aktualisiert dessen Rolle. */
export async function grantAccess(
  userId: string,
  scopeType: GrantScopeType,
  scopeId: string,
  role: GrantRole | null,
) {
  const existing = await db
    .select()
    .from(accessGrants)
    .where(
      and(
        eq(accessGrants.userId, userId),
        eq(accessGrants.scopeType, scopeType),
        eq(accessGrants.scopeId, scopeId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    await db.update(accessGrants).set({ role }).where(eq(accessGrants.id, existing[0].id));
    return existing[0].id;
  }
  const id = crypto.randomUUID();
  await db.insert(accessGrants).values({ id, userId, scopeType, scopeId, role });
  return id;
}

export async function revokeAccess(grantId: string) {
  await db.delete(accessGrants).where(eq(accessGrants.id, grantId));
}

export async function revokeAccessByScope(
  userId: string,
  scopeType: GrantScopeType,
  scopeId: string,
) {
  await db
    .delete(accessGrants)
    .where(
      and(
        eq(accessGrants.userId, userId),
        eq(accessGrants.scopeType, scopeType),
        eq(accessGrants.scopeId, scopeId),
      ),
    );
}
