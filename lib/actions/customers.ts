"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireUser";
import { logAudit } from "@/lib/audit";
import {
  createCustomer,
  deleteCustomer,
  softDeleteCustomer,
  restoreCustomer,
  getCustomerById,
  listCustomers,
  renameCustomer,
  setCustomerBranding,
} from "@/lib/db/queries";
import { DEFAULT_ACCENT_HEX, hexToHsl, validateLogoDataUrl } from "@/lib/branding";

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

export async function createCustomerAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = ((formData.get("name") as string | null) ?? "").trim();
  const err = validateName(name);
  if (err) return { ok: false, error: err };

  const existing = await listCustomers();
  if (existing.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return { ok: false, error: `Ein Kunde namens "${name}" existiert bereits.` };
  }

  const created = await createCustomer(name);
  await logAudit({
    action: "customer.create",
    entityType: "customer",
    entityId: created.id,
    summary: `Kunde „${name}" angelegt`,
  });
  revalidatePath("/kunden");
  return { ok: true };
}

export async function renameCustomerAction(
  customerId: string,
  name: string,
): Promise<ActionResult> {
  await requireAdmin();
  const trimmed = name.trim();
  const err = validateName(trimmed);
  if (err) return { ok: false, error: err };

  const customer = await getCustomerById(customerId);
  if (!customer) return { ok: false, error: "Kunde nicht gefunden." };

  await renameCustomer(customerId, trimmed);
  revalidatePath("/kunden");
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteCustomerAction(customerId: string): Promise<ActionResult> {
  await requireAdmin();
  const customer = await getCustomerById(customerId);
  if (!customer) return { ok: false, error: "Kunde nicht gefunden." };

  // Soft-Delete: in den Papierkorb (inkl. Projekte/Dashboards). Wiederherstellbar.
  await softDeleteCustomer(customerId);
  await logAudit({
    action: "customer.delete",
    entityType: "customer",
    entityId: customerId,
    summary: `Kunde „${customer.name}" in den Papierkorb verschoben`,
  });
  revalidatePath("/kunden");
  revalidatePath("/papierkorb");
  return { ok: true };
}

export async function restoreCustomerAction(customerId: string): Promise<ActionResult> {
  await requireAdmin();
  const customer = await getCustomerById(customerId);
  if (!customer) return { ok: false, error: "Kunde nicht gefunden." };
  await restoreCustomer(customerId);
  await logAudit({
    action: "customer.restore",
    entityType: "customer",
    entityId: customerId,
    summary: `Kunde „${customer.name}" wiederhergestellt`,
  });
  revalidatePath("/kunden");
  revalidatePath("/papierkorb");
  return { ok: true };
}

/** Endgueltiges Loeschen (hartes Cascade) – aus dem Papierkorb. */
export async function purgeCustomerAction(customerId: string): Promise<ActionResult> {
  await requireAdmin();
  const customer = await getCustomerById(customerId);
  if (!customer) return { ok: false, error: "Kunde nicht gefunden." };
  await deleteCustomer(customerId);
  await logAudit({
    action: "customer.purge",
    entityType: "customer",
    entityId: customerId,
    summary: `Kunde „${customer.name}" endgültig gelöscht`,
  });
  revalidatePath("/papierkorb");
  return { ok: true };
}

/** Kunde-Default-Branding (Logo + Akzentfarbe). Projekte erben dies. */
export async function updateCustomerBrandingAction(
  customerId: string,
  input: { accentHex?: string | null; logoDataUrl?: string | null; removeLogo?: boolean },
): Promise<ActionResult> {
  await requireAdmin();
  const customer = await getCustomerById(customerId);
  if (!customer) return { ok: false, error: "Kunde nicht gefunden." };

  let accentHsl: string | null = customer.brandingAccentHsl ?? null;
  if (input.accentHex !== undefined) {
    if (!input.accentHex || input.accentHex === DEFAULT_ACCENT_HEX) {
      accentHsl = null;
    } else {
      const hsl = hexToHsl(input.accentHex);
      if (!hsl) return { ok: false, error: "Ungültiger Hex-Farbcode." };
      accentHsl = hsl;
    }
  }

  let logo: string | null = customer.brandingLogoBase64 ?? null;
  if (input.removeLogo) {
    logo = null;
  } else if (input.logoDataUrl) {
    const v = validateLogoDataUrl(input.logoDataUrl);
    if (!v.ok) return { ok: false, error: v.error };
    logo = input.logoDataUrl;
  }

  await setCustomerBranding(customerId, logo, accentHsl);
  revalidatePath("/kunden");
  revalidatePath("/settings");
  return { ok: true };
}
