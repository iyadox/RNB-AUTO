/**
 * REGISTRE DES RÉGLAGES — chaque réglage n'existe qu'ici.
 *
 * Pour chaque réglage : libellé français, aide, type de saisie, bornes, niveau (simple / avancé)
 * et valeur de départ. À partir de ce registre sont produits : les champs de l'administration,
 * la validation (navigateur ET serveur) et les libellés de l'historique.
 *
 * Valeurs de départ : moyennes observées en Île-de-France (octobre 2026), utilisées UNIQUEMENT
 * pour initialiser la base. Le moteur ne lit jamais ce fichier : il reçoit les valeurs enregistrées.
 * Tout se modifie dans l'administration.
 */

export type SectionId =
  | "base"
  | "schedule"
  | "fuel"
  | "costs"
  | "margin"
  | "rounding"
  | "vat"
  | "estimate"
  | "zone"
  | "depot"
  | "routing"
  | "company"
  | "site"
  | "legal"
  | "notifications";

export type Level = "simple" | "advanced";

export type SectionMeta = {
  label: string;
  description: string;
  /** « pricing » : écran Mes tarifs ; « settings » : écran Paramètres. */
  area: "pricing" | "settings";
  level: Level;
  /** Les valeurs entrent dans la photographie des tarifs (version). */
  snapshot: boolean;
};

export const SECTIONS: Record<SectionId, SectionMeta> = {
  base: { label: "Prix de base", description: "Forfaits, prix au kilomètre et prix minimum.", area: "pricing", level: "simple", snapshot: true },
  schedule: { label: "Horaires et jours", description: "Nuit, dimanche, jours fériés et règles de cumul.", area: "pricing", level: "simple", snapshot: true },
  fuel: { label: "Carburant", description: "Consommation de la dépanneuse et prix du litre.", area: "pricing", level: "simple", snapshot: true },
  costs: { label: "Coûts internes", description: "Ce que coûte réellement une intervention. Jamais montré au client.", area: "pricing", level: "advanced", snapshot: true },
  margin: { label: "Marge", description: "Marge minimale, marge visée et garde-fous.", area: "pricing", level: "advanced", snapshot: true },
  rounding: { label: "Arrondi", description: "Arrondir le prix affiché au client.", area: "pricing", level: "advanced", snapshot: true },
  vat: { label: "TVA", description: "Taux de TVA et prix saisis TTC ou HT.", area: "pricing", level: "advanced", snapshot: true },
  estimate: { label: "Estimation en ligne", description: "Ce que voit le client sur le site.", area: "pricing", level: "simple", snapshot: true },
  zone: { label: "Zone d'intervention", description: "Distances maximales et autoroutes.", area: "settings", level: "simple", snapshot: true },
  depot: { label: "Adresse de départ", description: "Le dépôt d'où part et où revient la dépanneuse.", area: "settings", level: "simple", snapshot: true },
  routing: { label: "Calcul des trajets", description: "Façon de calculer les itinéraires.", area: "settings", level: "advanced", snapshot: true },
  company: { label: "Entreprise", description: "Nom, téléphone, WhatsApp, email, disponibilité.", area: "settings", level: "simple", snapshot: false },
  site: { label: "Site internet", description: "Message temporaire et affichages.", area: "settings", level: "simple", snapshot: false },
  legal: { label: "Mentions légales", description: "Informations obligatoires affichées sur le site.", area: "settings", level: "simple", snapshot: false },
  notifications: { label: "Notifications", description: "Qui est prévenu des nouvelles demandes.", area: "settings", level: "simple", snapshot: false },
};

type Common = { section: SectionId; label: string; help?: string; level: Level };

export type ToggleDef = Common & { input: "toggle"; initialValue: boolean };

/**
 * money : centimes · fuel_price : millièmes d'euro/L · percent : points de base (1 % = 100)
 * decimal : nombre à virgule · integer : nombre entier
 */
export type NumberInput = "money" | "fuel_price" | "percent" | "decimal" | "integer";

export type NumberDef = Common & {
  input: NumberInput;
  initialValue: number;
  /** Bornes dures : valeur refusée en dehors. */
  min: number;
  max: number;
  /** Bornes souples : confirmation demandée en dehors. */
  softMin?: number;
  softMax?: number;
  unit?: string;
  decimals?: number;
};

export type ChoiceOption<V extends string> = { value: V; label: string; help?: string };
export type ChoiceDef<V extends string = string> = Common & {
  input: "choice";
  initialValue: V;
  options: readonly ChoiceOption<V>[];
};

export type TextDef = Common & {
  input: "text" | "textarea" | "phone" | "email";
  initialValue: string;
  maxLength: number;
  placeholder?: string;
  /** Affiche « À COMPLÉTER » tant que la valeur est vide. */
  toComplete?: boolean;
};

export type AddressValue = {
  label: string;
  lat: number | null;
  lng: number | null;
  postcode: string | null;
  city: string | null;
  /** Position vérifiée (géocodée et confirmée). */
  confirmed: boolean;
};

export type AddressDef = Common & { input: "address"; initialValue: AddressValue };
export type HolidaysDisabledDef = Common & { input: "holidays_disabled"; initialValue: string[] };
export type HolidaysCustomDef = Common & { input: "holidays_custom"; initialValue: { date: string; label: string }[] };

export type SettingDef =
  | ToggleDef
  | NumberDef
  | ChoiceDef
  | TextDef
  | AddressDef
  | HolidaysDisabledDef
  | HolidaysCustomDef;

const toggle = (def: Omit<ToggleDef, "input">): ToggleDef => ({ input: "toggle", ...def });
const num = (input: NumberInput, def: Omit<NumberDef, "input">): NumberDef => ({ input, ...def });
const choice = <const V extends string>(def: Omit<ChoiceDef<V>, "input">): ChoiceDef<V> => ({ input: "choice", ...def });
const text = (input: TextDef["input"], def: Omit<TextDef, "input">): TextDef => ({ input, ...def });

export const SETTINGS = {
  // ─── Prix de base ───────────────────────────────────────────────────────────
  "pricing.minimum.enabled": toggle({
    section: "base",
    level: "simple",
    label: "Prix minimum d'une intervention",
    help: "Le client ne paiera jamais moins que ce montant, même pour un trajet très court.",
    initialValue: true,
  }),
  "pricing.minimum.amountCents": num("money", {
    section: "base",
    level: "simple",
    label: "Montant minimum",
    initialValue: 4500,
    min: 0,
    max: 100_000,
    softMax: 30_000,
  }),
  "pricing.distance.billingPrecision": choice({
    section: "base",
    level: "advanced",
    label: "Kilomètres facturés",
    help: "Comment compter les kilomètres de chaque trajet.",
    initialValue: "tenth",
    options: [
      { value: "tenth", label: "Au dixième de km (12,3 km)" },
      { value: "ceil", label: "Au km supérieur (13 km)" },
    ],
  }),

  // ─── Horaires et jours ──────────────────────────────────────────────────────
  "pricing.calendar.referenceTime": choice({
    section: "schedule",
    level: "advanced",
    label: "Heure prise en compte pour les majorations",
    initialValue: "request",
    options: [
      { value: "request", label: "L'heure de la demande" },
      { value: "arrival", label: "L'heure d'arrivée estimée de la dépanneuse" },
    ],
  }),
  "pricing.stacking.days": choice({
    section: "schedule",
    level: "advanced",
    label: "Si c'est à la fois un jour majoré (dimanche…) et un jour férié",
    initialValue: "max",
    options: [
      { value: "max", label: "Appliquer seulement la plus élevée" },
      { value: "sum", label: "Additionner les deux" },
    ],
  }),
  "pricing.stacking.timeSlots": choice({
    section: "schedule",
    level: "advanced",
    label: "Si deux plages horaires se chevauchent",
    initialValue: "max",
    options: [
      { value: "max", label: "Appliquer seulement la plus élevée" },
      { value: "sum", label: "Additionner les deux" },
    ],
  }),
  "pricing.stacking.combined": choice({
    section: "schedule",
    level: "advanced",
    label: "La nuit s'ajoute-t-elle au dimanche ou à un jour férié ?",
    help: "Exemple : un dimanche à 23 h.",
    initialValue: "max",
    options: [
      { value: "max", label: "Non, appliquer seulement la plus élevée" },
      { value: "sum", label: "Oui, les deux s'additionnent" },
    ],
  }),
  "calendar.holidays.disabled": {
    input: "holidays_disabled",
    section: "schedule",
    level: "advanced",
    label: "Jours fériés à ignorer",
    help: "Les jours fériés nationaux sont calculés automatiquement chaque année.",
    initialValue: [],
  } satisfies HolidaysDisabledDef,
  "calendar.holidays.custom": {
    input: "holidays_custom",
    section: "schedule",
    level: "advanced",
    label: "Jours majorés ajoutés",
    help: "Ajoutez une date à traiter comme un jour férié (ex. 24 décembre).",
    initialValue: [],
  } satisfies HolidaysCustomDef,

  // ─── Carburant ──────────────────────────────────────────────────────────────
  "truck.consumptionEmptyL100": num("decimal", {
    section: "fuel",
    level: "simple",
    label: "Consommation de la dépanneuse à vide",
    initialValue: 13,
    min: 1,
    max: 60,
    softMin: 6,
    softMax: 30,
    unit: "L/100 km",
    decimals: 1,
  }),
  "truck.consumptionLoadedL100": num("decimal", {
    section: "fuel",
    level: "simple",
    label: "Consommation avec un véhicule chargé",
    initialValue: 16,
    min: 1,
    max: 80,
    softMin: 8,
    softMax: 35,
    unit: "L/100 km",
    decimals: 1,
  }),
  "fuel.mode": choice({
    section: "fuel",
    level: "simple",
    label: "Prix du carburant",
    initialValue: "manual",
    options: [
      { value: "manual", label: "Manuel", help: "Vous saisissez le prix du litre." },
      { value: "auto", label: "Automatique", help: "Prix réel des stations autour du dépôt (données officielles). En cas de panne, le prix manuel est utilisé." },
    ],
  }),
  "fuel.manualPriceMillis": num("fuel_price", {
    section: "fuel",
    level: "simple",
    label: "Prix du litre",
    help: "Prix TTC à la pompe. Utilisé en mode manuel, et en secours en mode automatique.",
    initialValue: 2350,
    min: 500,
    max: 5000,
    softMin: 1200,
    softMax: 3200,
    unit: "€/L",
  }),
  "fuel.type": choice({
    section: "fuel",
    level: "advanced",
    label: "Carburant de la dépanneuse",
    initialValue: "gazole",
    options: [
      { value: "gazole", label: "Gazole" },
      { value: "e10", label: "SP95-E10" },
      { value: "sp95", label: "SP95" },
      { value: "sp98", label: "SP98" },
      { value: "e85", label: "E85" },
      { value: "gplc", label: "GPLc" },
    ],
  }),
  "fuel.auto.radiusKm": num("integer", {
    section: "fuel",
    level: "advanced",
    label: "Stations prises en compte autour du dépôt",
    initialValue: 10,
    min: 1,
    max: 50,
    unit: "km",
  }),
  "fuel.auto.maxAgeHours": num("integer", {
    section: "fuel",
    level: "advanced",
    label: "Revenir au prix manuel si le prix automatique a plus de",
    initialValue: 72,
    min: 1,
    max: 720,
    unit: "heures",
  }),
  "fuel.auto.minPriceMillis": num("fuel_price", {
    section: "fuel",
    level: "advanced",
    label: "Prix jugé aberrant en dessous de",
    initialValue: 1000,
    min: 100,
    max: 5000,
    unit: "€/L",
  }),
  "fuel.auto.maxPriceMillis": num("fuel_price", {
    section: "fuel",
    level: "advanced",
    label: "Prix jugé aberrant au-dessus de",
    initialValue: 3500,
    min: 500,
    max: 10_000,
    unit: "€/L",
  }),
  "fuel.indexation.enabled": toggle({
    section: "fuel",
    level: "advanced",
    label: "Impact du carburant sur le prix client",
    help: "Si activé, vos prix au kilomètre suivent automatiquement le prix du carburant.",
    initialValue: false,
  }),
  "fuel.indexation.referencePriceMillis": num("fuel_price", {
    section: "fuel",
    level: "advanced",
    label: "Prix du carburant de référence",
    help: "Le prix du litre pour lequel vos prix au kilomètre ont été fixés.",
    initialValue: 2350,
    min: 500,
    max: 5000,
    unit: "€/L",
  }),
  "fuel.indexation.shareBp": num("percent", {
    section: "fuel",
    level: "advanced",
    label: "Part du carburant dans vos prix au kilomètre",
    initialValue: 3000,
    min: 0,
    max: 10_000,
  }),
  "fuel.indexation.capBp": num("percent", {
    section: "fuel",
    level: "advanced",
    label: "Variation maximale",
    initialValue: 1000,
    min: 0,
    max: 5000,
  }),

  // ─── Coûts internes ─────────────────────────────────────────────────────────
  "costs.handlingMinutes": num("integer", {
    section: "costs",
    level: "advanced",
    label: "Temps de chargement et de déchargement",
    help: "Temps passé sur place, ajouté au temps de conduite pour le coût du travail.",
    initialValue: 20,
    min: 0,
    max: 240,
    unit: "min",
  }),
  "vat.fuelRecoverableBp": num("percent", {
    section: "costs",
    level: "advanced",
    label: "TVA récupérable sur le carburant",
    help: "100 % pour le gazole d'un véhicule utilitaire. À confirmer avec votre comptable.",
    initialValue: 10_000,
    min: 0,
    max: 10_000,
  }),

  // ─── Marge ──────────────────────────────────────────────────────────────────
  "margin.minimumCents": num("money", {
    section: "margin",
    level: "advanced",
    label: "Marge minimale par intervention (HT)",
    help: "En dessous, l'intervention est signalée « marge très faible ».",
    initialValue: 1500,
    min: 0,
    max: 100_000,
    softMax: 20_000,
  }),
  "margin.targetBp": num("percent", {
    section: "margin",
    level: "advanced",
    label: "Marge visée",
    help: "En dessous, l'intervention est signalée « marge faible ».",
    initialValue: 3000,
    min: 0,
    max: 9500,
  }),
  "margin.onlineBelowMinimum": choice({
    section: "margin",
    level: "advanced",
    label: "Si une estimation en ligne n'atteint pas la marge minimale",
    initialValue: "raise",
    options: [
      { value: "raise", label: "Relever le prix automatiquement" },
      { value: "warn", label: "Garder le prix et m'alerter" },
      { value: "hide", label: "Ne pas afficher de prix (je rappelle le client)" },
    ],
  }),

  // ─── Arrondi ────────────────────────────────────────────────────────────────
  "rounding.enabled": toggle({
    section: "rounding",
    level: "advanced",
    label: "Arrondir le prix client",
    initialValue: true,
  }),
  "rounding.step": choice({
    section: "rounding",
    level: "advanced",
    label: "Précision",
    initialValue: "5",
    options: [
      { value: "1", label: "À l'euro (87 €)" },
      { value: "5", label: "Aux 5 € (85 €, 90 €)" },
      { value: "10", label: "Aux 10 € (80 €, 90 €)" },
    ],
  }),
  "rounding.mode": choice({
    section: "rounding",
    level: "advanced",
    label: "Sens",
    initialValue: "nearest",
    options: [
      { value: "nearest", label: "Au plus proche" },
      { value: "up", label: "Toujours au-dessus" },
    ],
  }),
  "rounding.afterAdjustments": toggle({
    section: "rounding",
    level: "advanced",
    label: "Arrondir aussi après un ajustement manuel",
    initialValue: true,
  }),

  // ─── TVA ────────────────────────────────────────────────────────────────────
  "vat.subject": toggle({
    section: "vat",
    level: "advanced",
    label: "Votre entreprise facture la TVA",
    help: "Désactivez si vous êtes en franchise de TVA. La marge est toujours calculée hors taxes.",
    initialValue: true,
  }),
  "vat.rateBp": num("percent", {
    section: "vat",
    level: "advanced",
    label: "Taux de TVA",
    initialValue: 2000,
    min: 0,
    max: 3000,
  }),
  "vat.pricesInput": choice({
    section: "vat",
    level: "advanced",
    label: "Les montants saisis dans « Mes tarifs » sont",
    initialValue: "ttc",
    options: [
      { value: "ttc", label: "TTC (ce que paie le client)" },
      { value: "ht", label: "Hors taxes" },
    ],
  }),

  // ─── Estimation en ligne ────────────────────────────────────────────────────
  "estimate.enabled": toggle({
    section: "estimate",
    level: "simple",
    label: "Estimation en ligne",
    help: "Si désactivée, le client envoie sa demande sans prix et vous le rappelez.",
    initialValue: true,
  }),
  "estimate.showSupplementLabels": toggle({
    section: "estimate",
    level: "advanced",
    label: "Montrer au client le nom des suppléments (sans montant)",
    help: "Exemple : « Majoration nuit », « Véhicule non roulant ».",
    initialValue: true,
  }),
  "estimate.validityMinutes": num("integer", {
    section: "estimate",
    level: "advanced",
    label: "Durée de validité d'une estimation",
    help: "Passé ce délai, le prix est recalculé avant l'envoi de la demande.",
    initialValue: 30,
    min: 5,
    max: 1440,
    unit: "min",
  }),

  // ─── Zone d'intervention ────────────────────────────────────────────────────
  "zone.maxApproachKm": num("integer", {
    section: "zone",
    level: "simple",
    label: "Distance maximale jusqu'au client",
    help: "Au-delà, le client ne voit pas de prix automatique : vous le rappelez.",
    initialValue: 80,
    min: 1,
    max: 1000,
    unit: "km",
  }),
  "zone.maxTransportKm": num("integer", {
    section: "zone",
    level: "simple",
    label: "Distance maximale de transport",
    help: "Au-delà, le client ne voit pas de prix automatique : vous le rappelez.",
    initialValue: 150,
    min: 1,
    max: 2000,
    unit: "km",
  }),
  "zone.regulatedRoads.enabled": toggle({
    section: "zone",
    level: "simple",
    label: "Demander au client s'il est sur une autoroute",
    help: "RNB AUTO n'intervient pas directement sur les autoroutes et voies rapides réglementées.",
    initialValue: true,
  }),
  "zone.regulatedRoads.message": text("textarea", {
    section: "zone",
    level: "simple",
    label: "Message affiché au client sur l'autoroute",
    initialValue:
      "Sur l'autoroute et les voies rapides, seul le dépanneur agréé pour ce secteur peut intervenir : il sortira votre véhicule de la voie. RNB AUTO peut ensuite prendre le relais et emmener votre véhicule où vous le souhaitez.",
    maxLength: 600,
  }),

  // ─── Adresse de départ ──────────────────────────────────────────────────────
  "company.depot": {
    input: "address",
    section: "depot",
    level: "simple",
    label: "Adresse de départ (dépôt)",
    help: "Tous les calculs partent de cette adresse et y reviennent.",
    initialValue: { label: "145 rue de Paris, 93000 Bobigny", lat: null, lng: null, postcode: "93000", city: "Bobigny", confirmed: false },
  } satisfies AddressDef,

  // ─── Calcul des trajets ─────────────────────────────────────────────────────
  "routing.optimization": choice({
    section: "routing",
    level: "advanced",
    label: "Type d'itinéraire",
    initialValue: "fastest",
    options: [
      { value: "fastest", label: "Le plus rapide" },
      { value: "shortest", label: "Le plus court" },
    ],
  }),

  // ─── Entreprise ─────────────────────────────────────────────────────────────
  "company.name": text("text", { section: "company", level: "simple", label: "Nom affiché", initialValue: "RNB AUTO", maxLength: 80 }),
  "company.phone": text("phone", {
    section: "company",
    level: "simple",
    label: "Téléphone",
    help: "Affiché sur tout le site et utilisé par le bouton « Appeler ».",
    initialValue: "",
    maxLength: 30,
    placeholder: "06 12 34 56 78",
    toComplete: true,
  }),
  "company.whatsapp": text("phone", {
    section: "company",
    level: "simple",
    label: "Numéro WhatsApp",
    help: "Laissez vide pour utiliser le numéro de téléphone.",
    initialValue: "",
    maxLength: 30,
    placeholder: "06 12 34 56 78",
  }),
  "company.email": text("email", {
    section: "company",
    level: "simple",
    label: "Email de contact",
    initialValue: "",
    maxLength: 120,
    placeholder: "contact@exemple.fr",
    toComplete: true,
  }),
  "company.availability": text("text", {
    section: "company",
    level: "simple",
    label: "Disponibilité affichée sur le site",
    help: "Laissez vide pour ne rien afficher.",
    initialValue: "",
    maxLength: 60,
    placeholder: "24h/24 · 7j/7",
    toComplete: true,
  }),
  "company.serviceArea": text("text", {
    section: "company",
    level: "simple",
    label: "Zone desservie (phrase courte)",
    initialValue: "Bobigny, la Seine-Saint-Denis, Paris et l'Île-de-France",
    maxLength: 120,
  }),

  // ─── Site internet ──────────────────────────────────────────────────────────
  "site.announcement.enabled": toggle({
    section: "site",
    level: "simple",
    label: "Afficher un message temporaire en haut du site",
    initialValue: false,
  }),
  "site.announcement.text": text("text", {
    section: "site",
    level: "simple",
    label: "Message temporaire",
    initialValue: "",
    maxLength: 160,
    placeholder: "Forte demande ce soir : délai d'intervention un peu allongé.",
  }),
  "site.showExamplePrice": toggle({
    section: "site",
    level: "simple",
    label: "Montrer un exemple de prix sur la page d'accueil",
    help: "Calculé automatiquement avec vos tarifs actuels.",
    initialValue: true,
  }),

  // ─── Mentions légales ───────────────────────────────────────────────────────
  "legal.companyName": text("text", { section: "legal", level: "simple", label: "Raison sociale", initialValue: "", maxLength: 120, toComplete: true }),
  "legal.legalForm": text("text", { section: "legal", level: "simple", label: "Forme juridique", initialValue: "", maxLength: 60, placeholder: "SAS, SARL, EI…", toComplete: true }),
  "legal.siret": text("text", { section: "legal", level: "simple", label: "Numéro SIRET", initialValue: "", maxLength: 20, toComplete: true }),
  "legal.vatNumber": text("text", { section: "legal", level: "simple", label: "Numéro de TVA intracommunautaire", initialValue: "", maxLength: 20 }),
  "legal.address": text("text", { section: "legal", level: "simple", label: "Adresse du siège", initialValue: "145 rue de Paris, 93000 Bobigny", maxLength: 160 }),
  "legal.publicationDirector": text("text", {
    section: "legal",
    level: "simple",
    label: "Directeur ou directrice de la publication",
    initialValue: "",
    maxLength: 120,
    toComplete: true,
  }),
  "legal.host": text("textarea", {
    section: "legal",
    level: "simple",
    label: "Hébergeur du site",
    help: "Nom, adresse et téléphone de l'hébergeur (indiqués par votre hébergeur).",
    initialValue: "",
    maxLength: 400,
    toComplete: true,
  }),
  "legal.insurance": text("text", {
    section: "legal",
    level: "simple",
    label: "Assurance professionnelle (facultatif)",
    initialValue: "",
    maxLength: 200,
  }),

  // ─── Notifications ──────────────────────────────────────────────────────────
  "notifications.email": text("email", {
    section: "notifications",
    level: "simple",
    label: "Email qui reçoit les nouvelles demandes",
    help: "Laissez vide pour utiliser l'email de contact.",
    initialValue: "",
    maxLength: 120,
  }),
};

export type Settings = typeof SETTINGS;
export type SettingKey = keyof Settings;
export type SettingValue<K extends SettingKey> = Settings[K]["initialValue"];
export type SettingsValues = { [K in SettingKey]: SettingValue<K> };

export const SETTING_KEYS = Object.keys(SETTINGS) as SettingKey[];

export function settingDef(key: SettingKey): SettingDef {
  return SETTINGS[key] as SettingDef;
}

export function initialSettingsValues(): SettingsValues {
  return Object.fromEntries(
    SETTING_KEYS.map((key) => [key, structuredClone(SETTINGS[key].initialValue)]),
  ) as SettingsValues;
}

export function isSettingKey(key: string): key is SettingKey {
  return Object.prototype.hasOwnProperty.call(SETTINGS, key);
}

export function keysOfSection(section: SectionId): SettingKey[] {
  return SETTING_KEYS.filter((key) => SETTINGS[key].section === section);
}

export function isSnapshotKey(key: SettingKey): boolean {
  return SECTIONS[SETTINGS[key].section].snapshot;
}
