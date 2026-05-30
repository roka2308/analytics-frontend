/**
 * Manuelles Migrations-Skript fuer Turso.
 *
 * Liest alle SQL-Dateien aus ./drizzle/ und wendet sie der Reihe nach
 * direkt via @libsql/client an. Umgeht drizzle-kit, das bei uns
 * silent ausgestiegen ist.
 *
 * Aufruf:
 *   node scripts/migrate-turso.mjs
 *
 * Erwartet DATABASE_URL und DATABASE_AUTH_TOKEN in .env.local.
 */
import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error("✗ DATABASE_URL fehlt in .env.local");
  process.exit(1);
}

if (!url.startsWith("libsql://")) {
  console.error(`✗ DATABASE_URL ist nicht Turso: ${url}`);
  console.error("  Erwartet: libsql://...");
  process.exit(1);
}

console.log("→ Ziel-DB:", url);
console.log("→ Auth-Token vorhanden:", authToken ? `ja (${authToken.length} Zeichen)` : "nein");
console.log("");

const client = createClient({ url, authToken });

// Vorher-Zustand
console.log("→ Vorher-Zustand der DB:");
const beforeRes = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
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
const sqlFiles = allFiles
  .filter((f) => f.endsWith(".sql"))
  .sort();

console.log(`→ Gefundene Migrations-Dateien: ${sqlFiles.length}`);
sqlFiles.forEach((f) => console.log("  -", f));
console.log("");

for (const file of sqlFiles) {
  console.log(`→ Wende ${file} an ...`);
  const sql = await readFile(join(migrationsDir, file), "utf-8");

  // Drizzle splittet einzelne Statements mit "--> statement-breakpoint"
  const statements = sql
    .split(/-->\s*statement-breakpoint/g)
    .flatMap((s) => s.split(";"))
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e) {
      // "already exists" Fehler bei CREATE TABLE ignorieren (Reapply-Faelle)
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
  console.log(`  ✓ ${file} angewendet (${statements.length} Statement(s))`);
}
console.log("");

// Nachher-Zustand
console.log("→ Nachher-Zustand der DB:");
const afterRes = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
afterRes.rows.forEach((r) => console.log("  -", r.name));
console.log("");

console.log("✓ Migration abgeschlossen");
