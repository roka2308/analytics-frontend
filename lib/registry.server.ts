// =============================================================
//  Server-seitige DataRegistry
//
//  Einziger Ort, an dem konkrete Datenquellen registriert werden.
//  UI/Route-Handler holen sich die Registry hier und reden NUR mit ihr.
//  Spaeter kommt hier die MatomoDataSource dazu (siehe docs/CLAUDE.md,
//  Migrationsschritt 1).
// =============================================================
import "server-only";
import { DataRegistry } from "./datasource";
import { SqlDataSource } from "./sql-datasource";
import { MatomoDataSource } from "./matomo-datasource";
import { getSqlDataSourcePool } from "./sql/pool";

const globalForRegistry = globalThis as unknown as {
  __dataRegistry?: DataRegistry;
};

export function getDataRegistry(): DataRegistry {
  if (!globalForRegistry.__dataRegistry) {
    const registry = new DataRegistry();
    // SQL-Quelle: Pool wird lazy beim ersten Query erzeugt -> Registrieren
    // erfordert noch keine MySQL-Credentials.
    registry.register(new SqlDataSource(getSqlDataSourcePool()));
    // Matomo: siteId kommt pro Abruf über query.filters.siteId (Fallback env)
    registry.register(new MatomoDataSource());
    globalForRegistry.__dataRegistry = registry;
  }
  return globalForRegistry.__dataRegistry;
}
