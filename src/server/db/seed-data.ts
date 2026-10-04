/**
 * Données de départ de la base (installation).
 *
 * Valeurs calées sur les prix moyens du dépannage-remorquage en Île-de-France (octobre 2026) :
 * remorquage urbain ≈ 90 à 180 € TTC, majoration de nuit, dimanche et jours fériés ≈ +25 %,
 * gazole ≈ 2,35 €/L. Ce sont des points de départ : tout se modifie dans « Mes tarifs ».
 * Elles ne sont lues qu'une fois, pour remplir une base vide.
 */
import type { PricingRule, Situation, VehicleCategory } from "@/core/pricing/types";
import type { ReferenceScenario } from "@/core/quotes/types";

type SeedRule = Omit<PricingRule, "id">;

const ALL_LEGS: ("emptyOut" | "loaded" | "emptyBack")[] = ["emptyOut", "loaded", "emptyBack"];

export const SEED_VEHICLES: VehicleCategory[] = [
  { code: "citadine", label: "Petite citadine", icon: "citadine", sortOrder: 10, clientVisible: true, acceptance: "accepted", active: true },
  { code: "berline", label: "Berline", icon: "berline", sortOrder: 20, clientVisible: true, acceptance: "accepted", active: true },
  { code: "break", label: "Break", icon: "break", sortOrder: 30, clientVisible: true, acceptance: "accepted", active: true },
  { code: "suv", label: "SUV", icon: "suv", sortOrder: 40, clientVisible: true, acceptance: "accepted", active: true },
  { code: "4x4", label: "4x4", icon: "4x4", sortOrder: 50, clientVisible: true, acceptance: "accepted", active: true },
  { code: "utilitaire", label: "Utilitaire", icon: "utilitaire", sortOrder: 60, clientVisible: true, acceptance: "accepted", active: true },
  { code: "petit_fourgon", label: "Petit fourgon", icon: "petit_fourgon", sortOrder: 70, clientVisible: true, acceptance: "accepted", active: true },
  { code: "grand_fourgon", label: "Grand fourgon", icon: "grand_fourgon", sortOrder: 80, clientVisible: true, acceptance: "on_request", active: true },
  { code: "autre", label: "Autre", icon: "autre", sortOrder: 90, clientVisible: true, acceptance: "on_request", active: true },
];

const VEHICLE_SUPPLEMENT_LABELS: Record<string, string> = {
  citadine: "Supplément petite citadine",
  berline: "Supplément berline",
  break: "Supplément break",
  suv: "Supplément SUV",
  "4x4": "Supplément 4x4",
  utilitaire: "Supplément utilitaire",
  petit_fourgon: "Supplément petit fourgon",
  grand_fourgon: "Supplément grand fourgon",
  autre: "Supplément autre véhicule",
};

/** Supplément par véhicule (TTC). 0 = aucun supplément (règle désactivée). */
const VEHICLE_SUPPLEMENTS: Record<string, number> = {
  citadine: 0,
  berline: 0,
  break: 0,
  suv: 1500,
  "4x4": 2000,
  utilitaire: 2500,
  petit_fourgon: 3000,
  grand_fourgon: 5000,
  autre: 0,
};

export const SEED_SITUATIONS: Situation[] = [
  { code: "battery", label: "Batterie", clientLabel: "Batterie / ne démarre pas", icon: "battery", group: "problem", sortOrder: 10, clientVisible: true, onSitePossible: true, active: true },
  { code: "flat_tire", label: "Crevaison", clientLabel: "Crevaison", icon: "tire", group: "problem", sortOrder: 20, clientVisible: true, onSitePossible: true, active: true },
  { code: "breakdown", label: "Panne mécanique", clientLabel: "Panne mécanique", icon: "engine", group: "problem", sortOrder: 30, clientVisible: true, onSitePossible: false, active: true },
  { code: "accident", label: "Accident", clientLabel: "Accident", icon: "accident", group: "problem", sortOrder: 40, clientVisible: true, onSitePossible: false, active: true },
  { code: "locked_wheels", label: "Roues bloquées", clientLabel: "Roues bloquées", icon: "wheel_lock", group: "problem", sortOrder: 50, clientVisible: true, onSitePossible: false, active: true },
  { code: "other", label: "Autre problème", clientLabel: "Autre problème", icon: "other", group: "problem", sortOrder: 60, clientVisible: true, onSitePossible: true, active: true },
  { code: "rolling", label: "Véhicule roulant", clientLabel: "Le véhicule peut rouler", icon: "rolling", group: "state", sortOrder: 70, clientVisible: true, onSitePossible: true, active: true },
  { code: "non_rolling", label: "Véhicule non roulant", clientLabel: "Le véhicule ne roule pas", icon: "non_rolling", group: "state", sortOrder: 80, clientVisible: true, onSitePossible: false, active: true },
  { code: "parking", label: "Véhicule dans un parking", clientLabel: "Dans un parking", icon: "parking", group: "detail", sortOrder: 90, clientVisible: true, onSitePossible: true, active: true },
  { code: "hard_to_load", label: "Véhicule difficile à charger", clientLabel: "Véhicule difficile à charger", icon: "low_car", group: "detail", sortOrder: 100, clientVisible: false, onSitePossible: false, active: true },
  { code: "winching", label: "Treuillage", clientLabel: "Treuillage", icon: "winch", group: "detail", sortOrder: 110, clientVisible: false, onSitePossible: false, active: true },
  { code: "difficult_access", label: "Accès difficile", clientLabel: "Accès difficile", icon: "access", group: "detail", sortOrder: 120, clientVisible: false, onSitePossible: true, active: true },
  { code: "heavy", label: "Véhicule particulièrement lourd", clientLabel: "Véhicule lourd", icon: "weight", group: "detail", sortOrder: 130, clientVisible: false, onSitePossible: false, active: true },
];

/** Supplément par situation : montant fixe TTC, ou pourcentage (préfixe « % »). */
const SITUATION_SUPPLEMENTS: Record<string, { fixed?: number; percentBp?: number }> = {
  battery: {},
  flat_tire: {},
  breakdown: {},
  accident: { fixed: 2500 },
  locked_wheels: { fixed: 3000 },
  other: {},
  rolling: {},
  non_rolling: { fixed: 1500 },
  parking: { fixed: 2000 },
  hard_to_load: { fixed: 2000 },
  winching: { fixed: 4000 },
  difficult_access: { fixed: 2000 },
  heavy: { percentBp: 2000 },
};

const WEEKDAYS: { code: string; label: string; day: 1 | 2 | 3 | 4 | 5 | 6 | 7; rateBp: number; enabled: boolean }[] = [
  { code: "monday", label: "Lundi", day: 1, rateBp: 0, enabled: false },
  { code: "tuesday", label: "Mardi", day: 2, rateBp: 0, enabled: false },
  { code: "wednesday", label: "Mercredi", day: 3, rateBp: 0, enabled: false },
  { code: "thursday", label: "Jeudi", day: 4, rateBp: 0, enabled: false },
  { code: "friday", label: "Vendredi", day: 5, rateBp: 0, enabled: false },
  { code: "saturday", label: "Samedi", day: 6, rateBp: 0, enabled: false },
  { code: "sunday", label: "Dimanche", day: 7, rateBp: 2500, enabled: true },
];

function base(rule: Omit<SeedRule, "effect" | "system" | "ledger"> & Partial<Pick<SeedRule, "effect" | "ledger">>): SeedRule {
  return {
    effect: "add",
    ledger: rule.category === "internal_cost" ? "internal_cost" : "client_price",
    system: true,
    ...rule,
  };
}

export const SEED_RULES: SeedRule[] = [
  // Prix de base
  base({
    code: "fee.tow",
    label: "Forfait remorquage",
    help: "Prise en charge, chargement et déchargement du véhicule.",
    category: "fee",
    enabled: true,
    calculation: { kind: "fixed", amountCents: 7500 },
    conditions: [{ type: "service_kind", kind: "tow" }],
    priority: 10,
    clientVisible: true,
    clientLabel: "Remorquage",
  }),
  base({
    code: "fee.on_site",
    label: "Forfait dépannage sur place",
    help: "Intervention sans transport : batterie, roue, petite panne.",
    category: "fee",
    enabled: true,
    calculation: { kind: "fixed", amountCents: 5500 },
    conditions: [{ type: "service_kind", kind: "on_site" }],
    priority: 20,
    clientVisible: true,
    clientLabel: "Dépannage sur place",
  }),
  base({
    code: "leg.empty_out",
    label: "Déplacement jusqu'au client",
    help: "Prix au kilomètre lorsque la dépanneuse est vide, du dépôt jusqu'au client.",
    category: "leg",
    enabled: true,
    calculation: { kind: "per_km", centsPerKm: 100, legs: ["emptyOut"], freeKm: 0 },
    conditions: [],
    priority: 30,
    clientVisible: true,
    clientLabel: "Déplacement de la dépanneuse",
  }),
  base({
    code: "leg.loaded",
    label: "Trajet avec le véhicule chargé",
    help: "Prix au kilomètre du lieu de la panne jusqu'à la destination.",
    category: "leg",
    enabled: true,
    calculation: { kind: "per_km", centsPerKm: 220, legs: ["loaded"], freeKm: 0 },
    conditions: [],
    priority: 40,
    clientVisible: true,
    clientLabel: "Transport de votre véhicule",
  }),
  base({
    code: "leg.empty_back",
    label: "Retour au dépôt",
    help: "Prix au kilomètre lorsque la dépanneuse revient vide au dépôt.",
    category: "leg",
    enabled: true,
    calculation: { kind: "per_km", centsPerKm: 50, legs: ["emptyBack"], freeKm: 0 },
    conditions: [],
    priority: 50,
    clientVisible: true,
    clientLabel: "Déplacement de la dépanneuse",
  }),

  // Véhicules
  ...SEED_VEHICLES.map((vehicle, index) =>
    base({
      code: `vehicle.${vehicle.code}`,
      label: VEHICLE_SUPPLEMENT_LABELS[vehicle.code] ?? `Supplément ${vehicle.label}`,
      category: "vehicle",
      enabled: (VEHICLE_SUPPLEMENTS[vehicle.code] ?? 0) > 0,
      calculation: { kind: "fixed", amountCents: VEHICLE_SUPPLEMENTS[vehicle.code] ?? 0 },
      conditions: [{ type: "vehicle_in", categories: [vehicle.code] }],
      priority: 100 + index,
      clientVisible: true,
      clientLabel: VEHICLE_SUPPLEMENT_LABELS[vehicle.code] ?? `Supplément ${vehicle.label}`,
    }),
  ),

  // Situations
  ...SEED_SITUATIONS.map((situation, index) => {
    const supplement = SITUATION_SUPPLEMENTS[situation.code] ?? {};
    const isPercent = supplement.percentBp !== undefined;
    return base({
      code: `situation.${situation.code}`,
      label: situation.label,
      category: "situation",
      enabled: Boolean(supplement.fixed || supplement.percentBp),
      calculation: isPercent
        ? { kind: "percent", rateBp: supplement.percentBp ?? 0, base: "base_price" }
        : { kind: "fixed", amountCents: supplement.fixed ?? 0 },
      conditions: [{ type: "situation_any", codes: [situation.code] }],
      priority: 200 + index,
      clientVisible: true,
      clientLabel: situation.label,
    });
  }),

  // Horaires et jours
  base({
    code: "calendar.night",
    label: "Nuit",
    help: "Majoration appliquée pendant la plage horaire de nuit.",
    category: "time_slot",
    enabled: true,
    calculation: { kind: "percent", rateBp: 2500, base: "full_service" },
    conditions: [{ type: "time_between", start: "22:00", end: "06:00" }],
    priority: 300,
    clientVisible: true,
    clientLabel: "Majoration de nuit",
  }),
  ...WEEKDAYS.map((day) =>
    base({
      code: `calendar.${day.code}`,
      label: day.label,
      category: "day",
      enabled: day.enabled,
      calculation: { kind: "percent", rateBp: day.rateBp, base: "full_service" },
      conditions: [{ type: "weekday_in", days: [day.day] }],
      priority: 310 + day.day,
      clientVisible: true,
      clientLabel: `Majoration ${day.label.toLowerCase()}`,
    }),
  ),
  base({
    code: "calendar.holiday",
    label: "Jours fériés",
    help: "Les jours fériés nationaux sont calculés automatiquement chaque année.",
    category: "holiday",
    enabled: true,
    calculation: { kind: "percent", rateBp: 2500, base: "full_service" },
    conditions: [{ type: "public_holiday" }],
    priority: 320,
    clientVisible: true,
    clientLabel: "Majoration jour férié",
  }),

  // Coûts internes (jamais montrés au client)
  base({
    code: "cost.fuel",
    label: "Carburant",
    help: "Litres consommés sur les 3 trajets × prix du litre.",
    category: "internal_cost",
    enabled: true,
    calculation: { kind: "fuel" },
    conditions: [],
    priority: 400,
    clientVisible: false,
    clientLabel: null,
  }),
  base({
    code: "cost.wear",
    label: "Usure et entretien",
    help: "Pneus, freins, vidanges, entretien courant.",
    category: "internal_cost",
    enabled: true,
    calculation: { kind: "per_km", centsPerKm: 12, legs: ALL_LEGS, freeKm: 0 },
    conditions: [],
    priority: 410,
    clientVisible: false,
    clientLabel: null,
  }),
  base({
    code: "cost.depreciation",
    label: "Amortissement de la dépanneuse",
    help: "Usure de la valeur du véhicule, répartie par kilomètre.",
    category: "internal_cost",
    enabled: true,
    calculation: { kind: "per_km", centsPerKm: 20, legs: ALL_LEGS, freeKm: 0 },
    conditions: [],
    priority: 420,
    clientVisible: false,
    clientLabel: null,
  }),
  base({
    code: "cost.overhead",
    label: "Assurance et frais généraux",
    help: "Par intervention : assurance, téléphone, comptabilité…",
    category: "internal_cost",
    enabled: true,
    calculation: { kind: "fixed", amountCents: 1000 },
    conditions: [],
    priority: 430,
    clientVisible: false,
    clientLabel: null,
  }),
  base({
    code: "cost.labor",
    label: "Temps de travail",
    help: "Conduite des 3 trajets + chargement et déchargement.",
    category: "internal_cost",
    enabled: true,
    calculation: { kind: "per_hour", centsPerHour: 2500, includeHandling: true },
    conditions: [],
    priority: 440,
    clientVisible: false,
    clientLabel: null,
  }),
];

/** Trajets types (distances fixes) pour mesurer l'effet d'un changement de tarif. */
export const SEED_REFERENCE_TRIPS: { name: string; scenario: ReferenceScenario }[] = [
  {
    name: "Batterie à Drancy · mardi 10 h",
    scenario: {
      serviceKind: "on_site",
      vehicleCategory: "citadine",
      situations: ["battery"],
      legs: { emptyOut: { km: 4.2, minutes: 11 }, loaded: null, emptyBack: { km: 4.2, minutes: 11 } },
      isoWeekday: 2,
      time: "10:00",
      holiday: false,
    },
  },
  {
    name: "Panne à Pantin → garage à Bobigny · jeudi 15 h",
    scenario: {
      serviceKind: "tow",
      vehicleCategory: "berline",
      situations: ["breakdown", "non_rolling"],
      legs: { emptyOut: { km: 5.8, minutes: 14 }, loaded: { km: 6.1, minutes: 15 }, emptyBack: { km: 1.9, minutes: 6 } },
      isoWeekday: 4,
      time: "15:00",
      holiday: false,
    },
  },
  {
    name: "Paris 11e → Paris 15e · samedi 17 h",
    scenario: {
      serviceKind: "tow",
      vehicleCategory: "berline",
      situations: ["breakdown", "rolling"],
      legs: { emptyOut: { km: 10.5, minutes: 27 }, loaded: { km: 9.2, minutes: 30 }, emptyBack: { km: 14.8, minutes: 34 } },
      isoWeekday: 6,
      time: "17:00",
      holiday: false,
    },
  },
  {
    name: "Accident à Saint-Denis → Bobigny · mardi 2 h",
    scenario: {
      serviceKind: "tow",
      vehicleCategory: "berline",
      situations: ["accident", "non_rolling"],
      legs: { emptyOut: { km: 8.4, minutes: 16 }, loaded: { km: 9, minutes: 18 }, emptyBack: { km: 1.5, minutes: 5 } },
      isoWeekday: 2,
      time: "02:00",
      holiday: false,
    },
  },
  {
    name: "Cergy → Montreuil, SUV non roulant · dimanche 23 h",
    scenario: {
      serviceKind: "tow",
      vehicleCategory: "suv",
      situations: ["breakdown", "non_rolling"],
      legs: { emptyOut: { km: 38, minutes: 40 }, loaded: { km: 45, minutes: 50 }, emptyBack: { km: 8, minutes: 15 } },
      isoWeekday: 7,
      time: "23:00",
      holiday: false,
    },
  },
];

/** Exemple affiché sur la page d'accueil (calculé avec les tarifs en vigueur). */
export const HOME_EXAMPLE_SCENARIO: ReferenceScenario = {
  serviceKind: "tow",
  vehicleCategory: "citadine",
  situations: ["breakdown"],
  legs: { emptyOut: { km: 6, minutes: 15 }, loaded: { km: 10, minutes: 22 }, emptyBack: { km: 8, minutes: 18 } },
  isoWeekday: 2,
  time: "14:00",
  holiday: false,
};
