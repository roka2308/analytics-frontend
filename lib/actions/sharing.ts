"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  createShareToken,
  deleteShareToken,
  revokeShareToken,
  type ShareTokenRow,
} from "@/lib/sharing/tokens";

export interface ActionResult {
  ok: boolean;
  error?: string;
  data?: { token: string };
}

export async function createShareTokenAction(input: {
  dashboardId: string;
  label?: string | null;
  matomoSiteId?: number | null;
  expiresInDays?: number | null;
}): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!input.dashboardId) return { ok: false, error: "Dashboard-ID fehlt." };

  let expiresAt: Date | null = null;
  if (input.expiresInDays && input.expiresInDays > 0) {
    expiresAt = new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000);
  }

  const created: ShareTokenRow = await createShareToken({
    dashboardId: input.dashboardId,
    label: input.label?.trim() || null,
    matomoSiteId: input.matomoSiteId ?? null,
    expiresAt,
    createdByUserId: session.user.id,
  });

  revalidatePath("/settings");
  return { ok: true, data: { token: created.token } };
}

export async function revokeShareTokenAction(
  tokenId: string
): Promise<ActionResult> {
  await requireAdmin();
  await revokeShareToken(tokenId);
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteShareTokenAction(
  tokenId: string
): Promise<ActionResult> {
  await requireAdmin();
  await deleteShareToken(tokenId);
  revalidatePath("/settings");
  return { ok: true };
}
