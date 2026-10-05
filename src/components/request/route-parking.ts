/**
 * Place de stationnement de la dépanneuse au bout du retour (/demande, plan de la feuille de route).
 *
 * Garée SUR le losange du dépôt, la dépanneuse (et le faisceau de ses phares) recouvrait le nom
 * du dépôt (« BOBIGNY »). Elle se gare donc à côté du losange, le nez tourné vers l'extérieur :
 * - à droite ou à gauche (cap horizontal) : son corps passe entre la bande du nom au-dessus et
 *   celle au-dessous, et ses phares commencent au-delà de la largeur du nom ;
 * - ou du côté opposé au nom (cap vertical), qui est connu par `layoutPlanLabels`.
 * Parmi ces places, celle qui recouvre le moins les autres marques (communes et leurs noms,
 * épingle, drapeau) gagne ; à égalité, celle qui prolonge le mieux le sens de la marche.
 * Le dernier tronçon devient une courbe de Bézier cubique : il garde la cambrure de départ du
 * retour et arrive dans l'axe de la place (le runtime oriente la dépanneuse sur cette tangente).
 * Pur : aucun accès au navigateur, mêmes entrées = même sortie.
 */
import { CITIES } from "@/components/scenes/kit/plan-idf/geo";
import { estimateLabelWidth, planPoint } from "@/components/scenes/kit/plan-idf/plan-geometry";
import { layoutPlanLabels, type Box } from "@/components/scenes/kit/plan-idf/plan-labels";
import type { PlanVariant } from "@/components/scenes/kit/plan-idf/projection";
import { formatSvgNumber as f, type Point } from "@/components/scenes/kit/svg-path";
import type { PublicSiteInfo } from "@/server/site/public-info";

export type PlanMark = { kind: "vous" | "destination"; p: Point };

/** Distance du centre du losange au centre de la dépanneuse (unités du plan, 600 de côté). */
const PARK_OFFSET = 52;
/** Dépanneuse à l'échelle 1,25 du plan : 58 de long, 20 de large (ombre comprise, un peu plus). */
const BODY_HALF = { along: 31, across: 12 };
/** Partie vive du faisceau des phares (au-delà, il est presque transparent). */
const BEAM = { from: 31, to: 95, across: 18 };
/** Le faisceau compte moins qu'une carrosserie posée sur un nom. */
const BEAM_WEIGHT = 0.4;
/** Marques agrandies sur un plan étroit (`NARROW_MARK_SCALE`) : on prend le pire cas. */
const MARK_SCALE = 1.4;

const HEADINGS = { east: { x: 1, y: 0 }, west: { x: -1, y: 0 }, south: { x: 0, y: 1 }, north: { x: 0, y: -1 } } as const;
type Heading = keyof typeof HEADINGS;

const area = (a: Box, b: Box) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

/** Boîte alignée sur les axes d'un rectangle de `from` à `to` le long du cap `h`, demi-largeur `across`. */
function strip(center: Point, h: Point, from: number, to: number, across: number): Box {
  const xs = [center.x + h.x * from, center.x + h.x * to];
  const ys = [center.y + h.y * from, center.y + h.y * to];
  return {
    x0: Math.min(...xs) - Math.abs(h.y) * across,
    x1: Math.max(...xs) + Math.abs(h.y) * across,
    y0: Math.min(...ys) - Math.abs(h.x) * across,
    y1: Math.max(...ys) + Math.abs(h.x) * across,
  };
}

/**
 * Marques du plan à ne pas recouvrir : points des communes dessinées et, de part et d'autre
 * (le nom peut être retourné), la place de leur nom ; épingle « Vous » avec son étiquette, drapeau.
 */
export function planObstacles(variant: PlanVariant, depotInfo: PublicSiteInfo["depot"], depot: Point, marks: PlanMark[]): Box[] {
  const region = variant === "region";
  const boxes: Box[] = [];
  for (const city of CITIES) {
    const p = planPoint(city.lat, city.lng, variant, depotInfo);
    // Ville du dépôt et communes cachées sous le losange : non dessinées (même règle que le plan).
    if (depotInfo.city && city.name.toLowerCase() === depotInfo.city.trim().toLowerCase()) continue;
    if (Math.hypot(p.x - depot.x, p.y - depot.y) < (region ? 15 : 10)) continue;
    boxes.push({ x0: p.x - 5, x1: p.x + 5, y0: p.y - 5, y1: p.y + 5 });
    // Noms des petites communes compris : le disque large les affiche aussi.
    const width = estimateLabelWidth(city.name, 12);
    boxes.push({ x0: p.x - 8 - width, x1: p.x + 8 + width, y0: p.y - 9, y1: p.y + 7 });
  }
  for (const mark of marks) {
    const { x, y } = mark.p;
    const k = MARK_SCALE;
    if (mark.kind === "vous") {
      boxes.push({ x0: x - 11.5 * k, x1: x + 11.5 * k, y0: y - 29.5 * k, y1: y + 2.5 * k });
      // Étiquette « Vous » : une des places autour de l'épingle (toutes réservées).
      boxes.push({ x0: x - 40, x1: x + 40, y0: y - 52, y1: y + 30 });
    } else {
      boxes.push({ x0: x - 4 * k, x1: x + 21 * k, y0: y - 32 * k, y1: y + 3 * k });
    }
  }
  return boxes;
}

/** Cap de stationnement retenu (exporté pour les tests). */
export function chooseParking(depot: Point, from: Point, obstacles: Box[], nameSide: "above" | "below" | null): Heading {
  // Cap vertical seulement du côté libre du nom (sans nom : les deux).
  const candidates: Heading[] = ["east", "west"];
  if (nameSide !== "below") candidates.push("south");
  if (nameSide !== "above") candidates.push("north");
  const length = Math.hypot(depot.x - from.x, depot.y - from.y) || 1;
  const travel = { x: (depot.x - from.x) / length, y: (depot.y - from.y) / length };
  const score = (heading: Heading) => {
    const h = HEADINGS[heading];
    const center = { x: depot.x + h.x * PARK_OFFSET, y: depot.y + h.y * PARK_OFFSET };
    const body = strip(center, h, -BODY_HALF.along, BODY_HALF.along, BODY_HALF.across);
    const beam = strip(center, h, BEAM.from, BEAM.to, BEAM.across);
    return obstacles.reduce((sum, box) => sum + area(body, box) + BEAM_WEIGHT * area(beam, box), 0);
  };
  const ranked = candidates
    .map((heading) => ({ heading, score: Math.round(score(heading)), align: HEADINGS[heading].x * travel.x + HEADINGS[heading].y * travel.y }))
    .sort((a, b) => a.score - b.score || b.align - a.align);
  return ranked[0]!.heading;
}

/**
 * Tracé du retour, de `from` jusqu'à la place choisie à côté du dépôt `depot`. `bend` : cambrure
 * du retour (même formule que `arc` de la feuille de route).
 */
export function parkingLeg(
  from: Point,
  depot: Point,
  bend: number,
  context: { variant: PlanVariant; depotInfo: PublicSiteInfo["depot"]; marks: PlanMark[] },
): string {
  const { depotName } = layoutPlanLabels({
    region: context.variant === "region",
    depot: context.depotInfo.city ? { p: depot, name: context.depotInfo.city } : null,
    points: context.marks,
    cities: [],
  });
  const nameSide = context.depotInfo.city ? depotName : null;
  const heading = chooseParking(depot, from, planObstacles(context.variant, context.depotInfo, depot, context.marks), nameSide);
  const h = HEADINGS[heading];
  const park = { x: depot.x + h.x * PARK_OFFSET, y: depot.y + h.y * PARK_OFFSET };
  // Point de contrôle de l'ancien arc (cambrure du départ), ramené en cubique.
  const dx = depot.x - from.x;
  const dy = depot.y - from.y;
  const q = { x: (from.x + depot.x) / 2 - dy * bend, y: (from.y + depot.y) / 2 + dx * bend };
  const c1 = { x: from.x + ((q.x - from.x) * 2) / 3, y: from.y + ((q.y - from.y) * 2) / 3 };
  // Arrivée dans l'axe de la place : la tangente finale est le cap choisi.
  const c2 = { x: park.x - h.x * (PARK_OFFSET - 8), y: park.y - h.y * (PARK_OFFSET - 8) };
  return `M${f(from.x)} ${f(from.y)}C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(park.x)} ${f(park.y)}`;
}
