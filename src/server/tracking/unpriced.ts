/**
 * Repli quand le calcul de l'estimation échoue (service d'itinéraires, carburant, erreur
 * imprévue…) : on enregistre quand même la demande du client, SANS prix, pour qu'il puisse
 * l'envoyer. RNB AUTO le rappelle avec un prix (« Calculer le prix » dans l'administration).
 * Une panne ne doit jamais empêcher un client d'envoyer sa demande (CLAUDE.md).
 */
import type { ClientEstimate } from "@/core/quotes/client-view";
import type { QuoteRequestInput } from "@/core/quotes/types";
import { quotes } from "@/server/db/schema";
import type { DbLike } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

/** Motif enregistré sur l'estimation (lu par l'administration : « Pas encore de prix »). */
export const UNPRICED_REASON = "estimate_error";

export const UNPRICED_MESSAGE =
  "Le calcul automatique du prix ne répond pas pour le moment. Envoyez votre demande : nous vous rappelons avec un prix.";

/** Durée de validité de cette estimation vide (minutes) : le temps de remplir les coordonnées. */
const UNPRICED_VALIDITY_MINUTES = 120;

export async function createUnpricedEstimate(db: DbLike, input: QuoteRequestInput): Promise<ClientEstimate> {
  const version = await getLatestVersion(db).catch(() => null);
  const [row] = await db
    .insert(quotes)
    .values({
      source: "web",
      status: "estimated",
      input,
      context: null,
      result: null,
      hiddenReason: UNPRICED_REASON,
      configVersionId: version?.id ?? null,
      engineVersion: null,
      priceTtcCents: null,
      priceHtCents: null,
      clientPriceTtcCents: null,
      expiresAt: new Date(Date.now() + UNPRICED_VALIDITY_MINUTES * 60_000),
    })
    .returning({ id: quotes.id });
  if (!row) throw new Error("Estimation vide non enregistrée.");
  return {
    quoteId: row.id,
    priceTtcCents: null,
    message: UNPRICED_MESSAGE,
    includedLabels: [],
    vehicleTripKm: null,
    approachKm: null,
    serviceKind: input.dropoff.kind === "on_site" ? "on_site" : input.dropoff.kind === "address" ? "tow" : "unknown",
    validUntil: null,
  };
}
