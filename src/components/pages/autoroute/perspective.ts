/**
 * Perspective des scènes de /panne-autoroute (calcul pur, au rendu serveur).
 *
 * Une caméra regarde la route droit devant. Un point du sol est donné par son décalage latéral
 * `x` (en mètres, positif à droite) et sa distance `d` devant la caméra (en mètres). Toutes les
 * lignes de la route (voies, bande d'arrêt d'urgence, glissière) passent par le même point de
 * fuite : la scène reste juste à toutes les tailles, sans dessin fait à la main.
 */

export type Camera = {
  /** Point de fuite : abscisse et ligne d'horizon, en unités du viewBox. */
  vpX: number;
  horizon: number;
  /** Pixels par mètre au premier plan (d = 0). */
  k: number;
  /** Hauteur de la caméra en mètres. */
  camH: number;
  /** Distance du premier plan en mètres (règle la profondeur apparente). */
  d0: number;
};

export type Point = { x: number; y: number };

const round = (value: number) => Math.round(value * 10) / 10;

/** Facteur d'échelle à la distance `d` (1 au premier plan, vers 0 à l'horizon). */
export const depth = (cam: Camera, d: number) => cam.d0 / (cam.d0 + Math.max(0, d));

/** Distance à laquelle l'échelle vaut `t`. */
export const distanceAt = (cam: Camera, t: number) => cam.d0 / t - cam.d0;

/** Projette un point (x latéral, d distance, y hauteur au-dessus du sol), en mètres. */
export function project(cam: Camera, x: number, d: number, y = 0): Point {
  const t = depth(cam, d);
  return { x: round(cam.vpX + x * cam.k * t), y: round(cam.horizon + (cam.camH - y) * cam.k * t) };
}

/** Pixels par mètre à la distance `d`. */
export const scaleAt = (cam: Camera, d: number) => cam.k * depth(cam, d);

const toPath = (points: Point[]) => `M${points.map((p) => `${p.x} ${p.y}`).join("L")}Z`;

type Lateral = number | ((d: number) => number);
const at = (lateral: Lateral, d: number) => (typeof lateral === "number" ? lateral : lateral(d));

/**
 * Ruban au sol entre deux bords latéraux, de `from` à `to` mètres. Les bords peuvent être des
 * fonctions de la distance (bretelle qui s'écarte) : on échantillonne alors `steps` points.
 */
export function ribbon(cam: Camera, left: Lateral, right: Lateral, from: number, to: number, steps = 1, height = 0): string {
  const ds: number[] = [];
  for (let i = 0; i <= steps; i++) ds.push(from + ((to - from) * i) / steps);
  const near = ds.map((d) => project(cam, at(left, d), d, height));
  const far = ds
    .slice()
    .reverse()
    .map((d) => project(cam, at(right, d), d, height));
  return toPath([...near, ...far]);
}

/** Ligne peinte en tirets (`on` mètres peints, `off` mètres vides), en un seul tracé. */
export function dashes(cam: Camera, x: Lateral, width: number, on: number, off: number, from: number, to: number, phase = 0): string {
  let path = "";
  for (let d = from - phase; d < to; d += on + off) {
    const a = Math.max(from, d);
    const b = Math.min(to, d + on);
    if (b <= a) continue;
    const curved = typeof x !== "number";
    const centre = (dd: number) => at(x, dd);
    path += ribbon(
      cam,
      (dd) => centre(dd) - width / 2,
      (dd) => centre(dd) + width / 2,
      a,
      b,
      curved ? 2 : 1,
    );
  }
  return path;
}

/** Montants verticaux (poteaux de glissière) tous les `every` mètres, en un seul tracé. */
export function posts(cam: Camera, x: number, height: number, every: number, from: number, to: number): string {
  let path = "";
  for (let d = from; d <= to; d += every) {
    const base = project(cam, x, d);
    const top = project(cam, x, d, height);
    path += `M${base.x} ${base.y}V${top.y}`;
  }
  return path;
}

/** Tracé ouvert qui suit le sol (axe d'une voie), échantillonné. */
export function groundLine(cam: Camera, x: Lateral, from: number, to: number, steps = 12, height = 0): string {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const d = from + ((to - from) * i) / steps;
    points.push(project(cam, at(x, d), d, height));
  }
  return `M${points.map((p) => `${p.x} ${p.y}`).join("L")}`;
}
