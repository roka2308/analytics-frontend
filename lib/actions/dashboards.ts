"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  createDashboard,
  createWidget,
  deleteDashboard,
  getDashboardBySlug,
  getOrCreateDefaultOrg,
  listDashboardsForOrg,
  renameDashboard,
  setDashboardDefaultRange,
  setDefaultDashboard,
  type DashboardDefaultRange,
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
    isDefault: existing.length === 0, // erstes Dashboard wird automatisch Default
    position: existing.length,
  });

  // Optional: Template-Widgets befuellen
  if (template === "kpi-basics") {
    const kpis = ["visits", "pageviews", "bounceRate", "avgDuration"];
    for (let k = 0; k < kpis.length; k++) {
      await createWidget({
        dashboardId: id,
        type: "kpi-card",
        title: null,
        layout: { x: k * 3, y: 0, w: 3, h: 2 },
        config: { metric: kpis[k], accent: k === 0 },
        position: k,
      });
    }
  }

  revalidatePath("/settings");
  revalidatePath("/dashboards");
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
  await requireAdmin();
  const orgId = await adminOrgId();
  const all = await listDashboardsForOrg(orgId);
  if (all.length <= 1) {
    return {
      ok: false,
      error: "Das letzte Dashboard kann nicht gelöscht werden. Lege erst ein anderes an.",
    };
  }
  const target = all.find((d) => d.id === dashboardId);
  if (!target) return { ok: false, error: "Dashboard nicht gefunden." };

  await deleteDashboard(dashboardId);

  // Wenn wir das Default geloescht haben, einem anderen den Default-Status geben
  if (target.isDefault) {
    const remaining = all.filter((d) => d.id !== dashboardId);
    if (remaining.length > 0) {
      await setDefaultDashboard(orgId, remaining[0].id);
    }
  }

  revalidatePath("/settings");
  revalidatePath("/dashboards");
  return { ok: true };
}

export async function setDefaultDashboardAction(dashboardId: string): Promise<ActionResult> {
  await requireAdmin();
  const orgId = await adminOrgId();
  await setDefaultDashboard(orgId, dashboardId);
  revalidatePath("/settings");
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
