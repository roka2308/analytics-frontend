import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { dashboardShareTokens, dashboards } from "@/lib/db/schema";
import { and, eq, isNull, gt, or } from "drizzle-orm";

/**
 * Erzeugt einen kryptografisch sicheren, URL-tauglichen Token.
 * 32 Byte Entropie → ~43 Zeichen base64url. Nicht ratbar.
 */
export function generateToken(): string {
  return randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export interface ShareTokenRow {
  id: string;
  dashboardId: string;
  token: string;
  label: string | null;
  matomoSiteId: number | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export async function listShareTokensForDashboard(
  dashboardId: string
): Promise<ShareTokenRow[]> {
  const rows = await db
    .select()
    .from(dashboardShareTokens)
    .where(eq(dashboardShareTokens.dashboardId, dashboardId));
  return rows.map((r) => ({
    id: r.id,
    dashboardId: r.dashboardId,
    token: r.token,
    label: r.label,
    matomoSiteId: r.matomoSiteId,
    expiresAt: r.expiresAt,
    revokedAt: r.revokedAt,
    createdAt: r.createdAt,
  }));
}

export async function createShareToken(input: {
  dashboardId: string;
  label?: string | null;
  matomoSiteId?: number | null;
  expiresAt?: Date | null;
  createdByUserId?: string | null;
}): Promise<ShareTokenRow> {
  const id = crypto.randomUUID();
  const token = generateToken();
  await db.insert(dashboardShareTokens).values({
    id,
    dashboardId: input.dashboardId,
    token,
    label: input.label ?? null,
    matomoSiteId: input.matomoSiteId ?? null,
    expiresAt: input.expiresAt ?? null,
    createdByUserId: input.createdByUserId ?? null,
  });
  const rows = await db
    .select()
    .from(dashboardShareTokens)
    .where(eq(dashboardShareTokens.id, id))
    .limit(1);
  const r = rows[0];
  return {
    id: r.id,
    dashboardId: r.dashboardId,
    token: r.token,
    label: r.label,
    matomoSiteId: r.matomoSiteId,
    expiresAt: r.expiresAt,
    revokedAt: r.revokedAt,
    createdAt: r.createdAt,
  };
}

export async function revokeShareToken(tokenId: string) {
  await db
    .update(dashboardShareTokens)
    .set({ revokedAt: new Date() })
    .where(eq(dashboardShareTokens.id, tokenId));
}

export async function deleteShareToken(tokenId: string) {
  await db.delete(dashboardShareTokens).where(eq(dashboardShareTokens.id, tokenId));
}

export interface ResolvedShareToken {
  token: ShareTokenRow;
  dashboardId: string;
  organizationId: string;
}

/**
 * Lookup beim Aufruf von /share/[token]: gueltig + nicht widerrufen + nicht abgelaufen.
 * Liefert null, wenn der Token nicht (mehr) verwendbar ist.
 */
export async function resolveActiveShareToken(
  token: string
): Promise<ResolvedShareToken | null> {
  const now = new Date();
  const rows = await db
    .select({
      tokenId: dashboardShareTokens.id,
      tokenValue: dashboardShareTokens.token,
      dashboardId: dashboardShareTokens.dashboardId,
      label: dashboardShareTokens.label,
      matomoSiteId: dashboardShareTokens.matomoSiteId,
      expiresAt: dashboardShareTokens.expiresAt,
      revokedAt: dashboardShareTokens.revokedAt,
      createdAt: dashboardShareTokens.createdAt,
      organizationId: dashboards.organizationId,
    })
    .from(dashboardShareTokens)
    .innerJoin(dashboards, eq(dashboardShareTokens.dashboardId, dashboards.id))
    .where(
      and(
        eq(dashboardShareTokens.token, token),
        isNull(dashboardShareTokens.revokedAt),
        or(
          isNull(dashboardShareTokens.expiresAt),
          gt(dashboardShareTokens.expiresAt, now)
        )
      )
    )
    .limit(1);

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    token: {
      id: r.tokenId,
      dashboardId: r.dashboardId,
      token: r.tokenValue,
      label: r.label,
      matomoSiteId: r.matomoSiteId,
      expiresAt: r.expiresAt,
      revokedAt: r.revokedAt,
      createdAt: r.createdAt,
    },
    dashboardId: r.dashboardId,
    organizationId: r.organizationId,
  };
}
