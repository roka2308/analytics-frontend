"use server";

import { revalidatePath } from "next/cache";
import {
  addSite,
  removeSite,
  getOrgById,
  getSitesForOrg,
  findSiteByMatomoIdAnyOrg,
} from "@/lib/db/queries";
import { requireAdmin } from "@/lib/auth/requireUser";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function addSiteAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const matomoSiteIdRaw = formData.get("matomoSiteId");
  const label = (formData.get("label") as string | null)?.trim();
  const organizationId = (formData.get("organizationId") as string | null) || null;

  if (!matomoSiteIdRaw || !label) {
    return { ok: false, error: "Site-ID und Bezeichnung sind Pflichtfelder." };
  }
  if (!organizationId) {
    return { ok: false, error: "Bitte eine Organisation auswählen." };
  }

  const matomoSiteId = parseInt(matomoSiteIdRaw as string, 10);
  if (!Number.isFinite(matomoSiteId) || matomoSiteId < 1) {
    return { ok: false, error: "Die Site-ID muss eine positive Zahl sein." };
  }

  const org = await getOrgById(organizationId);
  if (!org) return { ok: false, error: "Organisation nicht gefunden." };

  // Pro Org darf eine Matomo-Site-ID nur einmal vorkommen
  const existing = await getSitesForOrg(organizationId);
  if (existing.some((s) => s.matomoSiteId === matomoSiteId)) {
    return {
      ok: false,
      error: `Site-ID ${matomoSiteId} ist in dieser Organisation bereits vorhanden.`,
    };
  }

  // Optional: Hinweis, wenn dieselbe Site in einer anderen Org schon liegt
  // (erlaubt, aber UI sollte später dafür sensibilisieren)
  void findSiteByMatomoIdAnyOrg;

  await addSite(organizationId, matomoSiteId, label);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeSiteAction(siteId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!siteId) return { ok: false, error: "Site-ID fehlt." };

  await removeSite(siteId);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
