"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireUser, requireAdmin } from "@/lib/auth/requireUser";
import { logAudit } from "@/lib/audit";
import {
  countUsers,
  createUser,
  createInvitedUser,
  acceptInvite,
  deleteUser,
  changePassword as dbChangePassword,
  verifyPassword,
  getUserById,
} from "@/lib/auth/users";

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Bei Einladungen: der zu teilende Einladungslink. */
  inviteUrl?: string;
}

function appBaseUrl(): string {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

function validatePassword(password: string): string | null {
  if (!password) return "Passwort darf nicht leer sein.";
  if (password.length < 8) return "Passwort muss mindestens 8 Zeichen lang sein.";
  return null;
}

function validateEmail(email: string): string | null {
  if (!email) return "E-Mail darf nicht leer sein.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Ungültige E-Mail-Adresse.";
  return null;
}

function parseRole(v: unknown): "admin" | "creator" | "viewer" {
  return v === "admin" ? "admin" : v === "creator" ? "creator" : "viewer";
}

/**
 * Wird von der /setup-Seite aufgerufen.
 * Funktioniert NUR, solange es noch keinen einzigen Nutzer in der DB gibt.
 */
export async function bootstrapFirstAdminAction(formData: FormData): Promise<ActionResult> {
  const existing = await countUsers();
  if (existing > 0) {
    return { ok: false, error: "Setup wurde bereits abgeschlossen." };
  }

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const name = (formData.get("name") as string | null)?.trim() || null;

  const emailErr = validateEmail(email);
  if (emailErr) return { ok: false, error: emailErr };
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };

  try {
    await createUser({ email, password, name, role: "admin" });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
  }

  return { ok: true };
}

export async function createUserAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const name = (formData.get("name") as string | null)?.trim() || null;
  const role = parseRole(formData.get("role"));
  // Projekt ist optional: ein eingeschraenkter Viewer kann ohne Heim-Projekt
  // angelegt und spaeter gezielt auf einzelne Dashboards berechtigt werden.
  const organizationId = (formData.get("organizationId") as string | null) || null;

  const emailErr = validateEmail(email);
  if (emailErr) return { ok: false, error: emailErr };
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };

  try {
    await createUser({ email, password, name, role, organizationId });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
  }

  await logAudit({ action: "user.create", entityType: "user", summary: `Nutzer ${email} (${role}) angelegt` });
  revalidatePath("/settings");
  revalidatePath("/zugriffe");
  return { ok: true };
}

/** Laedt einen Nutzer per Einladungslink ein (setzt Passwort selbst). */
export async function inviteUserAction(formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const name = (formData.get("name") as string | null)?.trim() || null;
  const role = parseRole(formData.get("role"));
  const emailErr = validateEmail(email);
  if (emailErr) return { ok: false, error: emailErr };

  try {
    const { token } = await createInvitedUser({ email, name, role, organizationId: null });
    await logAudit({
      action: "user.invite",
      entityType: "user",
      summary: `Einladung für ${email} (${role}) erstellt`,
    });
    revalidatePath("/zugriffe");
    return { ok: true, inviteUrl: `${appBaseUrl()}/einladung/${token}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
  }
}

/** Eingeladenen Nutzer direkt einem Kunden zuordnen. */
export async function inviteCustomerUserAction(
  customerId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const name = (formData.get("name") as string | null)?.trim() || null;
  const role = parseRole(formData.get("role"));
  const emailErr = validateEmail(email);
  if (emailErr) return { ok: false, error: emailErr };
  if (!customerId) return { ok: false, error: "Kunde fehlt." };

  try {
    const { id, token } = await createInvitedUser({ email, name, role, organizationId: null });
    const { grantAccess } = await import("@/lib/db/queries");
    await grantAccess(id, "customer", customerId, null);
    await logAudit({
      action: "user.invite",
      entityType: "user",
      summary: `Einladung für ${email} (${role}) – Kunde zugeordnet`,
    });
    revalidatePath("/kunden");
    revalidatePath("/zugriffe");
    return { ok: true, inviteUrl: `${appBaseUrl()}/einladung/${token}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
  }
}

/** Oeffentlich: Nutzer nimmt Einladung an und setzt sein Passwort. */
export async function acceptInviteAction(
  token: string,
  newPassword: string,
): Promise<ActionResult> {
  const pwErr = validatePassword(newPassword);
  if (pwErr) return { ok: false, error: pwErr };
  const ok = await acceptInvite(token, newPassword);
  if (!ok) return { ok: false, error: "Einladung ungültig oder abgelaufen." };
  return { ok: true };
}

/**
 * Legt einen Nutzer an und ordnet ihn direkt einem Kunden zu
 * (Customer-Scope-Grant). Kein Heim-Projekt -> Zugriff allein ueber Grants.
 */
export async function createCustomerUserAction(
  customerId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const name = (formData.get("name") as string | null)?.trim() || null;
  const role = parseRole(formData.get("role"));

  const emailErr = validateEmail(email);
  if (emailErr) return { ok: false, error: emailErr };
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };
  if (!customerId) return { ok: false, error: "Kunde fehlt." };

  try {
    const user = await createUser({ email, password, name, role, organizationId: null });
    if (user) {
      const { grantAccess } = await import("@/lib/db/queries");
      await grantAccess(user.id, "customer", customerId, null);
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
  }

  revalidatePath("/kunden");
  revalidatePath("/zugriffe");
  return { ok: true };
}

export async function reassignUserOrgAction(
  userId: string,
  organizationId: string
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (!organizationId) return { ok: false, error: "Organisation darf nicht leer sein." };

  const { updateUserOrg } = await import("@/lib/auth/users");
  await updateUserOrg(userId, organizationId);

  revalidatePath("/settings");
  void session;
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    return { ok: false, error: "Du kannst dein eigenes Konto nicht löschen." };
  }
  await deleteUser(userId);
  await logAudit({ action: "user.delete", entityType: "user", entityId: userId, summary: "Nutzer gelöscht" });
  revalidatePath("/settings");
  revalidatePath("/zugriffe");
  return { ok: true };
}

export async function setUserRoleAction(
  userId: string,
  role: "admin" | "creator" | "viewer",
): Promise<ActionResult> {
  const session = await requireAdmin();
  if (session.user.id === userId && role !== "admin") {
    return { ok: false, error: "Du kannst dir nicht selbst die Admin-Rolle entziehen." };
  }
  const { setUserRole } = await import("@/lib/auth/users");
  await setUserRole(userId, parseRole(role));
  await logAudit({ action: "user.role", entityType: "user", entityId: userId, summary: `Rolle geändert: ${role}` });
  revalidatePath("/settings");
  revalidatePath("/zugriffe");
  return { ok: true };
}

/**
 * Erteilt einem Nutzer Zugriff auf einen Scope (Kunde/Projekt/Dashboard) mit
 * optionaler Rolle (null = globale Rolle des Nutzers gilt im Scope).
 */
export async function grantAccessAction(input: {
  userId: string;
  scopeType: "customer" | "project" | "dashboard";
  scopeId: string;
  role?: "admin" | "creator" | "viewer" | null;
}): Promise<ActionResult> {
  await requireAdmin();
  if (!input.userId || !input.scopeId) {
    return { ok: false, error: "Nutzer und Ziel sind erforderlich." };
  }
  const { grantAccess } = await import("@/lib/db/queries");
  await grantAccess(input.userId, input.scopeType, input.scopeId, input.role ?? null);
  revalidatePath("/settings");
  return { ok: true };
}

export async function revokeGrantAction(grantId: string): Promise<ActionResult> {
  await requireAdmin();
  if (!grantId) return { ok: false, error: "Grant-ID fehlt." };
  const { revokeAccess } = await import("@/lib/db/queries");
  await revokeAccess(grantId);
  revalidatePath("/settings");
  return { ok: true };
}

/** Admin setzt das Passwort eines beliebigen Nutzers neu. */
export async function resetUserPasswordAction(
  userId: string,
  newPassword: string,
): Promise<ActionResult> {
  await requireAdmin();
  const pwErr = validatePassword(newPassword);
  if (pwErr) return { ok: false, error: pwErr };
  const user = await getUserById(userId);
  if (!user) return { ok: false, error: "Nutzer nicht gefunden." };
  await dbChangePassword(userId, newPassword);
  await logAudit({ action: "user.password_reset", entityType: "user", entityId: userId, summary: `Passwort zurückgesetzt (${user.email})` });
  revalidatePath("/zugriffe");
  return { ok: true };
}

export async function changeOwnPasswordAction(formData: FormData): Promise<ActionResult> {
  const session = await requireUser();

  const currentPassword = (formData.get("currentPassword") as string | null) ?? "";
  const newPassword = (formData.get("newPassword") as string | null) ?? "";

  const pwErr = validatePassword(newPassword);
  if (pwErr) return { ok: false, error: pwErr };

  const user = await getUserById(session.user.id);
  if (!user) return { ok: false, error: "Nutzer nicht gefunden." };

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return { ok: false, error: "Aktuelles Passwort ist falsch." };

  await dbChangePassword(session.user.id, newPassword);
  return { ok: true };
}
