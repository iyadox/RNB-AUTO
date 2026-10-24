/**
 * Comptes de l'espace de gestion : personnes ayant accès, appareils connectés.
 * Chaque changement d'accès est noté dans le journal des modifications (qui, quand, quoi).
 * Les fonctions ne vérifient pas la session : c'est le rôle des actions qui les appellent.
 */
import { and, asc, count, desc, eq, gt } from "drizzle-orm";
import { describeDevice } from "@/core/auth/device";
import { auditLog, sessions, users } from "@/server/db/schema";
import type { DbLike } from "@/server/settings/repository";
import { hashPassword, passwordProblem } from "./password";

export type Actor = { userId: string; label: string };

export class AccountError extends Error {}

export type AccountRow = { id: string; name: string; email: string; active: boolean; lastLoginAt: Date | null; createdAt: Date };

export async function listAccounts(db: DbLike): Promise<AccountRow[]> {
  return db
    .select({ id: users.id, name: users.name, email: users.email, active: users.active, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));
}

async function audit(db: DbLike, actor: Actor, userId: string, field: string, label: string, before: string, after: string) {
  await db.insert(auditLog).values({
    userId: actor.userId,
    userLabel: actor.label,
    entityType: "user",
    entityId: userId,
    field,
    label,
    oldValue: before,
    newValue: after,
    displayOld: before,
    displayNew: after,
    reason: null,
  });
}

/** Donne accès à une nouvelle personne (rôle administrateur, seul rôle aujourd'hui). */
export async function createAccount(db: DbLike, input: { name: string; email: string; password: string }, actor: Actor): Promise<string> {
  const email = input.email.trim().toLowerCase();
  const problem = passwordProblem(input.password);
  if (problem) throw new AccountError(problem);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new AccountError("Cette adresse email a déjà un accès.");
  const [created] = await db
    .insert(users)
    .values({ name: input.name.trim(), email, passwordHash: await hashPassword(input.password), role: "admin" })
    .returning({ id: users.id });
  if (!created) throw new AccountError("Création impossible.");
  await audit(db, actor, created.id, "created", `Accès à l'espace — ${input.name.trim()}`, "aucun accès", "accès donné");
  return created.id;
}

/** Suspend ou rétablit un accès. On ne peut pas suspendre son propre accès, ni le dernier accès actif. */
export async function setAccountActive(db: DbLike, userId: string, active: boolean, actor: Actor): Promise<void> {
  if (userId === actor.userId && !active) throw new AccountError("Vous ne pouvez pas suspendre votre propre accès.");
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw new AccountError("Compte introuvable.");
  if (target.active === active) return;
  if (!active) {
    const [row] = await db.select({ n: count() }).from(users).where(eq(users.active, true));
    if ((row?.n ?? 0) <= 1) throw new AccountError("Il doit toujours rester au moins un accès actif.");
  }
  await db.update(users).set({ active }).where(eq(users.id, userId));
  // Un accès suspendu est aussitôt déconnecté de tous ses appareils.
  if (!active) await db.delete(sessions).where(eq(sessions.userId, userId));
  await audit(db, actor, userId, "active", `Accès à l'espace — ${target.name}`, active ? "suspendu" : "actif", active ? "actif" : "suspendu");
}

/**
 * Donne un nouveau mot de passe à une AUTRE personne (mot de passe oublié). Ses appareils sont
 * aussitôt déconnectés ; le journal note le changement, jamais le mot de passe.
 */
export async function resetAccountPassword(db: DbLike, userId: string, password: string, actor: Actor): Promise<void> {
  if (userId === actor.userId) throw new AccountError("Pour votre propre mot de passe, utilisez « Mon compte ».");
  const problem = passwordProblem(password);
  if (problem) throw new AccountError(problem);
  const [target] = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  if (!target) throw new AccountError("Compte introuvable.");
  await db.update(users).set({ passwordHash: await hashPassword(password), passwordChangedAt: new Date() }).where(eq(users.id, userId));
  await db.delete(sessions).where(eq(sessions.userId, userId));
  await audit(db, actor, userId, "password", `Accès à l'espace — ${target.name}`, "ancien mot de passe", "nouveau mot de passe donné");
}

export type DeviceRow = { ref: string; device: string; ip: string | null; createdAt: Date; expiresAt: Date; current: boolean };

/** Référence courte d'une session : jamais le jeton, seulement le début de son empreinte. */
export function sessionRef(sessionId: string): string {
  return sessionId.slice(0, 16);
}

/** Appareils connectés à un compte (sessions en cours), le plus récent d'abord. */
export async function listDevices(db: DbLike, userId: string, currentSessionId: string): Promise<DeviceRow[]> {
  const rows = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date())))
    .orderBy(desc(sessions.createdAt));
  return rows.map((row) => ({
    ref: sessionRef(row.id),
    device: describeDevice(row.userAgent),
    ip: row.ip,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    current: row.id === currentSessionId,
  }));
}

/** Déconnecte un appareil précis du compte (jamais l'appareil utilisé en ce moment). */
export async function revokeDevice(db: DbLike, userId: string, ref: string, currentSessionId: string): Promise<boolean> {
  const rows = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.userId, userId));
  const target = rows.find((row) => sessionRef(row.id) === ref);
  if (!target) return false;
  if (target.id === currentSessionId) throw new AccountError("Pour quitter cet appareil, utilisez « Se déconnecter ».");
  await db.delete(sessions).where(and(eq(sessions.id, target.id), eq(sessions.userId, userId)));
  return true;
}

/** Dernières modifications d'accès (journal). */
export async function recentAccessChanges(db: DbLike, limit = 10) {
  return db.select().from(auditLog).where(eq(auditLog.entityType, "user")).orderBy(desc(auditLog.at)).limit(limit);
}
