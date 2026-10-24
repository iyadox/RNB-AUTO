/**
 * Jeton du lien de suivi d'une demande (`/suivi/<référence>?t=<jeton>`).
 *
 * - Jeton aléatoire de 192 bits, remis UNE fois au client (écran « Demande reçue », email).
 * - Seule son empreinte SHA-256 est gardée, dans le journal de la demande (événement « tracking »,
 *   champ `data.tokenHash`) : aucune colonne nouvelle, et le journal montre à RNB AUTO quand le
 *   lien a été créé. Le jeton lui-même n'est jamais enregistré ni écrit dans les journaux.
 * - La recherche passe par la référence (index unique) puis par l'empreinte : un jeton d'une
 *   autre demande ne donne rien.
 */
import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { interventionEvents, interventions } from "@/server/db/schema";
import { addEvent, type Intervention } from "@/server/interventions/service";
import type { DbLike } from "@/server/settings/repository";
import { REFERENCE_PATTERN, TOKEN_PATTERN, trackingLinkOpen } from "./view";

export const TRACKING_EVENT = "tracking";

export function hashTrackingToken(token: string): string {
  return createHash("sha256").update(`suivi:${token}`).digest("hex");
}

/** Crée le lien de suivi d'une demande et renvoie le jeton (à remettre au client, une seule fois). */
export async function issueTrackingToken(db: DbLike, interventionId: string): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await addEvent(db, interventionId, { userId: null, label: "Client (site)" }, {
    type: TRACKING_EVENT,
    message: "Lien de suivi remis au client.",
    data: { tokenHash: hashTrackingToken(token) },
  });
  return token;
}

export type TrackingLookup =
  | { ok: true; intervention: Intervention }
  | { ok: false; reason: "invalid" | "expired" };

/**
 * Retrouve la demande d'un lien de suivi. `invalid` : référence ou jeton faux (on ne dit pas
 * lequel) ; `expired` : bon lien, mais la demande est close depuis trop longtemps.
 */
export async function findTrackedIntervention(db: DbLike, reference: string, token: string, now = new Date()): Promise<TrackingLookup> {
  if (!REFERENCE_PATTERN.test(reference) || !TOKEN_PATTERN.test(token)) return { ok: false, reason: "invalid" };
  const [intervention] = await db.select().from(interventions).where(eq(interventions.reference, reference)).limit(1);
  if (!intervention) return { ok: false, reason: "invalid" };
  const [match] = await db
    .select({ id: interventionEvents.id })
    .from(interventionEvents)
    .where(
      and(
        eq(interventionEvents.interventionId, intervention.id),
        eq(interventionEvents.type, TRACKING_EVENT),
        sql`${interventionEvents.data}->>'tokenHash' = ${hashTrackingToken(token)}`,
      ),
    )
    .orderBy(desc(interventionEvents.at))
    .limit(1);
  if (!match) return { ok: false, reason: "invalid" };
  if (!trackingLinkOpen(intervention, now)) return { ok: false, reason: "expired" };
  return { ok: true, intervention };
}
