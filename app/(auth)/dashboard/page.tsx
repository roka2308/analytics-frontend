import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrCreateDefaultOrg } from "@/lib/db/queries";
import { getOrCreateDefaultDashboard } from "@/lib/widgets/seed";

export const dynamic = "force-dynamic";

/**
 * Legacy-Alias /dashboard (singular). Leitet auf Default-Dashboard
 * der aktiven Org weiter und reicht alle Query-Parameter durch.
 */
export default async function DashboardLegacyAlias({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await requireUser();
  const defaultOrg = await getOrCreateDefaultOrg();
  const orgId =
    session.user.role === "admin"
      ? defaultOrg.id
      : session.user.organizationId ?? defaultOrg.id;

  const dashboard = await getOrCreateDefaultDashboard(orgId);
  if (!dashboard) redirect("/settings");

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) params.set(k, v);
  }
  const tail = params.toString() ? `?${params.toString()}` : "";

  redirect(`/dashboards/${dashboard.slug}${tail}`);
}
