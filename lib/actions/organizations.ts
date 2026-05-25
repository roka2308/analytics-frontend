"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  countSitesInOrg,
  countUsersInOrg,
  createOrganization,
  deleteOrganization,
  getOrgById,
  listOrganizations,
  renameOrganization,
} from "@/lib/db/queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function validateName(name: string): string | null {
  if (!name) return "Name darf nicht leer sein.";
  if (name.length < 2) return "Name muss mindestens 2 Zeichen lang sein.";
  if (name.length > 80) return "Name darf höchstens 80 Zeichen lang sein.";
  return null;
}

export async function createOrgAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const name = ((formData.get("name") as string | null) ?? "").trim();
  const err = validateName(name);
  if (err) return { ok: false, error: err };

  const existing = await listOrganizations();
  if (existing.some((o) => o.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: `Eine Organisation namens "${name}" existiert bereits.` };
  }

  await createOrganization(name);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function renameOrgAction(orgId: string, name: string): Promise<ActionResult> {
  await requireAdmin();

  const trimmed = name.trim();
  const err = validateName(trimmed);
  if (err) return { ok: false, error: err };

  const org = await getOrgById(orgId);
  if (!org) return { ok: false, error: "Organisation nicht gefunden." };

  await renameOrganization(orgId, trimmed);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteOrgAction(orgId: string): Promise<ActionResult> {
  await requireAdmin();

  const org = await getOrgById(orgId);
  if (!org) return { ok: false, error: "Organisation nicht gefunden." };

  const userCount = await countUsersInOrg(orgId);
  if (userCount > 0) {
    return {
      ok: false,
      error: `Diese Organisation hat noch ${userCount} Nutzer. Bitte weise sie zuerst einer anderen Org zu oder lösche sie.`,
    };
  }

  const siteCount = await countSitesInOrg(orgId);
  if (siteCount > 0) {
    return {
      ok: false,
      error: `Diese Organisation hat noch ${siteCount} Website(s). Bitte entferne sie zuerst aus der Site-Verwaltung.`,
    };
  }

  await deleteOrganization(orgId);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
