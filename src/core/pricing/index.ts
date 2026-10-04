export * from "./types";
export { computeQuote, ENGINE_VERSION, EngineInputError, marginLevelOf } from "./engine";
export { applyAdjustments, adjustmentToReachPrice } from "./adjustments";
export { PRICE_PIPELINE } from "./pipeline";
export { isTimeInRange } from "./conditions";
export { roundingLabel } from "./stages";

import type { HiddenReason, MarginLevel } from "./types";

/** Message affiché au client quand aucun prix automatique n'est proposé. */
export const HIDDEN_REASON_CLIENT_MESSAGES: Record<HiddenReason, string> = {
  vehicle_on_request:
    "Pour ce type de véhicule, nous préférons vous donner un prix après un rapide échange : nous vous rappelons dans quelques minutes.",
  vehicle_refused: "Ce type de véhicule ne peut pas être pris en charge par notre dépanneuse. Appelez-nous pour être orienté.",
  vehicle_unknown: "Nous n'avons pas pu identifier le véhicule. Envoyez votre demande : nous vous rappelons avec un prix.",
  out_of_zone_approach:
    "Vous êtes assez loin de notre dépôt : nous vous rappelons pour vous donner un prix précis et un délai réaliste.",
  out_of_zone_transport:
    "Le trajet demandé est long : nous vous rappelons pour vous donner un prix précis.",
  not_profitable: "Nous vous rappelons pour vous donner un prix précis pour ce trajet.",
};

export const MARGIN_LEVEL_LABELS: Record<MarginLevel, { label: string; tone: "good" | "warn" | "bad" | "danger" }> = {
  ok: { label: "Rentable", tone: "good" },
  below_target: { label: "Marge faible", tone: "warn" },
  below_minimum: { label: "Marge très faible", tone: "bad" },
  loss: { label: "Vendue à perte", tone: "danger" },
};
