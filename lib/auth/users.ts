import "server-only";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users, auditLog } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getOrCreateDefaultOrg } from "@/lib/db/queries";

const BCRYPT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function getUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserById(id: string) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listUsers() {
  return db.select().from(users).orderBy(asc(users.createdAt));
}

export async function countUsers() {
  const all = await db.select({ id: users.id }).from(users);
  return all.length;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string | null;
  role: "admin" | "creator" | "viewer";
  organizationId?: string | null;
}

export async function createUser(input: CreateUserInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("Eine Nutzerin/ein Nutzer mit dieser E-Mail existiert bereits.");
  }

  // Nur wenn GAR KEINE Org angegeben wurde (undefined, z.B. Bootstrap des
  // ersten Admins), in die Default-Org packen. Explizites null bleibt null
  // (eingeschraenkter Viewer, der nur ueber Grants Zugriff bekommt).
  const organizationId =
    input.organizationId === undefined
      ? (await getOrCreateDefaultOrg()).id
      : input.organizationId;
  const passwordHash = await hashPassword(input.password);

  await db.insert(users).values({
    email,
    passwordHash,
    name: input.name ?? null,
    role: input.role,
    organizationId,
  });

  return getUserByEmail(email);
}

// ── Einladungs-Flow (Link) ───────────────────────────────────

export interface InviteUserInput {
  email: string;
  name?: string | null;
  role: "admin" | "creator" | "viewer";
  organizationId?: string | null;
}

/**
 * Legt einen eingeladenen Nutzer an: unbenutzbares Zufalls-Passwort + Invite-
 * Token. Login ist gesperrt, bis der Nutzer ueber den Link sein Passwort setzt.
 */
export async function createInvitedUser(
  input: InviteUserInput,
): Promise<{ id: string; token: string }> {
  const email = input.email.toLowerCase().trim();
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("Eine Nutzerin/ein Nutzer mit dieser E-Mail existiert bereits.");
  }
  const id = crypto.randomUUID();
  const token = randomBytes(32).toString("base64url");
  const passwordHash = await hashPassword(randomBytes(24).toString("hex"));
  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Tage
  await db.insert(users).values({
    id,
    email,
    passwordHash,
    name: input.name ?? null,
    role: input.role,
    organizationId: input.organizationId ?? null,
    inviteToken: token,
    inviteExpiresAt,
  });
  return { id, token };
}

export async function getUserByInviteToken(token: string) {
  const rows = await db.select().from(users).where(eq(users.inviteToken, token)).limit(1);
  const u = rows[0];
  if (!u) return null;
  if (u.inviteExpiresAt && u.inviteExpiresAt.getTime() < Date.now()) return null;
  return u;
}

/** Nutzer setzt sein Passwort ueber den Einladungslink -> Token entwerten. */
export async function acceptInvite(token: string, newPassword: string): Promise<boolean> {
  const u = await getUserByInviteToken(token);
  if (!u) return false;
  const passwordHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash, inviteToken: null, inviteExpiresAt: null })
    .where(eq(users.id, u.id));
  return true;
}

export async function updateUserOrg(userId: string, organizationId: string | null) {
  await db.update(users).set({ organizationId }).where(eq(users.id, userId));
}

export async function setUserRole(
  userId: string,
  role: "admin" | "creator" | "viewer",
) {
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

export async function changePassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

/** Beim erfolgreichen Login: Zeitstempel setzen + Login protokollieren. */
export async function recordLogin(userId: string, email: string) {
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  try {
    await db.insert(auditLog).values({
      actorUserId: userId,
      actorEmail: email,
      action: "user.login",
      entityType: "user",
      entityId: userId,
      summary: "Login",
    });
  } catch {
    /* Audit-Fehler ignorieren */
  }
}
