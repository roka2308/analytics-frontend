// =============================================================
//  Zentrale Zugriffs-Policy (server-only)
//
//  EINZIGE Stelle der "wer darf was"-Logik. Damit lassen sich Rechte
//  jederzeit anpassen, ohne das Datenmodell zu ändern.
//
//  Modell:
//   - Globale Rolle am Nutzer: admin | creator | viewer.
//     * admin = darf global alles.
//   - access_grants verknüpfen einen Nutzer mit einem Scope
//     (customer | project | dashboard) und optional einer Rolle in
//     diesem Scope (null = globale Rolle des Nutzers gilt im Scope).
//   - Übergangs-Kompatibilität: users.organizationId zählt als
//     impliziter Projekt-Grant mit der globalen Rolle (bis Cleanup Stufe 5).
//
//  Coverage (welcher Grant deckt welches Ziel ab):
//   - Dashboard D (Projekt P, Kunde C): dashboard=D ODER project=P ODER customer=C
//   - Projekt P (Kunde C):              project=P ODER customer=C
//   - Kunde C:                          customer=C
//  Effektive Rolle = höchste Rolle über alle abdeckenden Grants.
// =============================================================
import "server-only";
import {
  listGrantsForUser,
  getDashboardById,
  getOrgById,
  listOrganizationsForCustomer,
  listCustomers,
  listOrganizations,
  listDashboardsForOrg,
  type AccessGrantRow,
  type GrantRole,
} from "@/lib/db/queries";

export type Role = "admin" | "creator" | "viewer";

export interface SessionUserLike {
  id: string;
  role: Role;
  organizationId: string | null;
}

const RANK: Record<Role, number> = { viewer: 1, creator: 2, admin: 3 };

function maxRole(a: Role | null, b: Role | null): Role | null {
  if (!a) return b;
  if (!b) return a;
  return RANK[a] >= RANK[b] ? a : b;
}

/** Alle wirksamen Grants eines Nutzers (explizit + impliziter org-Fallback). */
async function effectiveGrants(user: SessionUserLike): Promise<AccessGrantRow[]> {
  const grants = await listGrantsForUser(user.id);
  if (user.organizationId) {
    const hasExplicit = grants.some(
      (g) => g.scopeType === "project" && g.scopeId === user.organizationId,
    );
    if (!hasExplicit) {
      grants.push({
        id: "implicit",
        userId: user.id,
        scopeType: "project",
        scopeId: user.organizationId,
        role: null,
      });
    }
  }
  return grants;
}

/** Rolle eines einzelnen Grants: explizite Grant-Rolle oder globale Rolle. */
function grantRole(user: SessionUserLike, g: AccessGrantRow): Role {
  return (g.role as Role | null) ?? user.role;
}

interface ScopeChain {
  dashboardId?: string;
  projectId?: string;
  customerId?: string;
}

function roleForChain(
  user: SessionUserLike,
  grants: AccessGrantRow[],
  chain: ScopeChain,
): Role | null {
  let result: Role | null = null;
  for (const g of grants) {
    const covers =
      (g.scopeType === "dashboard" && chain.dashboardId && g.scopeId === chain.dashboardId) ||
      (g.scopeType === "project" && chain.projectId && g.scopeId === chain.projectId) ||
      (g.scopeType === "customer" && chain.customerId && g.scopeId === chain.customerId);
    if (covers) result = maxRole(result, grantRole(user, g));
  }
  return result;
}

// ── Globale Rollen-Checks ────────────────────────────────────
export function isAdmin(user: SessionUserLike): boolean {
  return user.role === "admin";
}
/** Nutzer-, Kunden- und Projektverwaltung: vorerst nur Admin. */
export function canManageUsers(user: SessionUserLike): boolean {
  return isAdmin(user);
}
export function canManageCustomers(user: SessionUserLike): boolean {
  return isAdmin(user);
}

// ── Projekt-Ebene ────────────────────────────────────────────
async function projectChain(projectId: string): Promise<ScopeChain> {
  const org = await getOrgById(projectId);
  return { projectId, customerId: org?.customerId ?? undefined };
}

export async function canViewProject(user: SessionUserLike, projectId: string): Promise<boolean> {
  if (isAdmin(user)) return true;
  const grants = await effectiveGrants(user);
  return roleForChain(user, grants, await projectChain(projectId)) !== null;
}

export async function canEditProject(user: SessionUserLike, projectId: string): Promise<boolean> {
  if (isAdmin(user)) return true;
  const grants = await effectiveGrants(user);
  const role = roleForChain(user, grants, await projectChain(projectId));
  return role !== null && RANK[role] >= RANK.creator;
}

/** Datenquellen verwalten = Projekt bearbeiten dürfen. */
export const canManageDataSources = canEditProject;

// ── Dashboard-Ebene ──────────────────────────────────────────
async function dashboardChain(dashboardId: string): Promise<ScopeChain | null> {
  const dash = await getDashboardById(dashboardId);
  if (!dash) return null;
  const org = await getOrgById(dash.organizationId);
  return {
    dashboardId,
    projectId: dash.organizationId,
    customerId: org?.customerId ?? undefined,
  };
}

export async function canViewDashboard(
  user: SessionUserLike,
  dashboardId: string,
): Promise<boolean> {
  if (isAdmin(user)) return true;
  const chain = await dashboardChain(dashboardId);
  if (!chain) return false;
  const grants = await effectiveGrants(user);
  return roleForChain(user, grants, chain) !== null;
}

export async function canEditDashboard(
  user: SessionUserLike,
  dashboardId: string,
): Promise<boolean> {
  if (isAdmin(user)) return true;
  const chain = await dashboardChain(dashboardId);
  if (!chain) return false;
  const grants = await effectiveGrants(user);
  const role = roleForChain(user, grants, chain);
  return role !== null && RANK[role] >= RANK.creator;
}

// ── Listen für Navigation / Sichtbarkeit ─────────────────────

/** Kunden, die der Nutzer sehen darf (Admin: alle). */
export async function getAccessibleCustomers(user: SessionUserLike) {
  if (isAdmin(user)) return listCustomers();
  const grants = await effectiveGrants(user);
  const all = await listCustomers();
  const visible: typeof all = [];
  for (const c of all) {
    const orgs = await listOrganizationsForCustomer(c.id);
    const direct = grants.some((g) => g.scopeType === "customer" && g.scopeId === c.id);
    const viaProject = orgs.some((o) =>
      grants.some((g) => g.scopeType === "project" && g.scopeId === o.id),
    );
    if (direct || viaProject) visible.push(c);
  }
  return visible;
}

/** Projekte, die der Nutzer mindestens ansehen darf (Admin: alle). */
export async function getAccessibleProjects(user: SessionUserLike) {
  const all = await listOrganizations();
  if (isAdmin(user)) return all;
  const grants = await effectiveGrants(user);
  const result: typeof all = [];
  for (const o of all) {
    const chain: ScopeChain = { projectId: o.id, customerId: o.customerId ?? undefined };
    // Auch Dashboard-Grants in diesem Projekt machen das Projekt sichtbar
    const hasDashGrant = grants.some((g) => g.scopeType === "dashboard");
    if (roleForChain(user, grants, chain) !== null) {
      result.push(o);
    } else if (hasDashGrant) {
      const dashes = await listDashboardsForOrg(o.id);
      if (dashes.some((d) => grants.some((g) => g.scopeType === "dashboard" && g.scopeId === d.id))) {
        result.push(o);
      }
    }
  }
  return result;
}

/** Dashboards eines Projekts, die der Nutzer sehen darf. */
export async function getAccessibleDashboardsForProject(
  user: SessionUserLike,
  projectId: string,
) {
  const dashes = await listDashboardsForOrg(projectId);
  if (isAdmin(user)) return dashes;
  const grants = await effectiveGrants(user);
  const chain = await projectChain(projectId);
  // Wer das ganze Projekt sehen darf, sieht alle Dashboards
  if (roleForChain(user, grants, chain) !== null) return dashes;
  // sonst nur explizit freigegebene Dashboards
  return dashes.filter((d) =>
    grants.some((g) => g.scopeType === "dashboard" && g.scopeId === d.id),
  );
}

export type { GrantRole };
