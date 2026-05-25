import "server-only";
import { db } from "@/lib/db";
import { cacheEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = new Date();

  const cached = await db
    .select()
    .from(cacheEntries)
    .where(eq(cacheEntries.cacheKey, key))
    .limit(1);

  if (cached.length > 0 && cached[0].expiresAt > now) {
    return JSON.parse(cached[0].payload) as T;
  }

  const result = await fetcher();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  await db
    .insert(cacheEntries)
    .values({
      cacheKey: key,
      payload: JSON.stringify(result),
      expiresAt,
    })
    .onConflictDoUpdate({
      target: cacheEntries.cacheKey,
      set: {
        payload: JSON.stringify(result),
        expiresAt,
        createdAt: now,
      },
    });

  return result;
}

export async function getCacheAge(key: string): Promise<number | null> {
  const cached = await db
    .select()
    .from(cacheEntries)
    .where(eq(cacheEntries.cacheKey, key))
    .limit(1);

  if (cached.length === 0) return null;

  const ageMs = Date.now() - cached[0].createdAt.getTime();
  return Math.floor(ageMs / 60_000);
}
