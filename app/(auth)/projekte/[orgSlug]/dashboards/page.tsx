import { notFound, redirect } from "next/navigation";
import {
  requireUser,
  assertProjectAccess,
} from "@/lib/auth/requireUser";
import { getOrgBySlug } from "@/lib/db/queries";
import { getOrCreateDefaultDashboard } from "@/lib/widgets/seed";

export const dynamic = "force-dynamic";

export default async function ProjectDashboardsIndex({
  params,
  searchParams,
}: {
  params: { orgSlug: string };
  searchParams: Record<string, string | undefined>;
}) {
  await requireUser();
  const project = await getOrgBySlug(params.orgSlug);
  if (!project) notFound();
  await assertProjectAccess(project.id);

  const dashboard = await getOrCreateDefaultDashboard(project.id);
  if (!dashboard) redirect(`/settings`);

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v) qs.set(k, v);
  }
  const tail = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/projekte/${project.slug}/dashboards/${dashboard.slug}${tail}`);
}
