"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/requireUser";
import { getOrgById } from "@/lib/db/queries";
import {
  DEFAULT_ACCENT_HEX,
  hexToHsl,
  validateLogoDataUrl,
} from "@/lib/branding";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updateProjectBrandingAction(
  orgId: string,
  input: {
    /** Hex-Farbcode (#RRGGBB) oder null/empty fuer Default */
    accentHex?: string | null;
    /** Data-URL des Logos oder null fuer Entfernen */
    logoDataUrl?: string | null;
    /** Wenn true: Logo wird auf null gesetzt, auch wenn keine neue Datei kommt */
    removeLogo?: boolean;
  }
): Promise<ActionResult> {
  await requireAdmin();

  const project = await getOrgById(orgId);
  if (!project) return { ok: false, error: "Projekt nicht gefunden." };

  // Akzentfarbe
  let accentHslToStore: string | null | undefined = undefined;
  if (input.accentHex !== undefined) {
    if (!input.accentHex || input.accentHex === DEFAULT_ACCENT_HEX) {
      accentHslToStore = null; // Default verwenden
    } else {
      const hsl = hexToHsl(input.accentHex);
      if (!hsl) {
        return { ok: false, error: "Ungültiger Hex-Farbcode." };
      }
      accentHslToStore = hsl;
    }
  }

  // Logo
  let logoToStore: string | null | undefined = undefined;
  if (input.removeLogo) {
    logoToStore = null;
  } else if (input.logoDataUrl) {
    const validation = validateLogoDataUrl(input.logoDataUrl);
    if (!validation.ok) return { ok: false, error: validation.error };
    logoToStore = input.logoDataUrl;
  }

  // Update zusammenbauen (nur gesetzte Felder)
  const update: Partial<typeof organizations.$inferInsert> = {};
  if (accentHslToStore !== undefined) update.brandingAccentHsl = accentHslToStore;
  if (logoToStore !== undefined) update.brandingLogoBase64 = logoToStore;

  if (Object.keys(update).length === 0) {
    return { ok: true };
  }

  await db.update(organizations).set(update).where(eq(organizations.id, orgId));

  revalidatePath("/settings");
  revalidatePath(`/projekte/${project.slug}`, "layout");
  return { ok: true };
}
