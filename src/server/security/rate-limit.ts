/**
 * Limitation des abus (estimations, recherches d'adresses, envois, connexions).
 * Les compteurs sont en base pour fonctionner même avec plusieurs serveurs.
 * Les adresses IP ne sont jamais stockées en clair (empreinte tronquée).
 */
import { createHash } from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/server/db/client";
import { rateLimits } from "@/server/db/schema";

export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "inconnue";
}

export function hashIdentifier(value: string): string {
  return createHash("sha256").update(`rnb:${value}`).digest("hex").slice(0, 24);
}

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

/**
 * Incrémente le compteur `key` sur une fenêtre glissante simple.
 * En cas de panne de la base, la demande est autorisée (la sécurité ne doit pas bloquer un client en panne).
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  try {
    const db = await getDb();
    const [row] = await db
      .insert(rateLimits)
      .values({ key, count: 1, windowStart: new Date() })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: sql`CASE WHEN ${rateLimits.windowStart} < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE ${rateLimits.count} + 1 END`,
          windowStart: sql`CASE WHEN ${rateLimits.windowStart} < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE ${rateLimits.windowStart} END`,
        },
      })
      .returning({ count: rateLimits.count, windowStart: rateLimits.windowStart });
    if (Math.random() < 0.01) {
      void db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(Date.now() - 24 * 3600 * 1000))).catch(() => undefined);
    }
    const count = row?.count ?? 1;
    const elapsed = row ? (Date.now() - new Date(row.windowStart).getTime()) / 1000 : 0;
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil(windowSeconds - elapsed)),
    };
  } catch {
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Raccourci : limite par adresse IP pour une action donnée. */
export async function rateLimitByIp(action: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  return rateLimit(`${action}:${hashIdentifier(await clientIp())}`, limit, windowSeconds);
}

/** Remet un compteur à zéro (ex. connexion réussie : seules les erreurs répétées bloquent). */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    const db = await getDb();
    await db.delete(rateLimits).where(eq(rateLimits.key, key));
  } catch {
    // Sans conséquence : le compteur expirera de lui-même.
  }
}
