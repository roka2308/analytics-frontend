// =============================================================
//  MySQL-Verbindungspool (NUR serverseitig)
//
//  Stellt die echte Verbindung zur E-Commerce-DB der Kollegin her.
//  Credentials kommen ausschliesslich aus .env.local (Server) und
//  duerfen NIE ins Client-Bundle gelangen -> "server-only" als Wache.
//
//  Der Pool wird einmal erzeugt und (auch ueber Next.js Hot-Reload)
//  in einer globalen Variable wiederverwendet, damit nicht bei jedem
//  Request neue Verbindungen aufgebaut werden.
// =============================================================
import "server-only";
import mysql from "mysql2/promise";
import type { DbPool } from "../sql-datasource";

// Hot-Reload-sicherer Singleton (Next.js dev startet Module mehrfach)
const globalForSql = globalThis as unknown as { __sqlPool?: mysql.Pool };

function createPool(): mysql.Pool {
  const host = process.env.MYSQL_HOST;
  const database = process.env.MYSQL_DATABASE;
  const user = process.env.MYSQL_USER;

  if (!host || !database || !user) {
    throw new Error(
      "MySQL nicht konfiguriert. Bitte MYSQL_HOST, MYSQL_USER und " +
        "MYSQL_DATABASE in .env.local setzen.",
    );
  }

  return mysql.createPool({
    host,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user,
    password: process.env.MYSQL_PASSWORD ?? "",
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE ?? 5),
    // Sicherheit: keine gestapelten Statements zulassen
    multipleStatements: false,
    // TLS optional fuer Remote-Hosts (MYSQL_SSL=true)
    ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });
}

function getSqlPool(): mysql.Pool {
  if (!globalForSql.__sqlPool) {
    globalForSql.__sqlPool = createPool();
  }
  return globalForSql.__sqlPool;
}

/**
 * Liefert einen schlanken Adapter, der das von der SqlDataSource erwartete
 * DbPool-Interface erfuellt. Der Pool wird LAZY beim ersten Query erzeugt,
 * d.h. das blosse Registrieren der SqlDataSource erfordert noch keine
 * MySQL-Credentials (wichtig fuer den Metrik-Katalog ohne DB-Zugriff).
 */
export function getSqlDataSourcePool(): DbPool {
  return {
    async query(sql: string, params?: unknown[]) {
      const pool = getSqlPool();
      const [rows] = await pool.query(sql, params);
      return [rows as Record<string, any>[], undefined];
    },
  };
}
