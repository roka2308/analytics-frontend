"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth/requireUser";
import { canEditProject } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit";
import {
  getWidgetsForDashboard,
  getDashboardById,
  listDashboardsForOrg,
  createDashboard,
  createWidget,
  setDashboardDefaultRange,
  getTemplateById,
  createTemplate,
  updateTemplateMeta,
  deleteTemplate,
  type TemplatePayload,
} from "@/lib/db/queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
  data?: { slug?: string };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Speichert ein bestehendes Dashboard als wiederverwendbare Vorlage. */
export async function saveDashboardAsTemplateAction(
  dashboardId: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireUser();
  const dash = await getDashboardById(dashboardId);
  if (!dash) return { ok: false, error: "Dashboard nicht gefunden." };
  if (!(await canEditProject(session.user, dash.organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }
  const name = ((formData.get("name") as string | null) ?? "").trim();
  if (name.length < 2) return { ok: false, error: "Name ist erforderlich (min. 2 Zeichen)." };
  const description = ((formData.get("description") as string | null) ?? "").trim() || null;
  const category = ((formData.get("category") as string | null) ?? "").trim() || null;

  const widgets = await getWidgetsForDashboard(dashboardId);
  const payload: TemplatePayload = {
    widgets: widgets.map((w) => ({
      type: w.type,
      title: w.title,
      layout: w.layout,
      config: w.config,
      position: w.position,
    })),
    defaultRange: {
      preset: dash.defaultRangePreset,
      from: dash.defaultRangeFrom,
      to: dash.defaultRangeTo,
      compare: dash.defaultCompareMode,
    },
  };

  const id = await createTemplate({
    name,
    description,
    category,
    payload,
    createdByUserId: session.user.id,
  });
  await logAudit({
    action: "template.create",
    entityType: "template",
    entityId: id,
    summary: `Vorlage „${name}" gespeichert (${payload.widgets.length} Widgets)`,
  });
  revalidatePath("/templates");
  return { ok: true };
}

/** Erzeugt aus einer Vorlage ein neues Dashboard in einem Projekt. */
export async function applyTemplateAction(
  templateId: string,
  organizationId: string,
  name?: string,
): Promise<ActionResult> {
  const session = await requireUser();
  if (!organizationId) return { ok: false, error: "Projekt fehlt." };
  if (!(await canEditProject(session.user, organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }
  const tpl = await getTemplateById(templateId);
  if (!tpl) return { ok: false, error: "Vorlage nicht gefunden." };

  const dashName = (name?.trim() || tpl.name).slice(0, 80);
  const existing = await listDashboardsForOrg(organizationId);
  const base = slugify(dashName) || "dashboard";
  let slug = base;
  let i = 2;
  while (existing.some((d) => d.slug === slug)) {
    slug = `${base}-${i}`;
    i++;
  }

  const dashboardId = await createDashboard({
    organizationId,
    slug,
    name: dashName,
    description: tpl.description,
    isDefault: existing.length === 0,
    position: existing.length,
  });
  for (const w of tpl.payload.widgets ?? []) {
    await createWidget({
      dashboardId,
      type: w.type,
      title: w.title,
      layout: w.layout,
      config: w.config,
      position: w.position,
    });
  }
  if (tpl.payload.defaultRange) {
    await setDashboardDefaultRange(dashboardId, {
      preset: tpl.payload.defaultRange.preset ?? null,
      from: tpl.payload.defaultRange.from ?? null,
      to: tpl.payload.defaultRange.to ?? null,
      compare: tpl.payload.defaultRange.compare ?? null,
    });
  }
  await logAudit({
    action: "template.apply",
    entityType: "dashboard",
    entityId: dashboardId,
    summary: `Vorlage „${tpl.name}" auf Projekt angewendet`,
  });
  revalidatePath("/kunden");
  revalidatePath("/dashboards");
  return { ok: true, data: { slug } };
}

export async function renameTemplateAction(
  templateId: string,
  fields: { name: string; description?: string | null; category?: string | null },
): Promise<ActionResult> {
  await requireAdmin();
  const name = fields.name.trim();
  if (name.length < 2) return { ok: false, error: "Name ist erforderlich." };
  await updateTemplateMeta(templateId, {
    name,
    description: fields.description?.trim() || null,
    category: fields.category?.trim() || null,
  });
  revalidatePath("/templates");
  return { ok: true };
}

export async function deleteTemplateAction(templateId: string): Promise<ActionResult> {
  await requireAdmin();
  const tpl = await getTemplateById(templateId);
  if (!tpl) return { ok: false, error: "Vorlage nicht gefunden." };
  await deleteTemplate(templateId);
  await logAudit({
    action: "template.delete",
    entityType: "template",
    entityId: templateId,
    summary: `Vorlage „${tpl.name}" gelöscht`,
  });
  revalidatePath("/templates");
  return { ok: true };
}
