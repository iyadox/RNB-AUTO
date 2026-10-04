"use server";

/** Actions de « Paramètres ». Chacune vérifie la session et valide ce qu'elle reçoit. */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { formatKm, formatMinutes } from "@/core/format";
import { AuthError, getCurrentUser, requireAdminAction, destroyOtherSessions } from "@/server/auth/session";
import { hashPassword, passwordProblem, verifyPassword } from "@/server/auth/password";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { routeBetween } from "@/server/geo/service";
import { sendTestEmail } from "@/server/notifications/service";
import { isSettingsSection, saveSettingsSection, type SettingsSaveResult } from "@/server/settings/admin";
import { getLatestVersion } from "@/server/settings/versions";

function failure(error: unknown): { ok: false; message: string; errors: Record<string, string> } {
  if (error instanceof AuthError) return { ok: false, message: error.message, errors: {} };
  console.error("[paramètres]", error);
  return { ok: false, message: "Une erreur est survenue. Réessayez.", errors: {} };
}

const saveSchema = z.object({ section: z.string().max(40), values: z.record(z.string().max(80), z.unknown()) });

export async function saveSettingsAction(raw: unknown): Promise<SettingsSaveResult> {
  try {
    const user = await requireAdminAction();
    const parsed = saveSchema.safeParse(raw);
    if (!parsed.success || !isSettingsSection(parsed.data.section)) return { ok: false, message: "Données invalides : rechargez la page.", errors: {} };
    const db = await getDb();
    const result = await saveSettingsSection(db, parsed.data.section, parsed.data.values, { userId: user.id, label: user.name });
    // Coordonnées, mentions, zone… : tout le site affiche ces informations.
    if (result.ok && result.changeCount > 0) revalidatePath("/", "layout");
    return result;
  } catch (error) {
    return failure(error);
  }
}

export type AccountFormState = { ok?: boolean; message?: string; errors?: Record<string, string> } | undefined;

const profileSchema = z.object({
  name: z.string().trim().min(2, { error: "Indiquez un nom." }).max(80),
  email: z.email({ error: "Adresse email invalide." }).transform((v) => v.toLowerCase().trim()),
});

export async function updateProfileAction(_previous: AccountFormState, formData: FormData): Promise<AccountFormState> {
  try {
    const user = await requireAdminAction();
    const parsed = profileSchema.safeParse({ name: formData.get("name"), email: formData.get("email") });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
      return { ok: false, errors };
    }
    const db = await getDb();
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
    if (existing && existing.id !== user.id) return { ok: false, errors: { email: "Cette adresse est déjà utilisée par un autre compte." } };
    await db.update(users).set({ name: parsed.data.name, email: parsed.data.email }).where(eq(users.id, user.id));
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Informations enregistrées." };
  } catch (error) {
    return { ok: false, message: failure(error).message };
  }
}

export async function changePasswordAction(_previous: AccountFormState, formData: FormData): Promise<AccountFormState> {
  try {
    const user = await requireAdminAction();
    const current = String(formData.get("current") ?? "");
    const next = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");
    if (next.length > 200 || current.length > 200) return { ok: false, message: "Mot de passe trop long." };
    const db = await getDb();
    const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    if (!row || !(await verifyPassword(current, row.passwordHash))) return { ok: false, errors: { current: "Mot de passe actuel incorrect." } };
    const problem = passwordProblem(next);
    if (problem) return { ok: false, errors: { password: problem } };
    if (next !== confirm) return { ok: false, errors: { confirm: "Les deux mots de passe sont différents." } };
    await db.update(users).set({ passwordHash: await hashPassword(next), passwordChangedAt: new Date() }).where(eq(users.id, user.id));
    // Par sécurité, les autres appareils connectés sont déconnectés.
    const session = await getCurrentUser();
    if (session) await destroyOtherSessions(user.id, session.sessionId);
    return { ok: true, message: "Mot de passe changé. Vos autres appareils ont été déconnectés." };
  } catch (error) {
    return { ok: false, message: failure(error).message };
  }
}

export type ServiceTestResult = { ok: boolean; message: string };

/** Calcule un petit trajet depuis le dépôt pour vérifier le service d'itinéraires. */
export async function testRoutingAction(): Promise<ServiceTestResult> {
  try {
    await requireAdminAction();
    const db = await getDb();
    const version = await getLatestVersion(db);
    const depot = version?.snapshot.depot;
    if (!depot || depot.lat === null || depot.lng === null) return { ok: false, message: "La position du dépôt n'est pas encore connue (Paramètres → Adresse de départ)." };
    const started = Date.now();
    const leg = await routeBetween({ lat: depot.lat, lng: depot.lng }, { lat: depot.lat + 0.03, lng: depot.lng + 0.03 }, version.snapshot.routing.optimization);
    return {
      ok: true,
      message: `Service disponible (${leg.provider}${leg.fromCache ? ", résultat en mémoire" : ""}) : ${formatKm(leg.km)} en ${formatMinutes(leg.minutes)}, réponse en ${((Date.now() - started) / 1000).toFixed(1).replace(".", ",")} s.`,
    };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: error.message };
    return { ok: false, message: `Aucun service d'itinéraires ne répond pour le moment (${error instanceof Error ? error.message : "erreur"}). Les clients peuvent toujours appeler ou envoyer une demande sans prix.` };
  }
}

export async function testEmailAction(): Promise<ServiceTestResult> {
  try {
    await requireAdminAction();
    const db = await getDb();
    return await sendTestEmail(db);
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: error.message };
    return { ok: false, message: "L'email d'essai n'a pas pu être envoyé." };
  }
}
