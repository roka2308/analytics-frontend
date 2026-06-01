/**
 * Universelles Migrations-Skript.
 *
 * Funktioniert sowohl mit lokaler SQLite-Datei (file:local.db)
 * als auch mit Turso (libsql://...). Liest alle .sql-Dateien aus
 * ./drizzle/ und wendet sie der Reihe nach an.
 *
 * Verwendet eine eigene __migrations-Tabelle, um bereits angewendete
 * Migrationen zu ueberspringen (idempotent).
 *
 * Aufruf:
 *   node scripts/migrate-turso.mjs
 *
 * Erwartet DATABASE_URL (und optional DATABASE_AUTH_TOKEN) in .env.local.
 */
import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL ?? "file:local.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;

const isTurso = url.startsWith("libsql://");
const target = isTurso ? "TURSO (Produktion)" : "LOKALE SQLite-Datei";

console.log("→ Ziel:", target);
console.log("→ URL:", url);
if (isTurso) {
  console.log(
    "→ Auth-Token vorhanden:",
    authToken ? `ja (${authToken.length} Zeichen)` : "FEHLT!"
  );
}
console.log("");

const client = createClient({ url, authToken });

// Migrations-Tracking-Tabelle (eigene, statt drizzle-spezifischer)
await client.execute(`
  CREATE TABLE IF NOT EXISTS __migrations (
    name TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL DEFAULT (unixepoch())
  )
`);

const appliedRes = await client.execute("SELECT name FROM __migrations");
const applied = new Set(appliedRes.rows.map((r) => r.name));

console.log(`→ Bereits angewendete Migrationen: ${applied.size}`);
if (applied.size > 0) {
  [...applied].sort().forEach((n) => console.log("  ✓", n));
  console.log("");
}

// Vorher-Zustand
console.log("→ Vorher-Zustand der DB:");
const beforeRes = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
);
if (beforeRes.rows.length === 0) {
  console.log("  (keine Tabellen)");
} else {
  beforeRes.rows.forEach((r) => console.log("  -", r.name));
}
console.log("");

// Migrationen einlesen
const migrationsDir = "./drizzle";
const allFiles = await readdir(migrationsDir);
const sqlFiles = allFiles.filter((f) => f.endsWith(".sql")).sort();

console.log(`→ Gefundene Migrations-Dateien: ${sqlFiles.length}`);
sqlFiles.forEach((f) => console.log("  -", f, applied.has(f) ? "(schon angewendet)" : ""));
console.log("");

let pendingCount = 0;
for (const file of sqlFiles) {
  if (applied.has(file)) continue;
  pendingCount++;

  console.log(`→ Wende ${file} an ...`);
  const sql = await readFile(join(migrationsDir, file), "utf-8");

  // Statements splitten:
  //  1. an "--> statement-breakpoint" trennen
  //  2. innerhalb am Semikolon trennen
  //  3. fuehrende Kommentar-Zeilen jedes Statements entfernen
  //  4. leere Statements ueberspringen
  const statements = sql
    .split(/-->\s*statement-breakpoint/g)
    .flatMap((s) => s.split(";"))
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e) {
      const msg = (e?.message ?? "").toLowerCase();
      if (msg.includes("already exists")) {
        console.log("  ⚠ schon vorhanden, ueberspringe");
        continue;
      }
      console.error(`  ✗ Fehler in ${file}:`);
      console.error("    Statement:", stmt.substring(0, 200));
      console.error("    Fehler:", e?.message ?? e);
      process.exit(1);
    }
  }

  // Migration als angewendet markieren
  await client.execute({
    sql: "INSERT INTO __migrations (name) VALUES (?)",
    args: [file],
  });

  console.log(`  ✓ ${file} angewendet (${statements.length} Statement(s))`);
}
console.log("");

if (pendingCount === 0) {
  console.log("✓ Nichts zu tun – DB ist auf dem aktuellen Stand");
} else {
  console.log(`✓ ${pendingCount} Migration(en) angewendet`);
}

// Nachher-Zustand
console.log("");
console.log("→ Aktueller Zustand der DB:");
const afterRes = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__migrations' ORDER BY name"
);
afterRes.rows.forEach((r) => console.log("  -", r.name));
