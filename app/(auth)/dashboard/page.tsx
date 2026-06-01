import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";
import {
  getOrCreateDefaultOrg,
  getVisibleProjectsForSession,
} from "@/lib/db/queries";
import { getOrCreateDefaultDashboard } from "@/lib/widgets/seed";

export const dynamic = "force-dynamic";

export default async function DashboardLegacyAlias({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const session = await requireUser();
  await getOrCreateDefaultOrg();
  const projects = await getVisibleProjectsForSession(session);
  if (projects.length === 0) redirect("/settings");

  const project = projects[0];
  const dashboard = await getOrCreateDefaultDashboard(project.id);
  if (!dashboard) redirect("/settings");

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) qs.set(k, v);
  }
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/projekte/${project.slug}/dashboards/${dashboard.slug}${tail}`);
}
