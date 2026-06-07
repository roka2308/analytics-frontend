import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Kunde – oberste Ebene der Hierarchie Kunde -> Projekt -> Datenquelle ->
 * Dashboard. UI-Begriff "Kunde"; Code-Begriff "customer".
 * Branding hier = Default fuer alle Projekte des Kunden (Projekt kann
 * per Override abweichen, siehe organizations.branding*).
 */
export const customers = sqliteTable("customers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // Kunde-Default-Branding (Logo Base64-Data-URL, Akzentfarbe als HSL-Tripel)
  brandingLogoBase64: text("branding_logo_base64"),
  brandingAccentHsl: text("branding_accent_hsl"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const organizations = sqliteTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  // URL-freundlicher Identifier, eindeutig global.
  // UI-Begriff "Projekt"; Code-Begriff bleibt "organization".
  slug: text("slug").notNull().unique(),
  // Kunde, zu dem dieses Projekt gehoert. Nullable fuer die Migration
  // (Backfill auf Standard-Kunde); logisch Pflicht.
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "cascade",
  }),
  // Branding (Phase D) – jetzt OPTIONALER Override pro Projekt.
  // null = erbt vom Kunden. Logo als Base64-Data-URL (klein halten, < 100KB).
  // Akzentfarbe als HSL-Tripel im Format "H S% L%" passend zu CSS-Variablen.
  brandingLogoBase64: text("branding_logo_base64"),
  brandingAccentHsl: text("branding_accent_hsl"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Datenquelle – verallgemeinert die frueheren matomo_sites. Gehoert zu einem
 * Projekt (organization). type bestimmt die DataSource-Implementierung.
 * - matomo: matomoSiteId gesetzt
 * - sql / weitere: config (JSON) gesetzt
 * matomo_sites bleibt waehrend der Migration als deprecated bestehen.
 */
export const dataSources = sqliteTable("data_sources", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  // "matomo" | "sql" | ... (erweiterbar, daher kein DB-Enum)
  type: text("type").notNull().default("matomo"),
  label: text("label").notNull(),
  // Nur fuer type=matomo
  matomoSiteId: integer("matomo_site_id"),
  // JSON fuer type!=matomo (Verbindungs-/Quellen-spezifische Einstellungen)
  config: text("config"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Zugriffs-Grant – Kern des datengetriebenen Rechtemodells.
 * Verknuepft einen Nutzer mit einem Scope (Kunde/Projekt/Dashboard) und
 * optional einer Rolle innerhalb dieses Scopes. So lassen sich z.B. Viewer
 * gezielt nur auf einzelne Dashboards berechtigen.
 * Die konkrete "wer darf was"-Policy liegt zentral in lib/auth/permissions.ts.
 */
export const accessGrants = sqliteTable(
  "access_grants",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // "customer" | "project" | "dashboard"
    scopeType: text("scope_type").notNull(),
    scopeId: text("scope_id").notNull(),
    // Rolle innerhalb des Scopes; null = globale Rolle des Nutzers verwenden
    role: text("role"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    grantScopeIdx: uniqueIndex("access_grant_scope_idx").on(
      table.userId,
      table.scopeType,
      table.scopeId,
    ),
  }),
);

// HINWEIS: Die frühere Tabelle `matomo_sites` wurde in Stufe 5 durch
// `data_sources` (type=matomo) abgelöst und per Migration 0010 entfernt.

export const cacheEntries = sqliteTable(
  "cache_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    cacheKey: text("cache_key").notNull(),
    payload: text("payload").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => ({
    cacheKeyIdx: uniqueIndex("cache_key_idx").on(table.cacheKey),
  })
);

/**
 * Dashboards: jede Org kann mehrere haben.
 * Layout-/Widget-Definition ist in dashboard_widgets ausgelagert.
 */
export const dashboards = sqliteTable("dashboards", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  // URL-freundlicher Identifier, eindeutig PRO ORG (nicht global)
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  // Markiert das Default-Dashboard pro Org (nur eines)
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  // Sortier-Reihenfolge in der Dashboard-Liste
  position: integer("position").notNull().default(0),
  // Default-Zeitraum dieses Dashboards.
  // Wenn null: aus URL/Default lesen (heute = "letzte 7 Tage").
  // Wenn gesetzt: dieser Preset wird verwendet, sofern URL nichts anderes vorgibt.
  defaultRangePreset: text("default_range_preset"),
  defaultRangeFrom: text("default_range_from"), // YYYY-MM-DD fuer custom-range
  defaultRangeTo: text("default_range_to"),
  defaultCompareMode: text("default_compare_mode"), // none/previous/year
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Sections gruppieren Widgets innerhalb eines Dashboards thematisch.
 *
 * Optional: Widgets ohne section_id liegen "freitstehend" (default).
 * Sections sind die Vorbereitung fuer redaktionelle Layouts
 * (z.B. "Traffic", "Engagement", "Conversion").
 */
export const dashboardSections = sqliteTable("dashboard_sections", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  dashboardId: text("dashboard_id")
    .notNull()
    .references(() => dashboards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  position: integer("position").notNull().default(0),
  collapsed: integer("collapsed", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Share-Tokens fuer Dashboard-Read-Only-Zugriff ohne Login.
 *
 * Architektur:
 *  - Token wird kryptografisch sicher generiert (32 Byte → base64url)
 *  - URL: /share/[token] – middleware laesst diese Route oeffentlich
 *  - Optional: matomoSiteId (fixiert die Site), expiresAt (Ablauf),
 *    revokedAt (Widerruf ohne Loeschen), label (Beschreibung)
 */
export const dashboardShareTokens = sqliteTable("dashboard_share_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  dashboardId: text("dashboard_id")
    .notNull()
    .references(() => dashboards.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  label: text("label"),
  // Optional eine bestimmte Site fixieren (sonst: erste Site des Projekts)
  matomoSiteId: integer("matomo_site_id"),
  // Optional Ablaufdatum
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  // Widerruf-Marker (statt loeschen – Audit-Trail bleibt)
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  // Wer hat den Token erstellt
  createdByUserId: text("created_by_user_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

/**
 * Widgets eines Dashboards.
 * - type: bestimmt, welche Komponente gerendert wird (siehe Widget-Registry)
 * - config: JSON-String mit widget-spezifischen Einstellungen (Metrik, Farbe, etc.)
 * - layout: JSON-String mit {x, y, w, h} fuer Grid-Position
 *
 * Beides als JSON erlaubt neue Widget-Typen und neue Configs OHNE Schema-Migration.
 */
export const dashboardWidgets = sqliteTable("dashboard_widgets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  dashboardId: text("dashboard_id")
    .notNull()
    .references(() => dashboards.id, { onDelete: "cascade" }),
  // Optionale Section-Zugehoerigkeit (Phase I.1).
  // null = freistehendes Widget (bisheriges Verhalten).
  sectionId: text("section_id"),
  type: text("type").notNull(),
  title: text("title"),
  // JSON: { x: 0-11, y: 0+, w: 1-12, h: 1+ } im 12-Spalten-Grid
  layout: text("layout").notNull().default('{"x":0,"y":0,"w":12,"h":4}'),
  // JSON mit widget-spezifischen Einstellungen (frei strukturiert pro Widget-Typ)
  config: text("config").notNull().default("{}"),
  // Sortier-Reihenfolge fuer den Fall, dass das Grid mal nicht greift
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  role: text("role", { enum: ["admin", "creator", "viewer"] })
    .notNull()
    .default("viewer"),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

