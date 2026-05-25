import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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
  role: "admin" | "viewer";
  organizationId?: string | null;
}

export async function createUser(input: CreateUserInput) {
  const email = input.email.toLowerCase().trim();
  const existing = await getUserByEmail(email);
  if (existing) {
    throw new Error("Eine Nutzerin/ein Nutzer mit dieser E-Mail existiert bereits.");
  }

  // Wenn keine Org angegeben wurde, in die Default-Org packen
  // (für den Bootstrap-Fall des ersten Admins)
  const organizationId =
    input.organizationId ?? (await getOrCreateDefaultOrg()).id;
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

export async function updateUserOrg(userId: string, organizationId: string | null) {
  await db.update(users).set({ organizationId }).where(eq(users.id, userId));
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

export async function changePassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}
