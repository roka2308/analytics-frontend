"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireUser";
import { logAudit } from "@/lib/audit";
import {
  createOrganization,
  deleteOrganization,
  softDeleteOrganization,
  restoreOrganization,
  getOrgById,
  listOrganizations,
  renameOrganization,
  setOrganizationCustomer,
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
  const customerId = (formData.get("customerId") as string | null) || undefined;
  const err = validateName(name);
  if (err) return { ok: false, error: err };

  const existing = await listOrganizations();
  if (existing.some((o) => o.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: `Ein Projekt namens "${name}" existiert bereits.` };
  }

  await createOrganization(name, customerId);
  revalidatePath("/kunden");
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

export async function moveProjectToCustomerAction(
  orgId: string,
  customerId: string,
): Promise<ActionResult> {
  await requireAdmin();
  if (!customerId) return { ok: false, error: "Kunde fehlt." };
  const org = await getOrgById(orgId);
  if (!org) return { ok: false, error: "Projekt nicht gefunden." };
  await setOrganizationCustomer(orgId, customerId);
  revalidatePath("/kunden");
  return { ok: true };
}

export async function deleteOrgAction(orgId: string): Promise<ActionResult> {
  await requireAdmin();

  const org = await getOrgById(orgId);
  if (!org) return { ok: false, error: "Projekt nicht gefunden." };

  // Soft-Delete: Projekt (inkl. Dashboards) in den Papierkorb. Wiederherstellbar.
  await softDeleteOrganization(orgId);
  await logAudit({
    action: "project.delete",
    entityType: "project",
    entityId: orgId,
    summary: `Projekt „${org.name}" in den Papierkorb verschoben`,
  });
  revalidatePath("/kunden");
  revalidatePath("/papierkorb");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function restoreOrgAction(orgId: string): Promise<ActionResult> {
  await requireAdmin();
  const org = await getOrgById(orgId);
  if (!org) return { ok: false, error: "Projekt nicht gefunden." };
  await restoreOrganization(orgId);
  await logAudit({
    action: "project.restore",
    entityType: "project",
    entityId: orgId,
    summary: `Projekt „${org.name}" wiederhergestellt`,
  });
  revalidatePath("/kunden");
  revalidatePath("/papierkorb");
  return { ok: true };
}

/** Endgueltiges Loeschen (hartes Cascade) – aus dem Papierkorb. */
export async function purgeOrgAction(orgId: string): Promise<ActionResult> {
  await requireAdmin();
  const org = await getOrgById(orgId);
  if (!org) return { ok: false, error: "Projekt nicht gefunden." };
  await deleteOrganization(orgId);
  await logAudit({
    action: "project.purge",
    entityType: "project",
    entityId: orgId,
    summary: `Projekt „${org.name}" endgültig gelöscht`,
  });
  revalidatePath("/papierkorb");
  return { ok: true };
}
