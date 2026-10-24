/**
 * Lien de suivi remis par RNB AUTO depuis l'espace de gestion (demande saisie au téléphone,
 * client qui a perdu son lien…). Même mécanisme que le lien remis par le site : seule
 * l'empreinte du jeton est gardée dans le journal de la demande ; le jeton n'est montré
 * qu'une fois, à la personne connectée qui le crée.
 */
import { randomBytes } from "node:crypto";
import { hashTrackingToken, TRACKING_EVENT } from "@/server/tracking/token";
import { trackingLinkOpen, trackingPath } from "@/server/tracking/view";
import type { DbLike } from "@/server/settings/repository";
import { addEvent, getIntervention, InterventionError, type Actor } from "./service";

export async function issueTrackingLinkByStaff(db: DbLike, interventionId: string, actor: Actor, now = new Date()): Promise<{ path: string; reference: string }> {
  const intervention = await getIntervention(db, interventionId);
  if (!intervention) throw new InterventionError("Demande introuvable.");
  if (!trackingLinkOpen(intervention, now)) throw new InterventionError("Cette demande est close depuis trop longtemps : le suivi n'est plus disponible.");
  const token = randomBytes(24).toString("base64url");
  await addEvent(db, interventionId, actor, {
    type: TRACKING_EVENT,
    message: "Lien de suivi créé pour le client.",
    data: { tokenHash: hashTrackingToken(token) },
  });
  return { path: trackingPath(intervention.reference, token), reference: intervention.reference };
}
