import type { Config } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit laedt von Haus aus nur .env, nicht .env.local.
// Hier laden wir explizit aus .env.local, damit Migrationen
// gegen die richtige DB (Turso in Produktion, file:local.db lokal) laufen.
config({ path: ".env.local" });

// Wenn DATABASE_URL eine libsql://-URL ist (= Turso),
// nutzen wir den turso-Dialekt mit AuthToken.
// Hinweis: "turso" funktioniert zur Laufzeit in drizzle-kit 0.22,
// ist aber in den TS-Typen noch nicht enthalten -> daher der Cast.
const url = process.env.DATABASE_URL ?? "file:local.db";
const isTurso = url.startsWith("libsql://");

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: {
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} as Config;
