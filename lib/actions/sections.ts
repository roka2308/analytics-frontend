"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  createSection,
  deleteSection,
  listSectionsForDashboard,
  renameSection,
  reorderSections,
} from "@/lib/db/queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
  data?: { id: string };
}

function validateTitle(title: string): string | null {
  if (!title || !title.trim()) return "Titel darf nicht leer sein.";
  if (title.length > 80) return "Titel ist zu lang (max 80 Zeichen).";
  return null;
}

export async function createSectionAction(input: {
  dashboardId: string;
  title: string;
  description?: string | null;
}): Promise<ActionResult> {
  await requireAdmin();
  const err = validateTitle(input.title);
  if (err) return { ok: false, error: err };

  const existing = await listSectionsForDashboard(input.dashboardId);
  const id = await createSection({
    dashboardId: input.dashboardId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    position: existing.length,
  });
  revalidatePath("/projekte", "layout");
  return { ok: true, data: { id } };
}

export async function renameSectionAction(input: {
  sectionId: string;
  title: string;
  description?: string | null;
}): Promise<ActionResult> {
  await requireAdmin();
  const err = validateTitle(input.title);
  if (err) return { ok: false, error: err };

  await renameSection(
    input.sectionId,
    input.title.trim(),
    input.description?.trim() || null
  );
  revalidatePath("/projekte", "layout");
  return { ok: true };
}

export async function deleteSectionAction(sectionId: string): Promise<ActionResult> {
  await requireAdmin();
  await deleteSection(sectionId);
  revalidatePath("/projekte", "layout");
  return { ok: true };
}

export async function reorderSectionsAction(
  items: { id: string; position: number }[]
): Promise<ActionResult> {
  await requireAdmin();
  await reorderSections(items);
  revalidatePath("/projekte", "layout");
  return { ok: true };
}
