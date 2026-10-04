/**
 * Placement des noms du « Plan RNB » (docs/09, F.3), sans rendu : pur et testé.
 *
 * Collision par BOÎTES estimées (pas seulement par distance au point) : noms des communes,
 * losange du dépôt et son nom (« BOBIGNY »), épingle « Vous » et son étiquette, drapeau de
 * destination. Deux régimes sont vérifiés, car le CSS change les tailles selon la largeur du
 * plan (requêtes de conteneur, kit.module.css) :
 * - `wide` : taille normale (plan de plus de 760 px, ou plan du dépôt de plus de 520 px) ;
 * - `mid` : disque régional de 521 à 760 px, noms un peu agrandis (16 / 13 unités) ;
 * - `narrow` : plan étroit (≤ 520 px), noms agrandis et marques à l'échelle 1,4.
 * Un écart minimal (`GAP`) sépare deux boîtes : des noms qui se touchent se lisent mal.
 *
 * Ordre de priorité : le nom du dépôt (dessous, sinon dessus du losange), puis l'étiquette
 * « Vous » (dessous, dessus, à droite, à gauche de l'épingle), puis les communes (grandes villes
 * d'abord) : position préférée, sinon de l'autre côté du point, sinon masquée.
 */
import type { Point } from "../svg-path";
import { estimateLabelWidth, PLAN_SIZE } from "./plan-geometry";

export type Anchor = "start" | "end" | "middle";
export type Box = { x0: number; x1: number; y0: number; y1: number };

/** Échelle des marques (losange, épingle, drapeau) sur un plan étroit (`.plan .mark`). */
export const NARROW_MARK_SCALE = 1.4;
/** Taille des noms quand le plan est étroit (requête de conteneur ≤ 520 px). */
export const NARROW_SIZE = { region: 22, depot: 20 } as const;
/** Marge intérieure du cadre pour les noms (unités du plan). */
export const LABEL_MARGIN = 6;

/** Boîtes locales des marques (repère de la marque, échelle 1), d'après les glyphes. */
const DIAMOND: Box = { x0: -15.5, x1: 15.5, y0: -15.5, y1: 15.5 };
const PIN: Box = { x0: -11.5, x1: 11.5, y0: -29.5, y1: 2.5 };
const FLAG: Box = { x0: -4, x1: 21, y0: -32, y1: 3 };

/** Nom du dépôt : 12 unités (14 sur un plan étroit), capitales, interlettrage 0,14 em. */
const DEPOT_NAME_SIZE = { wide: 12, narrow: 14 } as const;
const DEPOT_NAME_BASELINE = { below: 31, above: -22 } as const;
export type DepotNameSide = keyof typeof DEPOT_NAME_BASELINE;

/** Étiquette « Vous » de l'épingle (13 unités, graisse 800), positions candidates. */
const PIN_LABEL_SIZE = 13;
export type PinLabel = { x: number; y: number; anchor: Anchor };
export const PIN_LABEL_SPOTS: readonly PinLabel[] = [
  { x: 0, y: 17, anchor: "middle" },
  { x: 0, y: -34, anchor: "middle" },
  { x: 15, y: -13, anchor: "start" },
  { x: -15, y: -13, anchor: "end" },
];

export const overlaps = (a: Box, b: Box, gap = 0) =>
  a.x0 - gap < b.x1 && b.x0 - gap < a.x1 && a.y0 - gap < b.y1 && b.y0 - gap < a.y1;

/** Étendue horizontale d'un nom posé en `x` avec l'ancrage donné. */
export const extent = (x: number, anchor: Anchor, width: number): [number, number] =>
  anchor === "start" ? [x, x + width] : anchor === "end" ? [x - width, x] : [x - width / 2, x + width / 2];

/** Boîte d'un texte (ligne de base `y`) : hampes au-dessus, jambages en dessous. */
const textBox = (x: number, y: number, anchor: Anchor, width: number, size: number): Box => {
  const [x0, x1] = extent(x, anchor, width);
  return { x0, x1, y0: y - size * 0.78, y1: y + size * 0.24 };
};

/** Boîte locale `b` d'une marque posée en `p`, à l'échelle `k`. */
const place = (p: Point, b: Box, k: number): Box => ({ x0: p.x + b.x0 * k, x1: p.x + b.x1 * k, y0: p.y + b.y0 * k, y1: p.y + b.y1 * k });

const insidePlan = (b: Box) => b.x0 >= LABEL_MARGIN && b.x1 <= PLAN_SIZE - LABEL_MARGIN && b.y0 >= LABEL_MARGIN && b.y1 <= PLAN_SIZE - LABEL_MARGIN;
const fitsX = (range: [number, number]) => range[0] >= LABEL_MARGIN && range[1] <= PLAN_SIZE - LABEL_MARGIN;

const flip = (a: Anchor): Anchor => (a === "start" ? "end" : a === "end" ? "start" : a);
const flipDx = (a: Anchor) => (a === "middle" ? 0 : a === "start" ? 8 : -8);

export type CityLabelInput = {
  name: string;
  p: Point;
  major: boolean;
  /** Nom demandé (option `labels`). */
  wanted: boolean;
  /** Position préférée : décalage et ancrage. */
  dx: number;
  dy: number;
  anchor: Anchor;
};

export type CityLabelPlan = {
  showLabel: boolean;
  dx: number;
  dy: number;
  anchor: Anchor;
  /** Disque de 521 à 760 px : masqué si le nom agrandi gêne. */
  hideMid: boolean;
  /** Plan étroit : `flip` (de l'autre côté, décalé de `narrowShift`) ou `hide`. */
  narrow: "keep" | "flip" | "hide";
  narrowShift: number;
};

export type PlanLabelInput = {
  region: boolean;
  depot: { p: Point; name: string | null } | null;
  points: { kind: "vous" | "destination"; p: Point }[];
  cities: CityLabelInput[];
};

export type PlanLabelLayout = {
  depotName: DepotNameSide;
  /** Étiquette de chaque point (`null` pour un drapeau). */
  pointLabels: (PinLabel | null)[];
  cities: Map<string, CityLabelPlan>;
};

type Regime = "wide" | "mid" | "narrow";
const SCALE: Record<Regime, number> = { wide: 1, mid: 1, narrow: NARROW_MARK_SCALE };
/** Écart minimal entre deux boîtes (unités du plan ; ≈ 3 px à l'écran sur un plan étroit). */
const GAP: Record<Regime, number> = { wide: 4, mid: 4, narrow: 7 };

function depotNameBox(depot: { p: Point; name: string }, side: DepotNameSide, regime: Regime): Box {
  const size = DEPOT_NAME_SIZE[regime === "narrow" ? "narrow" : "wide"];
  const text = depot.name.toUpperCase();
  const width = estimateLabelWidth(text, size, true) + text.length * size * 0.14;
  return place(depot.p, textBox(0, DEPOT_NAME_BASELINE[side], "middle", width, size), SCALE[regime]);
}

function pinLabelBox(p: Point, spot: PinLabel, regime: Regime): Box {
  return place(p, textBox(spot.x, spot.y, spot.anchor, estimateLabelWidth("Vous", PIN_LABEL_SIZE, true), PIN_LABEL_SIZE), SCALE[regime]);
}

export function layoutPlanLabels({ region, depot, points, cities }: PlanLabelInput): PlanLabelLayout {
  const regimes: Regime[] = ["wide", "mid", "narrow"];
  const bodyBoxes = (regime: Regime) => points.map(({ kind, p }) => place(p, kind === "vous" ? PIN : FLAG, SCALE[regime]));
  const bodiesBy: Record<Regime, Box[]> = { wide: bodyBoxes("wide"), mid: bodyBoxes("mid"), narrow: bodyBoxes("narrow") };
  const bodies = (regime: Regime) => bodiesBy[regime];
  const named = depot && depot.name ? { p: depot.p, name: depot.name } : null;

  // 1. Nom du dépôt : dessous, sinon dessus si une épingle ou un drapeau le recouvre.
  let depotName: DepotNameSide = "below";
  if (named) {
    const sideFree = (side: DepotNameSide) => regimes.every((r) => !bodies(r).some((b) => overlaps(b, depotNameBox(named, side, r))));
    if (!sideFree("below") && sideFree("above")) depotName = "above";
  }

  // Obstacles fixes d'un régime : losange, nom du dépôt, corps des marques.
  const fixed = (regime: Regime): Box[] => [
    ...(depot ? [place(depot.p, DIAMOND, SCALE[regime])] : []),
    ...(named ? [depotNameBox(named, depotName, regime)] : []),
    ...bodies(regime),
  ];
  const taken: Record<Regime, Box[]> = { wide: fixed("wide"), mid: fixed("mid"), narrow: fixed("narrow") };
  const free = (box: Box, regime: Regime, except?: Box) => !taken[regime].some((b) => b !== except && overlaps(b, box, GAP[regime]));

  // 2. Étiquettes « Vous » : première position libre dans les deux régimes (sinon sur plan étroit).
  // (Les positions candidates ne touchent jamais l'épingle elle-même : elle n'est pas un obstacle.)
  const pointLabels = points.map(({ kind, p }, index): PinLabel | null => {
    if (kind !== "vous") return null;
    const ok = (spot: PinLabel, regime: Regime) => {
      const box = pinLabelBox(p, spot, regime);
      return insidePlan(box) && free(box, regime, bodiesBy[regime][index]);
    };
    const spot =
      PIN_LABEL_SPOTS.find((s) => regimes.every((r) => ok(s, r))) ?? PIN_LABEL_SPOTS.find((s) => ok(s, "narrow")) ?? PIN_LABEL_SPOTS[0]!;
    for (const r of regimes) taken[r].push(pinLabelBox(p, spot, r));
    return spot;
  });

  // 3. Communes : grandes villes d'abord, dans l'ordre de la liste.
  const plans = new Map<string, CityLabelPlan>();
  const order = [...cities].sort((a, b) => Number(b.major) - Number(a.major));
  const narrowSize = region ? NARROW_SIZE.region : NARROW_SIZE.depot;
  for (const city of order) {
    const plan: CityLabelPlan = { showLabel: false, dx: city.dx, dy: city.dy, anchor: city.anchor, hideMid: false, narrow: "keep", narrowShift: 0 };
    plans.set(city.name, plan);
    if (!city.wanted) continue;

    // Taille normale (attribut `font-size` posé par PlanIdf).
    const size = city.major ? 14 : region ? 11.5 : 13;
    const width = estimateLabelWidth(city.name, size, city.major);
    const candidates: [number, Anchor][] = [[city.dx, city.anchor]];
    if (city.anchor !== "middle") candidates.push([flipDx(flip(city.anchor)), flip(city.anchor)]);
    const y = city.p.y + city.dy;
    const chosen = candidates.find(([dx, anchor]) => {
      const x = city.p.x + dx;
      return fitsX(extent(x, anchor, width)) && free(textBox(x, y, anchor, width, size), "wide");
    });
    if (!chosen) continue;
    [plan.dx, plan.anchor] = chosen;
    plan.showLabel = true;
    taken.wide.push(textBox(city.p.x + plan.dx, y, plan.anchor, width, size));

    // Disque de 521 à 760 px : même position, noms agrandis ; masqué s'il gêne.
    if (region) {
      const midSize = city.major ? 16 : 13;
      const midWidth = estimateLabelWidth(city.name, midSize, city.major);
      const box = textBox(city.p.x + plan.dx, y, plan.anchor, midWidth, midSize);
      if (fitsX(extent(city.p.x + plan.dx, plan.anchor, midWidth)) && free(box, "mid")) taken.mid.push(box);
      else plan.hideMid = true;
    }

    // Plan étroit : les communes secondaires du disque sont déjà masquées (kit.module.css).
    if (region && !city.major) continue;
    const nWidth = estimateLabelWidth(city.name, narrowSize, city.major);
    const verticalOk = y - narrowSize * 0.78 >= LABEL_MARGIN && y + narrowSize * 0.24 <= PLAN_SIZE - LABEL_MARGIN;
    const freeAt = (dx: number, anchor: Anchor) => {
      const x = city.p.x + dx;
      const box = textBox(x, y, anchor, nWidth, narrowSize);
      return verticalOk && fitsX(extent(x, anchor, nWidth)) && free(box, "narrow") ? box : null;
    };
    const keep = freeAt(plan.dx, plan.anchor);
    if (keep) {
      taken.narrow.push(keep);
      continue;
    }
    const other = flip(plan.anchor);
    const flipped = other === plan.anchor ? null : freeAt(flipDx(other), other);
    if (flipped) {
      taken.narrow.push(flipped);
      plan.narrow = "flip";
      plan.narrowShift = flipDx(other) - plan.dx;
    } else {
      plan.narrow = "hide";
    }
  }
  return { depotName, pointLabels, cities: plans };
}
