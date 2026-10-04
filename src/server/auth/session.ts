import "server-only";

/**
 * Sessions de l'espace RNB AUTO.
 * - Jeton aléatoire (256 bits) dans un cookie HttpOnly, Secure en production, SameSite=Lax.
 * - En base, seule l'empreinte SHA-256 du jeton est stockée.
 * - La session est vérifiée dans CHAQUE page et CHAQUE action (le fichier proxy.ts ne fait qu'une
 *   redirection rapide, il ne suffit pas à protéger).
 */
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getDb } from "@/server/db/client";
import { sessions, users } from "@/server/db/schema";

const SESSION_DAYS = 30;
const RENEW_WHEN_DAYS_LEFT = 15;

export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-rnb_session" : "rnb_session";

export type AdminUser = { id: string; name: string; email: string; role: string };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function createSession(userId: string): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
  const h = await headers();
  await db.insert(sessions).values({
    id: hashToken(token),
    userId,
    expiresAt,
    ip: (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").slice(0, 64) || null,
    userAgent: (h.get("user-agent") ?? "").slice(0, 300) || null,
  });
  await setSessionCookie(token, expiresAt);
  // Nettoyage des sessions expirées.
  void db.delete(sessions).where(lt(sessions.expiresAt, new Date())).catch(() => undefined);
}

/** Utilisateur connecté (ou null). Mis en cache pour la durée d'une requête. */
export const getCurrentUser = cache(async (): Promise<(AdminUser & { sessionId: string; expiresAt: Date }) | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.active) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role, sessionId: row.sessionId, expiresAt: row.expiresAt };
});

/** Pour les pages : redirige vers la connexion si besoin. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/admin/connexion");
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export class AuthError extends Error {
  constructor() {
    super("Session expirée : reconnectez-vous.");
  }
}

/** Pour les actions serveur : refuse si la session n'est pas valide, et la prolonge si besoin. */
export async function requireAdminAction(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new AuthError();
  const daysLeft = (user.expiresAt.getTime() - Date.now()) / (24 * 3600 * 1000);
  if (daysLeft < RENEW_WHEN_DAYS_LEFT) {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) {
      const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 3600 * 1000);
      const db = await getDb();
      await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, user.sessionId));
      await setSessionCookie(token, expiresAt);
    }
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDb();
    await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

export async function destroyOtherSessions(userId: string, keepSessionId: string): Promise<void> {
  const db = await getDb();
  const all = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  for (const session of all) {
    if (session.id !== keepSessionId) await db.delete(sessions).where(eq(sessions.id, session.id));
  }
}
