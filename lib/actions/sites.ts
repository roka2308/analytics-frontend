"use server";

import { revalidatePath } from "next/cache";
import { addSite, removeSite, getOrCreateDefaultOrg, getSitesForOrg } from "@/lib/db/queries";
import { requireUser } from "@/lib/auth/requireUser";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function addSiteAction(formData: FormData): Promise<ActionResult> {
  await requireUser();

  const matomoSiteIdRaw = formData.get("matomoSiteId");
  const label = (formData.get("label") as string | null)?.trim();

  if (!matomoSiteIdRaw || !label) {
    return { ok: false, error: "Site-ID und Bezeichnung sind Pflichtfelder." };
  }

  const matomoSiteId = parseInt(matomoSiteIdRaw as string, 10);
  if (!Number.isFinite(matomoSiteId) || matomoSiteId < 1) {
    return { ok: false, error: "Die Site-ID muss eine positive Zahl sein." };
  }

  const org = await getOrCreateDefaultOrg();
  const existing = await getSitesForOrg(org.id);
  if (existing.some((s) => s.matomoSiteId === matomoSiteId)) {
    return { ok: false, error: `Site-ID ${matomoSiteId} ist bereits vorhanden.` };
  }

  await addSite(org.id, matomoSiteId, label);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeSiteAction(siteId: string): Promise<ActionResult> {
  await requireUser();

  if (!siteId) return { ok: false, error: "Site-ID fehlt." };

  await removeSite(siteId);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
