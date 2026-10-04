/**
 * Secteurs d'intervention de /zones-d-intervention (docs/09, F.3). Textes et communes repris
 * mot pour mot de l'ancienne page. Données pures : partagées par la liste (serveur) et par la
 * recherche de commune (client), sans aucun appel réseau.
 */

/** Anneau du « Plan RNB » allumé par chaque secteur (F.3, PK 02). */
export type AreaZone = "93" | "paris" | "petite-couronne" | "grande-couronne";

export type Area = {
  zone: AreaZone;
  title: string;
  text: string;
  places: readonly string[];
  /** Puce finale sans être une commune (« et tous les autres arrondissements »). */
  more?: string;
};

export const AREAS: readonly Area[] = [
  {
    zone: "93",
    title: "Seine-Saint-Denis (93)",
    text: "Notre département, au départ de Bobigny.",
    places: [
      "Bobigny",
      "Drancy",
      "Pantin",
      "Bondy",
      "Noisy-le-Sec",
      "Romainville",
      "Les Lilas",
      "Le Pré-Saint-Gervais",
      "Aubervilliers",
      "La Courneuve",
      "Saint-Denis",
      "Saint-Ouen",
      "Le Blanc-Mesnil",
      "Aulnay-sous-Bois",
      "Sevran",
      "Livry-Gargan",
      "Les Pavillons-sous-Bois",
      "Montreuil",
      "Bagnolet",
      "Rosny-sous-Bois",
      "Villemomble",
      "Noisy-le-Grand",
      "Épinay-sur-Seine",
      "Stains",
      "Villepinte",
      "Tremblay-en-France",
    ],
  },
  {
    zone: "paris",
    title: "Paris",
    text: "Tous les arrondissements de Paris.",
    places: ["Paris 10e", "Paris 11e", "Paris 12e", "Paris 18e", "Paris 19e", "Paris 20e"],
    more: "et tous les autres arrondissements",
  },
  {
    zone: "petite-couronne",
    title: "Petite couronne",
    text: "Hauts-de-Seine (92) et Val-de-Marne (94).",
    places: [
      "Créteil",
      "Vincennes",
      "Fontenay-sous-Bois",
      "Nogent-sur-Marne",
      "Ivry-sur-Seine",
      "Vitry-sur-Seine",
      "Nanterre",
      "Colombes",
      "Gennevilliers",
      "Boulogne-Billancourt",
    ],
  },
  {
    zone: "grande-couronne",
    title: "Grande couronne",
    text: "Val-d'Oise (95), Seine-et-Marne (77), Yvelines (78), Essonne (91).",
    places: ["Roissy", "Argenteuil", "Cergy", "Meaux", "Chelles", "Marne-la-Vallée", "Versailles", "Évry"],
  },
];

/** Forme de comparaison : sans accents, sans majuscules, tirets et apostrophes en espaces. */
export function normalizePlace(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[-'’_.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Identifiant d'ancre d'une commune dans la liste (« Noisy-le-Sec » → « noisy-le-sec »). */
export const placeSlug = (place: string) => normalizePlace(place).replace(/ /g, "-");

export type PlaceMatch =
  | { kind: "empty" }
  | { kind: "found"; place: string; area: Area }
  | { kind: "suggest"; places: { place: string; area: Area }[] }
  | { kind: "missing" };

const ENTRIES = AREAS.flatMap((area) => area.places.map((place) => ({ place, area, key: normalizePlace(place) })));
const PARIS = AREAS.find((area) => area.zone === "paris")!;

/**
 * Cherche une commune dans les listes (aucun appel réseau) :
 * - nom exact (accents et majuscules ignorés) → `found` ;
 * - « Paris », « Paris 15e », « Paris 15 »… → `found` (tous les arrondissements) ;
 * - début de nom d'au moins 2 lettres → `suggest` (6 au plus) ;
 * - sinon, à partir de 2 lettres → `missing`.
 */
export function matchPlace(query: string): PlaceMatch {
  const key = normalizePlace(query);
  if (key.length < 2) return { kind: "empty" };
  const exact = ENTRIES.find((entry) => entry.key === key);
  if (exact) return { kind: "found", place: exact.place, area: exact.area };
  const paris = /^paris(?: (\d{1,2})(?: ?(?:e|eme|er|ieme|arr|arrondissement))?)?$/.exec(key);
  if (paris) {
    const n = paris[1] ? Number(paris[1]) : null;
    if (n === null) return { kind: "found", place: "Paris", area: PARIS };
    if (n >= 1 && n <= 20) return { kind: "found", place: `Paris ${n}${n === 1 ? "er" : "e"}`, area: PARIS };
  }
  // D'abord les noms qui commencent par la saisie, puis ceux dont un mot commence par elle.
  const prefix = ENTRIES.filter((entry) => entry.key.startsWith(key));
  const word = ENTRIES.filter(
    (entry) => !entry.key.startsWith(key) && entry.key.split(" ").some((part) => part.length > 3 && part.startsWith(key)),
  );
  const starts = [...prefix, ...word];
  if (starts.length > 0) {
    return { kind: "suggest", places: starts.slice(0, 6).map(({ place, area }) => ({ place, area })) };
  }
  return { kind: "missing" };
}
