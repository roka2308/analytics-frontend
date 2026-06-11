"use server";

import { requireAdmin } from "@/lib/auth/requireUser";
import { logAudit } from "@/lib/audit";
import { warmAllDashboards, type WarmSummary } from "@/lib/cache/warm";

export interface WarmResult {
  ok: boolean;
  error?: string;
  summary?: WarmSummary;
}

/** Manuelles Cache-Vorwaermen (Admin). */
export async function warmCacheAction(): Promise<WarmResult> {
  await requireAdmin();
  const summary = await warmAllDashboards();
  await logAudit({
    action: "cache.warm",
    summary: `Cache vorgewärmt: ${summary.warmed}/${summary.widgets} Widgets in ${Math.round(
      summary.durationMs / 1000,
    )}s`,
  });
  return { ok: true, summary };
}
