"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  createWidget,
  deleteWidget,
  getWidgetById,
  moveWidgetToSection,
  reorderWidgets,
  updateWidgetConfig,
  updateWidgetLayout,
  type WidgetLayout,
} from "@/lib/db/queries";
import { getWidgetDefinition } from "@/lib/widgets/registry";

export interface ActionResult {
  ok: boolean;
  error?: string;
  data?: { id: string };
}

export async function addWidgetAction(input: {
  dashboardId: string;
  type: string;
  title?: string | null;
  sectionId?: string | null;
}): Promise<ActionResult> {
  await requireAdmin();

  const def = getWidgetDefinition(input.type);
  if (!def) return { ok: false, error: `Unbekannter Widget-Typ: ${input.type}` };

  const id = await createWidget({
    dashboardId: input.dashboardId,
    type: input.type,
    title: input.title ?? null,
    layout: def.defaultLayout,
    config: def.defaultConfig,
    position: Date.now(), // hinten anfuegen, spaeter via reorder anpassbar
  });

  if (input.sectionId) {
    await moveWidgetToSection(id, input.sectionId);
  }

  revalidatePath("/projekte", "layout");
  return { ok: true, data: { id } };
}

export async function deleteWidgetAction(widgetId: string): Promise<ActionResult> {
  await requireAdmin();
  await deleteWidget(widgetId);
  revalidatePath("/projekte", "layout");
  return { ok: true };
}

export async function updateWidgetConfigAction(input: {
  widgetId: string;
  config: Record<string, unknown>;
  title: string | null;
}): Promise<ActionResult> {
  await requireAdmin();
  const existing = await getWidgetById(input.widgetId);
  if (!existing) return { ok: false, error: "Widget nicht gefunden." };
  await updateWidgetConfig(input.widgetId, input.config, input.title);
  revalidatePath("/projekte", "layout");
  return { ok: true };
}

export async function updateWidgetLayoutAction(
  widgetId: string,
  layout: WidgetLayout
): Promise<ActionResult> {
  await requireAdmin();
  await updateWidgetLayout(widgetId, layout);
  revalidatePath("/projekte", "layout");
  return { ok: true };
}

export async function reorderWidgetsAction(
  items: { id: string; position: number }[]
): Promise<ActionResult> {
  await requireAdmin();
  await reorderWidgets(items);
  revalidatePath("/projekte", "layout");
  return { ok: true };
}

export async function moveWidgetToSectionAction(
  widgetId: string,
  sectionId: string | null
): Promise<ActionResult> {
  await requireAdmin();
  await moveWidgetToSection(widgetId, sectionId);
  revalidatePath("/projekte", "layout");
  return { ok: true };
}
