import "server-only";
import { getServerSession } from "next-auth";
import { desc } from "drizzle-orm";
import { db } from "./db";
import { auditLog } from "./db/schema";
import { authOptions } from "./auth/config";

export interface AuditInput {
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  summary?: string | null;
  /** Actor explizit setzen (sonst aus der aktuellen Session gelesen). */
  actorUserId?: string | null;
  actorEmail?: string | null;
}

/**
 * Protokolliert eine administrative Aktion. Liest den Actor aus der Session,
 * falls nicht explizit übergeben. Darf die Hauptaktion NIE zum Scheitern bringen.
 */
export async function logAudit(e: AuditInput): Promise<void> {
  try {
    let actorUserId = e.actorUserId ?? null;
    let actorEmail = e.actorEmail ?? null;
    if (!actorUserId && !actorEmail) {
      const session = await getServerSession(authOptions);
      actorUserId = session?.user?.id ?? null;
      actorEmail = session?.user?.email ?? null;
    }
    await db.insert(auditLog).values({
      actorUserId,
      actorEmail,
      action: e.action,
      entityType: e.entityType ?? null,
      entityId: e.entityId ?? null,
      summary: e.summary ?? null,
    });
  } catch {
    /* Audit-Fehler bewusst schlucken */
  }
}

export async function listAudit(limit = 150) {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit);
}
