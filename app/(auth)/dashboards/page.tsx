import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import { getOrCreateDefaultOrg } from "@/lib/db/queries";
import { getOrCreateDefaultDashboard } from "@/lib/widgets/seed";

export const dynamic = "force-dynamic";

/**
 * /dashboards ohne Slug -> Weiterleitung zum Default-Dashboard.
 */
export default async function DashboardsIndex({
  searchParams,
}: {
  searchParams: { range?: string; site?: string };
}) {
  const session = await requireUser();
  const defaultOrg = await getOrCreateDefaultOrg();
  const orgId =
    session.user.role === "admin"
      ? defaultOrg.id
      : session.user.organizationId ?? defaultOrg.id;

  const dashboard = await getOrCreateDefaultDashboard(orgId);
  if (!dashboard) {
    redirect("/settings");
  }

  const qs = new URLSearchParams();
  if (searchParams.range) qs.set("range", searchParams.range);
  if (searchParams.site) qs.set("site", searchParams.site);
  const tail = qs.toString() ? `?${qs.toString()}` : "";

  redirect(`/dashboards/${dashboard.slug}${tail}`);
}
