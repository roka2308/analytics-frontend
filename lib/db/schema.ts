import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const matomoSites = sqliteTable("matomo_sites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  matomoSiteId: integer("matomo_site_id").notNull(),
  label: text("label").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

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
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
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
  role: text("role", { enum: ["admin", "viewer"] })
    .notNull()
    .default("viewer"),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

