"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { canManageDataSources } from "@/lib/auth/permissions";
import {
  createDataSource,
  deleteDataSource,
  updateDataSource,
  getDataSourceById,
  getOrgById,
  listDataSourcesForOrg,
} from "@/lib/db/queries";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

const KNOWN_TYPES = ["matomo", "sql"] as const;

export async function addDataSourceAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();

  const organizationId = (formData.get("organizationId") as string | null) || null;
  const type = ((formData.get("type") as string | null) ?? "matomo").trim();
  const label = (formData.get("label") as string | null)?.trim();

  if (!organizationId) return { ok: false, error: "Bitte ein Projekt auswählen." };
  if (!label) return { ok: false, error: "Bezeichnung ist ein Pflichtfeld." };
  if (!KNOWN_TYPES.includes(type as (typeof KNOWN_TYPES)[number])) {
    return { ok: false, error: `Unbekannter Datenquellen-Typ "${type}".` };
  }

  if (!(await canManageDataSources(session.user, organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }

  const org = await getOrgById(organizationId);
  if (!org) return { ok: false, error: "Projekt nicht gefunden." };

  let matomoSiteId: number | null = null;
  let config: string | null = null;

  if (type === "matomo") {
    const raw = formData.get("matomoSiteId");
    const n = parseInt((raw as string) ?? "", 10);
    if (!Number.isFinite(n) || n < 1) {
      return { ok: false, error: "Die Matomo-Site-ID muss eine positive Zahl sein." };
    }
    const existing = await listDataSourcesForOrg(organizationId);
    if (existing.some((d) => d.type === "matomo" && d.matomoSiteId === n)) {
      return { ok: false, error: `Matomo-Site-ID ${n} ist in diesem Projekt bereits vorhanden.` };
    }
    matomoSiteId = n;
  } else {
    // sql / weitere: optionale Konfiguration als JSON-String
    config = (formData.get("config") as string | null)?.trim() || null;
  }

  await createDataSource({ organizationId, type, label, matomoSiteId, config });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateDataSourceAction(
  dataSourceId: string,
  fields: { label?: string; matomoSiteId?: number | null; config?: string | null },
): Promise<ActionResult> {
  const session = await requireUser();
  const ds = await getDataSourceById(dataSourceId);
  if (!ds) return { ok: false, error: "Datenquelle nicht gefunden." };
  if (!(await canManageDataSources(session.user, ds.organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }
  await updateDataSource(dataSourceId, fields);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function removeDataSourceAction(dataSourceId: string): Promise<ActionResult> {
  const session = await requireUser();
  const ds = await getDataSourceById(dataSourceId);
  if (!ds) return { ok: false, error: "Datenquelle nicht gefunden." };
  if (!(await canManageDataSources(session.user, ds.organizationId))) {
    return { ok: false, error: "Keine Berechtigung für dieses Projekt." };
  }
  await deleteDataSource(dataSourceId);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
