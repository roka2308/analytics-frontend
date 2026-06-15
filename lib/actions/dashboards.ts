"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireUser } from "@/lib/auth/requireUser";
import { canEditProject } from "@/lib/auth/permissions";
import {
  createDashboard,
  createWidget,
  deleteDashboard,
  getDashboardById,
  getDashboardBySlug,
  getOrCreateDefaultOrg,
  listDashboardsForOrg,
  renameDashboard,
  setDashboardDefaultRange,
  setDefaultDashboard,
  type DashboardDefaultRange,
} from "@/lib/db/queries";
import { getTemplate } from "@/lib/widgets/templates";
import { logAudit } from "@/lib/audit";
import {
  softDeleteDashboard,
  restoreDashboard,
} from "@/lib/db/queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
  data?: { slug: string };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function validateName(name: string): string | null {
  if (!name) return "Name darf nicht leer sein.";
  if (name.length < 2) return "Name muss mindestens 2 Zeichen lang sein.";
  if (name.length > 80) return "Name darf höchstens 80 Zeichen lang sein.";
  return null;
}

/**
 * Verwendet derzeit die Default-Org als Org-Kontext.
 * Bei Mehrfach-Org-Setups spaeter aufzubohren (Org-Selector im UI).
 */
async function adminOrgId(): Promise<string> {
  const org = await getOrCreateDefaultOrg();
  return org.id;
}

export async function createDashboardAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = ((formData.get("name") as string | null) ?? "").trim();
  const description = ((formData.get("description") as string | null) ?? "").trim() || null;
  const template = (formData.get("template") as string | null) ?? "empty";

  const nameErr = validateName(name);
  if (nameErr) return { ok: false, error: nameErr };

  const orgId = await adminOrgId();
  const existing = await listDashboardsForOrg(orgId);

  // Slug aus Name; falls Kollision, Suffix anhaengen
  const base = slugify(name) || "dashboard";
  let slug = base;
  let i = 2;
  while (existing.some((d) => d.slug === slug)) {
    slug = `${base}-${i}`;
    i++;
  }

  const id = await createDashboard({
    organizationId: orgId,
    slug,
    name,
    description,
    isDefault: existing.length === 0,
    position: existing.length,
  });

  // Template anwenden (Widgets + optional Default-Zeitraum)
  const tpl = getTemplate(template);
  if (tpl) {
    for (const w of tpl.widgets) {
      await createWidget({
        dashboardId: id,
        type: w.type,
        title: w.title ?? null,
        layout: w.layout,
        config: w.config,
        position: w.position,
      });
    }
    if (tpl.defaultRange) {
      await setDashboardDefaultRange(id, {
        preset: tpl.defaultRange.preset,
        from: null,
        to: null,
        compare: tpl.defaultRange.compare,
      });
    }
  }
  revalidatePath("/settings");
  revalidatePath("/dashboards");
  return { ok: true, data: { slug } };
}

/** Legt ein Dashboard in einem BESTIMMTEN Projekt an (Kunden-Verwaltung). */
/**
 * Wendet ein eingebautes Branchen-Template auf ein frisch angelegtes
 * Dashboard an (Widgets + optionaler Default-Zeitraum). Zentral, damit
 * createDashboardAction und createDashboardInProjectAction identisch sind.
 */
async function applyTemplateToDashboard(dashboardId: string, templateId: string) {
  const tpl = getTemplate(templateId);
  if (!tpl) return;
  for (const w of tpl.widgets) {
    await createWidget({
      dashboardId,
      type: w.type,
      title: w.title ?? null,
      layout: w.layout,
      config: w.config,
      position: w.position,
    });
  }
  if (tpl.defaultRange) {
    await setDashboardDefaultRange(dashboardId, {
      preset: tpl.defaultRange.preset,
      from: null,
      to: null,
      compare: tpl.defaultRange.compare,
    });
  }
}

export async function createDashboardInProjectAction(
  organizationId: string,
  name: string,
  template = "empty",
): Promise<ActionResult> {
  const session = await requireUser();
  if (!(await canEditProject(session.user, organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }
  const trimmed = name.trim();
  const nameErr = validateName(trimmed);
  if (nameErr) return { ok: false, error: nameErr };

  const existing = await listDashboardsForOrg(organizationId);
  const base = slugify(trimmed) || "dashboard";
  let slug = base;
  let i = 2;
  while (existing.some((d) => d.slug === slug)) {
    slug = `${base}-${i}`;
    i++;
  }
  const id = await createDashboard({
    organizationId,
    slug,
    name: trimmed,
    description: null,
    isDefault: existing.length === 0,
    position: existing.length,
  });
  await applyTemplateToDashboard(id, template);
  revalidatePath("/kunden");
  return { ok: true, data: { slug } };
}

export async function renameDashboardAction(
  dashboardId: string,
  name: string,
  description: string | null
): Promise<ActionResult> {
  await requireAdmin();
  const nameErr = validateName(name);
  if (nameErr) return { ok: false, error: nameErr };

  await renameDashboard(dashboardId, name.trim(), description?.trim() || null);
  revalidatePath("/settings");
  revalidatePath("/dashboards");
  return { ok: true };
}

export async function deleteDashboardAction(dashboardId: string): Promise<ActionResult> {
  const session = await requireUser();
  const dash = await getDashboardById(dashboardId);
  if (!dash) return { ok: false, error: "Dashboard nicht gefunden." };
  if (!(await canEditProject(session.user, dash.organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }

  await softDeleteDashboard(dashboardId);

  // War es das Default-Dashboard, ein verbleibendes zum Default machen.
  if (dash.isDefault) {
    const remaining = await listDashboardsForOrg(dash.organizationId);
    if (remaining.length > 0) {
      await setDefaultDashboard(dash.organizationId, remaining[0].id);
    }
  }

  await logAudit({
    action: "dashboard.delete",
    entityType: "dashboard",
    entityId: dashboardId,
    summary: `Dashboard „${dash.name}" in den Papierkorb verschoben`,
  });
  revalidatePath("/kunden");
  revalidatePath("/papierkorb");
  revalidatePath("/dashboards");
  return { ok: true };
}

export async function restoreDashboardAction(dashboardId: string): Promise<ActionResult> {
  const session = await requireUser();
  const dash = await getDashboardById(dashboardId);
  if (!dash) return { ok: false, error: "Dashboard nicht gefunden." };
  if (!(await canEditProject(session.user, dash.organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }
  await restoreDashboard(dashboardId);
  await logAudit({
    action: "dashboard.restore",
    entityType: "dashboard",
    entityId: dashboardId,
    summary: `Dashboard „${dash.name}" wiederhergestellt`,
  });
  revalidatePath("/kunden");
  revalidatePath("/papierkorb");
  return { ok: true };
}

/** Endgueltiges Loeschen (hartes Cascade) – aus dem Papierkorb. */
export async function purgeDashboardAction(dashboardId: string): Promise<ActionResult> {
  const session = await requireUser();
  const dash = await getDashboardById(dashboardId);
  if (!dash) return { ok: false, error: "Dashboard nicht gefunden." };
  if (!(await canEditProject(session.user, dash.organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }
  await deleteDashboard(dashboardId);
  await logAudit({
    action: "dashboard.purge",
    entityType: "dashboard",
    entityId: dashboardId,
    summary: `Dashboard „${dash.name}" endgültig gelöscht`,
  });
  revalidatePath("/papierkorb");
  return { ok: true };
}

export async function setDefaultDashboardAction(dashboardId: string): Promise<ActionResult> {
  const session = await requireUser();
  const dash = await getDashboardById(dashboardId);
  if (!dash) return { ok: false, error: "Dashboard nicht gefunden." };
  if (!(await canEditProject(session.user, dash.organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }
  await setDefaultDashboard(dash.organizationId, dashboardId);
  revalidatePath("/kunden");
  revalidatePath("/dashboards");
  return { ok: true };
}

export async function setDashboardDefaultRangeAction(
  dashboardId: string,
  value: DashboardDefaultRange
): Promise<ActionResult> {
  await requireAdmin();

  // Mini-Validierung
  const validPresets = new Set([
    "today",
    "yesterday",
    "7",
    "30",
    "90",
    "this-month",
    "last-month",
    "this-quarter",
    "this-year",
    "custom",
  ]);
  if (value.preset && !validPresets.has(value.preset)) {
    return { ok: false, error: "Ungültiger Zeitraum-Preset." };
  }
  if (value.compare && !["none", "previous", "year"].includes(value.compare)) {
    return { ok: false, error: "Ungültiger Vergleichsmodus." };
  }
  if (value.preset === "custom" && (!value.from || !value.to)) {
    return {
      ok: false,
      error: "Bei benutzerdefiniertem Zeitraum bitte Start- und End-Datum angeben.",
    };
  }

  await setDashboardDefaultRange(dashboardId, value);
  revalidatePath("/settings");
  revalidatePath("/dashboards");
  return { ok: true };
}

export async function dashboardExistsAction(slug: string): Promise<boolean> {
  const orgId = await adminOrgId();
  const found = await getDashboardBySlug(orgId, slug);
  return !!found;
}
