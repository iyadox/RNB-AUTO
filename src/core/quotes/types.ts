/**
 * Données d'une estimation telles qu'elles sont enregistrées (photographie) :
 * ce que le client a choisi, puis le contexte résolu par le serveur.
 */
import type { IsoWeekday } from "@/core/calendar/paris";
import type { EngineInput, Legs, ServiceKind } from "@/core/pricing/types";

export type GeoPoint = { lat: number; lng: number };

export type Place = {
  label: string;
  lat: number | null;
  lng: number | null;
  postcode: string | null;
  city: string | null;
  /** gps : position du téléphone ; search : adresse choisie dans les suggestions ; typed : texte libre. */
  source: "gps" | "search" | "typed" | "admin";
};

export type Dropoff = { kind: "address"; place: Place } | { kind: "on_site" } | { kind: "unknown" };

export type When =
  | { kind: "now" }
  /** Simulateur : jour de la semaine + heure (+ jour férié) sans date précise. */
  | { kind: "simulated"; isoWeekday: IsoWeekday; time: string; holiday: boolean };

/** Ce que le client (ou l'administration) a saisi. Jamais de prix. */
export type QuoteRequestInput = {
  pickup: Place & { afterRegulatedRoad: boolean; handoverNote: string | null };
  dropoff: Dropoff;
  vehicleCategory: string;
  situations: string[];
  when: When;
  /** Réservé à l'administration (simulateur) : forcer un prix du carburant ou des distances. */
  overrides?: { fuelPriceTtcMillis?: number; legs?: Legs };
};

export type ResolvedLeg = {
  km: number;
  minutes: number;
  provider: string;
  fromCache: boolean;
};

export type FuelSource = "manual" | "auto" | "last_known" | "override";

/** Contexte résolu par le serveur au moment du calcul. */
export type QuoteContext = {
  computedAt: string;
  local: { date: string | null; time: string; isoWeekday: IsoWeekday; publicHoliday: string | null };
  depot: { label: string; lat: number; lng: number };
  legs: { emptyOut: ResolvedLeg; loaded: ResolvedLeg | null; emptyBack: ResolvedLeg } | null;
  fuel: { priceTtcMillis: number; source: FuelSource; observedAt: string | null; origin: string };
  routingError: string | null;
};

/** Trajet type (distances fixes) utilisé pour mesurer l'effet d'un changement de tarif. */
export type ReferenceScenario = {
  serviceKind: ServiceKind;
  vehicleCategory: string;
  situations: string[];
  legs: Legs;
  isoWeekday: IsoWeekday;
  time: string;
  holiday: boolean;
};

/** Raisons pour lesquelles une demande part sans prix, en plus de celles du moteur. */
export type ServiceHiddenReason =
  | "estimate_disabled"
  | "routing_unavailable"
  | "address_unresolved"
  | "destination_unknown"
  | "depot_unknown";

export const SERVICE_HIDDEN_REASON_MESSAGES: Record<ServiceHiddenReason, string> = {
  estimate_disabled: "Envoyez votre demande : nous vous rappelons très vite avec un prix.",
  routing_unavailable:
    "Nous ne pouvons pas calculer le prix automatiquement pour le moment. Envoyez votre demande : nous vous rappelons avec un prix.",
  address_unresolved:
    "Nous n'avons pas pu situer précisément l'adresse. Envoyez votre demande : nous vous rappelons pour la confirmer.",
  destination_unknown: "Sans destination, nous ne pouvons pas calculer le transport : nous vous rappelons pour en parler.",
  depot_unknown: "Nous ne pouvons pas calculer le prix automatiquement pour le moment. Envoyez votre demande : nous vous rappelons.",
};

export function scenarioToEngineInput(
  scenario: ReferenceScenario,
  fuelPriceTtcMillis: number,
  channel: EngineInput["channel"],
): EngineInput {
  return {
    serviceKind: scenario.serviceKind,
    vehicleCategory: scenario.vehicleCategory,
    situations: scenario.situations,
    legs: scenario.legs,
    local: {
      isoWeekday: scenario.isoWeekday,
      time: scenario.time,
      publicHoliday: scenario.holiday ? "Jour férié" : null,
    },
    fuelPriceTtcMillis,
    channel,
  };
}
