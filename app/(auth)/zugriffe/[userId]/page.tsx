import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireUser";
import {
  listCustomers,
  listOrganizations,
  listDashboardsForOrg,
  listGrantsForUser,
} from "@/lib/db/queries";
import { getUserById } from "@/lib/auth/users";
import {
  UserAccessDetail,
  type GrantView,
} from "@/components/settings/UserAccessDetail";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: { userId: string };
}) {
  await requireAdmin();

  const user = await getUserById(params.userId);
  if (!user) notFound();

  const [customers, projects] = await Promise.all([listCustomers(), listOrganizations()]);

  // Alle Dashboards mit Projekt-Label
  const dashboardTargets: { id: string; name: string }[] = [];
  const dashboardName = new Map<string, string>();
  for (const org of projects) {
    const dashes = await listDashboardsForOrg(org.id);
    for (const d of dashes) {
      const label = `${d.name} (${org.name})`;
      dashboardTargets.push({ id: d.id, name: label });
      dashboardName.set(d.id, label);
    }
  }
  const customerName = new Map(customers.map((c) => [c.id, c.name] as const));
  const projectName = new Map(projects.map((p) => [p.id, p.name] as const));

  const grantsRaw = await listGrantsForUser(user.id);
  const grants: GrantView[] = grantsRaw.map((g) => ({
    id: g.id,
    scopeType: g.scopeType,
    scopeId: g.scopeId,
    role: g.role,
    label:
      g.scopeType === "customer"
        ? customerName.get(g.scopeId) ?? g.scopeId
        : g.scopeType === "project"
          ? projectName.get(g.scopeId) ?? g.scopeId
          : dashboardName.get(g.scopeId) ?? g.scopeId,
  }));

  return (
    <UserAccessDetail
      user={{ id: user.id, email: user.email, name: user.name, role: user.role }}
      targets={{
        customer: customers.map((c) => ({ id: c.id, name: c.name })),
        project: projects.map((p) => ({ id: p.id, name: p.name })),
        dashboard: dashboardTargets,
      }}
      grants={grants}
    />
  );
}
