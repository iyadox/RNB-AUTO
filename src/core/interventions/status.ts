/** Statuts d'une intervention et transitions autorisées (déclarées uniquement ici). */
import type { IconName } from "@/components/ui/icon";

export const STATUSES = [
  "new",
  "to_call_back",
  "accepted",
  "en_route",
  "arrived",
  "loaded",
  "in_transit",
  "completed",
  "cancelled",
] as const;

export type InterventionStatus = (typeof STATUSES)[number];

export const STATUS_META: Record<
  InterventionStatus,
  { label: string; action: string; tone: "info" | "warn" | "good" | "progress" | "done" | "muted"; icon: IconName }
> = {
  new: { label: "Nouvelle demande", action: "Nouvelle demande", tone: "info", icon: "sparkles" },
  to_call_back: { label: "À rappeler", action: "À rappeler", tone: "warn", icon: "phone" },
  accepted: { label: "Acceptée", action: "Accepter", tone: "good", icon: "checkCircle" },
  en_route: { label: "Dépanneuse en route", action: "Je pars", tone: "progress", icon: "truck" },
  arrived: { label: "Arrivée sur place", action: "Je suis arrivé", tone: "progress", icon: "pin" },
  loaded: { label: "Véhicule chargé", action: "Véhicule chargé", tone: "progress", icon: "check" },
  in_transit: { label: "Transport en cours", action: "Transport en cours", tone: "progress", icon: "route" },
  completed: { label: "Terminée", action: "Terminer", tone: "done", icon: "flag" },
  cancelled: { label: "Annulée", action: "Annuler", tone: "muted", icon: "x" },
};

/** Déroulement normal. Sauter une étape reste possible avec confirmation (saisie après coup). */
const FLOW: Record<InterventionStatus, InterventionStatus[]> = {
  new: ["to_call_back", "accepted", "cancelled"],
  to_call_back: ["accepted", "cancelled"],
  accepted: ["en_route", "to_call_back", "cancelled"],
  en_route: ["arrived", "cancelled"],
  arrived: ["loaded", "completed", "cancelled"],
  loaded: ["in_transit"],
  in_transit: ["completed"],
  completed: [],
  cancelled: [],
};

export function isTerminal(status: InterventionStatus): boolean {
  return status === "completed" || status === "cancelled";
}

export function allowedTransitions(status: InterventionStatus): InterventionStatus[] {
  return FLOW[status];
}

/** Prochaine étape principale (gros bouton), selon remorquage ou dépannage sur place. */
export function primaryNextStatus(status: InterventionStatus, serviceKind: "tow" | "on_site" | "unknown"): InterventionStatus | null {
  switch (status) {
    case "new":
    case "to_call_back":
      return "accepted";
    case "accepted":
      return "en_route";
    case "en_route":
      return "arrived";
    case "arrived":
      return serviceKind === "on_site" ? "completed" : "loaded";
    case "loaded":
      return "in_transit";
    case "in_transit":
      return "completed";
    default:
      return null;
  }
}

/** Une transition hors du déroulement normal demande une confirmation (et reste tracée). */
export function isStandardTransition(from: InterventionStatus, to: InterventionStatus): boolean {
  return FLOW[from].includes(to);
}

export function canTransition(from: InterventionStatus, to: InterventionStatus, force: boolean): boolean {
  if (from === to || isTerminal(from)) return false;
  if (isStandardTransition(from, to)) return true;
  if (!force) return false;
  // En forçant : on peut avancer (saisie après coup) ou annuler, jamais revenir à « Nouvelle demande ».
  return to !== "new" && STATUSES.indexOf(to) > STATUSES.indexOf(from);
}

export const CANCEL_REASONS = [
  "Annulée par le client",
  "Client injoignable",
  "Hors zone",
  "Véhicule non transportable",
  "Doublon",
  "Autre",
] as const;

export const TIMESTAMP_FIELDS: Partial<Record<InterventionStatus, string>> = {
  accepted: "acceptedAt",
  en_route: "enRouteAt",
  arrived: "arrivedAt",
  loaded: "loadedAt",
  in_transit: "inTransitAt",
  completed: "completedAt",
  cancelled: "cancelledAt",
};
