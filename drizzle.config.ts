import type { Config } from "drizzle-kit";

// Wenn DATABASE_URL eine libsql://-URL ist (= Turso),
// nutzen wir den turso-Dialekt mit AuthToken.
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
} satisfies Config;
