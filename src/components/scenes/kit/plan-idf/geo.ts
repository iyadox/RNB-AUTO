/**
 * Repères géographiques publics du « Plan RNB » (docs/09, H.3) : villes, cours d'eau, anneau
 * du périphérique, limite schématique de la petite couronne et grands axes. Ce sont des
 * coordonnées approchées (latitude, longitude), suffisantes pour un plan SCHÉMATIQUE : aucune
 * distance n'est jamais affichée à partir de ces données.
 */

export type GeoPoint = { lat: number; lng: number };

export type Department = "75" | "77" | "78" | "91" | "92" | "93" | "94" | "95";

export type GeoCity = GeoPoint & {
  name: string;
  department: Department;
  /** Grande ville affichée avec son nom par défaut (`labels="major"`). */
  major?: boolean;
};

/** Centre du plan régional (Paris, Île de la Cité). */
export const PARIS_CENTER: GeoPoint = { lat: 48.853, lng: 2.3499 };

/** Les 15 villes de l'ancienne carte de l'accueil, plus Bobigny (ville du dépôt). */
export const CITIES: readonly GeoCity[] = [
  { name: "Paris", lat: 48.8566, lng: 2.3522, department: "75", major: true },
  { name: "Bobigny", lat: 48.9086, lng: 2.4397, department: "93" },
  { name: "Saint-Denis", lat: 48.9362, lng: 2.3574, department: "93" },
  { name: "Montreuil", lat: 48.8611, lng: 2.4437, department: "93" },
  { name: "Pantin", lat: 48.8944, lng: 2.4093, department: "93" },
  { name: "Drancy", lat: 48.923, lng: 2.4455, department: "93" },
  { name: "Bondy", lat: 48.9022, lng: 2.4828, department: "93" },
  { name: "Aulnay-sous-Bois", lat: 48.9386, lng: 2.4973, department: "93" },
  { name: "Noisy-le-Grand", lat: 48.8486, lng: 2.5526, department: "93" },
  { name: "Roissy", lat: 49.0097, lng: 2.5479, department: "95", major: true },
  { name: "Créteil", lat: 48.7904, lng: 2.4556, department: "94", major: true },
  { name: "Argenteuil", lat: 48.9472, lng: 2.2467, department: "95" },
  { name: "Versailles", lat: 48.8049, lng: 2.1204, department: "78", major: true },
  { name: "Cergy", lat: 49.0364, lng: 2.0761, department: "95", major: true },
  { name: "Évry", lat: 48.6292, lng: 2.4409, department: "91" },
  { name: "Meaux", lat: 48.9601, lng: 2.8788, department: "77", major: true },
];

/** La Seine, de Villeneuve-Saint-Georges à Bezons. */
export const SEINE: readonly GeoPoint[] = [
  { lat: 48.732, lng: 2.448 }, // Villeneuve-Saint-Georges
  { lat: 48.764, lng: 2.409 }, // Choisy-le-Roi
  { lat: 48.815, lng: 2.393 }, // Ivry
  { lat: 48.836, lng: 2.38 }, // Bercy
  { lat: 48.853, lng: 2.349 }, // Île de la Cité
  { lat: 48.857, lng: 2.29 }, // Grenelle
  { lat: 48.828, lng: 2.252 }, // Billancourt
  { lat: 48.845, lng: 2.22 }, // Saint-Cloud
  { lat: 48.871, lng: 2.226 }, // Suresnes
  { lat: 48.884, lng: 2.24 }, // Puteaux
  { lat: 48.905, lng: 2.27 }, // Asnières
  { lat: 48.945, lng: 2.345 }, // Saint-Denis
  { lat: 48.955, lng: 2.31 }, // Épinay
  { lat: 48.943, lng: 2.25 }, // Argenteuil
  { lat: 48.93, lng: 2.21 }, // Bezons
];

/** La Marne, de Chelles à la confluence (Alfortville). */
export const MARNE: readonly GeoPoint[] = [
  { lat: 48.88, lng: 2.59 }, // Chelles
  { lat: 48.855, lng: 2.53 }, // Neuilly-sur-Marne
  { lat: 48.83, lng: 2.51 }, // Champigny
  { lat: 48.82, lng: 2.47 }, // Joinville
  { lat: 48.815, lng: 2.405 }, // Confluence, Alfortville
];

/** Le canal de l'Ourcq, de La Villette à Sevran (il passe à Bobigny). */
export const OURCQ: readonly GeoPoint[] = [
  { lat: 48.888, lng: 2.373 }, // La Villette
  { lat: 48.894, lng: 2.409 }, // Pantin
  { lat: 48.9, lng: 2.445 }, // Bobigny
  { lat: 48.902, lng: 2.48 }, // Bondy
  { lat: 48.935, lng: 2.53 }, // Sevran
];

/** Boulevard périphérique (anneau fermé, portes principales). */
export const PERIPHERIQUE: readonly GeoPoint[] = [
  { lat: 48.878, lng: 2.283 }, // Porte Maillot
  { lat: 48.8945, lng: 2.313 }, // Porte de Clichy
  { lat: 48.8975, lng: 2.329 }, // Porte de Saint-Ouen
  { lat: 48.8985, lng: 2.359 }, // Porte de la Chapelle
  { lat: 48.8975, lng: 2.386 }, // Porte de la Villette
  { lat: 48.888, lng: 2.399 }, // Porte de Pantin
  { lat: 48.877, lng: 2.407 }, // Porte des Lilas
  { lat: 48.864, lng: 2.409 }, // Porte de Bagnolet
  { lat: 48.847, lng: 2.411 }, // Porte de Vincennes
  { lat: 48.83, lng: 2.399 }, // Porte de Bercy
  { lat: 48.8215, lng: 2.37 }, // Porte d'Ivry
  { lat: 48.819, lng: 2.36 }, // Porte d'Italie
  { lat: 48.8235, lng: 2.326 }, // Porte d'Orléans
  { lat: 48.832, lng: 2.288 }, // Porte de Versailles
  { lat: 48.838, lng: 2.257 }, // Porte de Saint-Cloud
  { lat: 48.848, lng: 2.256 }, // Porte d'Auteuil
  { lat: 48.8715, lng: 2.276 }, // Porte Dauphine
];

/** Limite schématique de la petite couronne (Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne). */
export const PETITE_COURONNE: readonly GeoPoint[] = [
  { lat: 48.952, lng: 2.3 },
  { lat: 48.972, lng: 2.4 },
  { lat: 48.995, lng: 2.52 },
  { lat: 48.958, lng: 2.6 },
  { lat: 48.878, lng: 2.6 },
  { lat: 48.83, lng: 2.6 },
  { lat: 48.762, lng: 2.56 },
  { lat: 48.716, lng: 2.47 },
  { lat: 48.735, lng: 2.38 },
  { lat: 48.745, lng: 2.3 },
  { lat: 48.775, lng: 2.23 },
  { lat: 48.84, lng: 2.165 },
  { lat: 48.877, lng: 2.15 },
  { lat: 48.92, lng: 2.2 },
  { lat: 48.945, lng: 2.25 },
];

export type GeoRoad = { id: string; ring?: true; points: readonly GeoPoint[] };

/**
 * Grands axes (tracés stylisés, jamais nommés à l'écran) : ils donnent au plan l'allure d'une
 * vraie carte. A86 : rocade fermée. Les radiales partent du périphérique.
 */
export const ROADS: readonly GeoRoad[] = [
  {
    id: "a86",
    ring: true,
    points: [
      { lat: 48.93, lng: 2.34 },
      { lat: 48.927, lng: 2.395 },
      { lat: 48.912, lng: 2.43 },
      { lat: 48.895, lng: 2.48 },
      { lat: 48.875, lng: 2.49 },
      { lat: 48.85, lng: 2.48 },
      { lat: 48.825, lng: 2.465 },
      { lat: 48.795, lng: 2.45 },
      { lat: 48.765, lng: 2.39 },
      { lat: 48.76, lng: 2.3 },
      { lat: 48.79, lng: 2.245 },
      { lat: 48.865, lng: 2.18 },
      { lat: 48.92, lng: 2.24 },
      { lat: 48.935, lng: 2.3 },
    ],
  },
  {
    id: "a1",
    points: [
      { lat: 48.8985, lng: 2.359 },
      { lat: 48.9245, lng: 2.36 },
      { lat: 48.942, lng: 2.405 },
      { lat: 48.965, lng: 2.48 },
      { lat: 49.0, lng: 2.53 },
    ],
  },
  {
    id: "a3",
    points: [
      { lat: 48.864, lng: 2.409 },
      { lat: 48.878, lng: 2.433 },
      { lat: 48.897, lng: 2.465 },
      { lat: 48.93, lng: 2.495 },
      { lat: 48.96, lng: 2.515 },
    ],
  },
  {
    id: "n3",
    points: [
      { lat: 48.888, lng: 2.399 },
      { lat: 48.8944, lng: 2.4093 },
      { lat: 48.902, lng: 2.44 },
      { lat: 48.9022, lng: 2.4828 },
      { lat: 48.915, lng: 2.535 },
    ],
  },
  {
    id: "a4",
    points: [
      { lat: 48.83, lng: 2.399 },
      { lat: 48.822, lng: 2.46 },
      { lat: 48.84, lng: 2.54 },
      { lat: 48.85, lng: 2.65 },
      { lat: 48.87, lng: 2.78 },
      { lat: 48.94, lng: 2.86 },
    ],
  },
  {
    id: "a6",
    points: [
      { lat: 48.819, lng: 2.36 },
      { lat: 48.78, lng: 2.37 },
      { lat: 48.73, lng: 2.38 },
      { lat: 48.68, lng: 2.41 },
      { lat: 48.632, lng: 2.435 },
    ],
  },
  {
    id: "a13",
    points: [
      { lat: 48.848, lng: 2.256 },
      { lat: 48.835, lng: 2.21 },
      { lat: 48.822, lng: 2.165 },
      { lat: 48.81, lng: 2.125 },
    ],
  },
  {
    id: "a15",
    points: [
      { lat: 48.93, lng: 2.3 },
      { lat: 48.95, lng: 2.25 },
      { lat: 48.99, lng: 2.17 },
      { lat: 49.03, lng: 2.085 },
    ],
  },
];

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Ville connue du plan, sans tenir compte des accents ni des majuscules (« bobigny » → Bobigny). */
export function findCity(name: string | null | undefined): GeoCity | null {
  if (!name) return null;
  const wanted = normalize(name);
  if (!wanted) return null;
  return CITIES.find((city) => normalize(city.name) === wanted) ?? null;
}
