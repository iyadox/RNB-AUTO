/**
 * Suivi client d'une demande : ce que la page `/suivi/<référence>` a le droit de montrer.
 *
 * Logique PURE (aucun accès base ni réseau, même entrée = même sortie, testée dans `view.test.ts`).
 * La page est accessible à toute personne qui a le lien (le client peut le partager à un proche) :
 * on n'y met donc AUCUNE donnée personnelle (ni nom, ni téléphone, ni immatriculation, ni adresse
 * complète, ni note interne) : seulement le statut, ses heures, la ville, le type de véhicule et le
 * prix annoncé. Aucun délai n'est inventé : on dit ce qui se passe, jamais « dans 12 minutes ».
 */
import { isTerminal, STATUSES, type InterventionStatus } from "@/core/interventions/status";

/** Durées techniques du lien de suivi (pas des valeurs commerciales). */
export const TRACKING_LIMITS = {
  /** Le lien reste ouvert ce nombre de jours après la fin (ou l'annulation) de l'intervention. */
  daysAfterClosure: 7,
  /** Durée de vie maximale du lien, quoi qu'il arrive. */
  maxDays: 60,
  /** Intervalle d'actualisation de la page ouverte (millisecondes). */
  refreshMs: 20_000,
} as const;

const DAY_MS = 24 * 3_600_000;

/** Étapes vues par le client (plus simples que les statuts de l'administration). */
export type TrackingPhase = "received" | "callback" | "confirmed" | "en_route" | "arrived" | "transport" | "completed" | "cancelled";

/** Étapes de la frise. « callback » (on essaie de vous joindre) reste sur « Reçue ». */
export type TrackingStepKey = "received" | "confirmed" | "en_route" | "arrived" | "transport" | "completed";

export const PHASE_OF_STATUS: Record<InterventionStatus, TrackingPhase> = {
  new: "received",
  to_call_back: "callback",
  accepted: "confirmed",
  en_route: "en_route",
  arrived: "arrived",
  loaded: "transport",
  in_transit: "transport",
  completed: "completed",
  cancelled: "cancelled",
};

const STEP_OF_PHASE: Record<TrackingPhase, TrackingStepKey | null> = {
  received: "received",
  callback: "received",
  confirmed: "confirmed",
  en_route: "en_route",
  arrived: "arrived",
  transport: "transport",
  completed: "completed",
  cancelled: null,
};

export const STEP_TEXT: Record<TrackingStepKey, string> = {
  received: "Reçue",
  confirmed: "Confirmée",
  en_route: "En route",
  arrived: "Sur place",
  transport: "Transport",
  completed: "Terminée",
};

export type ServiceKind = "tow" | "on_site" | "unknown";

/** Textes de chaque étape. `led` : panneau à messages (majuscules, 2 lignes de 26 signes au plus). */
export const PHASE_COPY: Record<TrackingPhase, { title: string; text: (kind: ServiceKind) => string; led: readonly [string, string] }> = {
  received: {
    title: "Demande reçue",
    text: () => "Nous vous rappelons pour confirmer le prix et organiser l'intervention. Gardez votre téléphone près de vous.",
    led: ["DEMANDE REÇUE", "ON VOUS RAPPELLE"],
  },
  callback: {
    title: "Nous essayons de vous joindre",
    text: () => "Nous n'avons pas encore réussi à vous joindre. Gardez votre téléphone près de vous, ou appelez-nous.",
    led: ["DEMANDE REÇUE", "ON ESSAIE DE VOUS JOINDRE"],
  },
  confirmed: {
    title: "Intervention confirmée",
    text: () => "La dépanneuse se prépare. Cette page change dès qu'elle part vers vous.",
    led: ["INTERVENTION", "CONFIRMÉE"],
  },
  en_route: {
    title: "La dépanneuse est en route",
    text: () => "Elle roule vers vous. Restez en sécurité, hors de la chaussée, et gardez votre téléphone près de vous.",
    led: ["DÉPANNEUSE", "EN ROUTE"],
  },
  arrived: {
    title: "La dépanneuse est sur place",
    text: (kind) => (kind === "on_site" ? "Le dépanneur s'occupe de votre véhicule." : "Le dépanneur prend en charge votre véhicule."),
    led: ["DÉPANNEUSE", "SUR PLACE"],
  },
  transport: {
    title: "Votre véhicule est transporté",
    text: () => "Il est chargé sur la dépanneuse et roule vers sa destination.",
    led: ["VÉHICULE CHARGÉ", "TRANSPORT EN COURS"],
  },
  completed: {
    title: "Intervention terminée",
    text: (kind) => (kind === "on_site" ? "Le dépannage est terminé. Merci de votre confiance." : "Votre véhicule est arrivé. Merci de votre confiance."),
    led: ["INTERVENTION", "TERMINÉE"],
  },
  cancelled: {
    title: "Demande annulée",
    text: () => "Cette demande a été annulée. Si c'est une erreur, ou si vous avez encore besoin d'aide, appelez-nous.",
    led: ["DEMANDE", "ANNULÉE"],
  },
};

const RECEIVED_WITHOUT_PRICE =
  "Nous vous rappelons pour vous donner le prix et organiser l'intervention. Gardez votre téléphone près de vous.";

export type TrackingSource = {
  reference: string;
  status: string;
  dropoffKind: string;
  pickupCity: string | null;
  pickupPostcode: string | null;
  pickupAfterRegulatedRoad: boolean;
  dropoffCity: string | null;
  dropoffPostcode: string | null;
  vehicleLabel: string | null;
  estimatedPriceCents: number | null;
  confirmedPriceCents: number | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
};

export type TrackingStep = { key: TrackingStepKey; label: string; state: "done" | "current" | "next"; at: Date | null };

export type TrackingPrice =
  | { kind: "confirmed"; cents: number }
  | { kind: "estimated"; cents: number }
  | { kind: "on_call" };

export type TrackingView = {
  reference: string;
  phase: TrackingPhase;
  serviceKind: ServiceKind;
  title: string;
  text: string;
  led: readonly [string, string];
  steps: TrackingStep[];
  /**
   * Position de la dépanneuse sur la route du suivi : 0 au dépôt, 1 chez vous, 2 à destination
   * (remorquage). Les demi-valeurs sont « en chemin ». `null` : annulée (aucune dépanneuse).
   */
  truckAt: number | null;
  /** La dépanneuse porte le véhicule (transport, terminée en remorquage). */
  truckLoaded: boolean;
  /** Arrêts de la route du suivi : dépôt, vous, destination (absente en dépannage sur place). */
  stops: { key: "depot" | "pickup" | "dropoff"; label: string }[];
  pickupLabel: string | null;
  destinationLabel: string;
  vehicleLabel: string | null;
  afterRegulatedRoad: boolean;
  price: TrackingPrice;
  closed: boolean;
  /** Le client peut encore ajouter des photos (demande non clôturée). */
  photosAllowed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function serviceKindOf(dropoffKind: string): ServiceKind {
  return dropoffKind === "on_site" ? "on_site" : dropoffKind === "address" ? "tow" : "unknown";
}

function toStatus(value: string): InterventionStatus {
  return (STATUSES as readonly string[]).includes(value) ? (value as InterventionStatus) : "new";
}

/** Le lien de suivi est-il encore ouvert ? (Ouvert tant que la demande est en cours, puis quelques jours.) */
export function trackingLinkOpen(source: Pick<TrackingSource, "status" | "createdAt" | "updatedAt" | "completedAt" | "cancelledAt">, now: Date): boolean {
  if (now.getTime() - source.createdAt.getTime() > TRACKING_LIMITS.maxDays * DAY_MS) return false;
  const status = toStatus(source.status);
  if (!isTerminal(status)) return true;
  const closedAt = source.completedAt ?? source.cancelledAt ?? source.updatedAt;
  return now.getTime() - closedAt.getTime() <= TRACKING_LIMITS.daysAfterClosure * DAY_MS;
}

/** Étapes de la frise, selon remorquage ou dépannage sur place. */
export function trackingSteps(kind: ServiceKind): TrackingStepKey[] {
  return kind === "on_site"
    ? ["received", "confirmed", "en_route", "arrived", "completed"]
    : ["received", "confirmed", "en_route", "arrived", "transport", "completed"];
}

const place = (city: string | null, postcode: string | null): string | null =>
  city ? (postcode ? `${city} (${postcode})` : city) : postcode;

/** Position de la dépanneuse sur la route du suivi (voir `TrackingView.truckAt`). */
export function truckPosition(phase: TrackingPhase, kind: ServiceKind): number | null {
  switch (phase) {
    case "received":
    case "callback":
    case "confirmed":
      return 0;
    case "en_route":
      return 0.5;
    case "arrived":
      return 1;
    case "transport":
      return 1.5;
    case "completed":
      return kind === "on_site" ? 1 : 2;
    case "cancelled":
      return null;
  }
}

/**
 * Construit la vue publique du suivi.
 * `history` : statuts successifs avec leur heure (du plus ancien au plus récent), lus dans le
 * journal ; on garde pour chaque étape la PREMIÈRE heure où elle a été atteinte.
 */
export function buildTrackingView(source: TrackingSource, history: { status: string; at: Date }[]): TrackingView {
  const status = toStatus(source.status);
  const phase = PHASE_OF_STATUS[status];
  const kind = serviceKindOf(source.dropoffKind);
  const keys = trackingSteps(kind);
  const firstAt = new Map<TrackingStepKey, Date>();
  for (const entry of history) {
    const step = STEP_OF_PHASE[PHASE_OF_STATUS[toStatus(entry.status)]];
    if (step && !firstAt.has(step)) firstAt.set(step, entry.at);
  }
  if (!firstAt.has("received")) firstAt.set("received", source.createdAt);

  // Étape courante. Sur place mais statut de remorquage (saisie après coup) : « Sur place ».
  const currentStep = STEP_OF_PHASE[phase];
  let currentIndex = currentStep ? keys.indexOf(currentStep) : -1;
  if (currentStep && currentIndex < 0) currentIndex = keys.indexOf("arrived");
  const cancelled = phase === "cancelled";
  // Annulée : les étapes franchies avant l'annulation restent cochées.
  const reached = cancelled ? Math.max(...keys.map((key, index) => (firstAt.has(key) ? index : -1))) : currentIndex;

  const steps: TrackingStep[] = keys.map((key, index) => ({
    key,
    label: STEP_TEXT[key],
    state: cancelled ? (index <= reached ? "done" : "next") : index < currentIndex ? "done" : index === currentIndex ? (phase === "completed" ? "done" : "current") : "next",
    at: index <= (cancelled ? reached : currentIndex) ? (firstAt.get(key) ?? null) : null,
  }));

  const destinationLabel =
    kind === "on_site" ? "Dépannage sur place" : kind === "tow" ? (place(source.dropoffCity, source.dropoffPostcode) ?? "Adresse indiquée") : "À préciser avec vous";

  const copy = PHASE_COPY[phase];
  const price: TrackingPrice =
    source.confirmedPriceCents !== null
      ? { kind: "confirmed", cents: source.confirmedPriceCents }
      : source.estimatedPriceCents !== null
        ? { kind: "estimated", cents: source.estimatedPriceCents }
        : { kind: "on_call" };

  const closed = isTerminal(status);
  return {
    reference: source.reference,
    phase,
    serviceKind: kind,
    title: copy.title,
    // Demande sans prix (hors zone, autoroute, calcul en panne…) : on rappelle pour DONNER le prix.
    text: phase === "received" && price.kind === "on_call" ? RECEIVED_WITHOUT_PRICE : copy.text(kind),
    led: copy.led,
    steps,
    truckAt: truckPosition(phase, kind),
    truckLoaded: kind !== "on_site" && (phase === "transport" || phase === "completed"),
    stops: [
      { key: "depot", label: "Dépôt" },
      { key: "pickup", label: "Vous" },
      ...(kind === "on_site" ? [] : [{ key: "dropoff" as const, label: "Destination" }]),
    ],
    pickupLabel: place(source.pickupCity, source.pickupPostcode),
    destinationLabel,
    vehicleLabel: source.vehicleLabel,
    afterRegulatedRoad: source.pickupAfterRegulatedRoad,
    price,
    closed,
    photosAllowed: !closed,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
}

/** Adresse (chemin) de la page de suivi. Le jeton n'est jamais enregistré en clair. */
export function trackingPath(reference: string, token: string): string {
  return `/suivi/${encodeURIComponent(reference)}?t=${encodeURIComponent(token)}`;
}

/** Forme attendue d'une référence (RNB-2026-00001) et d'un jeton (base64url). */
export const REFERENCE_PATTERN = /^[A-Z]{2,8}-\d{4}-\d{3,8}$/;
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;
