"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth/requireUser";
import {
  countUsers,
  createUser,
  deleteUser,
  changePassword as dbChangePassword,
  verifyPassword,
  getUserById,
} from "@/lib/auth/users";

export interface ActionResult {
  ok: boolean;
  error?: string;
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
  const role = (formData.get("role") as string | null) === "admin" ? "admin" : "viewer";

  const emailErr = validateEmail(email);
  if (emailErr) return { ok: false, error: emailErr };
  const pwErr = validatePassword(password);
  if (pwErr) return { ok: false, error: pwErr };

  try {
    await createUser({ email, password, name, role });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unbekannter Fehler" };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();
  if (session.user.id === userId) {
    return { ok: false, error: "Du kannst dein eigenes Konto nicht löschen." };
  }
  await deleteUser(userId);
  revalidatePath("/settings");
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
