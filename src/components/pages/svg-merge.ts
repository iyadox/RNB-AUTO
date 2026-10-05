/**
 * Fusion de formes SVG répétées en un seul tracé (temps de blocage, docs/09 G.2).
 *
 * Un décor fait de dizaines de petits `<rect>` ou `<path>` identiques coûte un élément chacun au
 * calcul des styles et à la mise en page, à chaque recalcul de la page pendant le chargement.
 * Quand les formes ne se chevauchent pas et partagent le même style, un seul `<path>` aux
 * sous-tracés multiples donne la même image (seul l'anticrénelage peut varier au sous-pixel).
 * Fonctions pures, calculées au rendu serveur.
 */

const n = (v: number) => Number(v.toFixed(2));

/**
 * Tracé d'un rectangle à coins arrondis, identique à `<rect x y width height rx>` : même point de
 * départ (x + rx, y) et même sens (horaire) que la forme équivalente définie par SVG 2, donc même
 * contour et mêmes tirets éventuels.
 */
export function roundedRectPath(x: number, y: number, width: number, height: number, radius = 0): string {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  if (r === 0) return `M${n(x)} ${n(y)}H${n(x + width)}V${n(y + height)}H${n(x)}Z`;
  const arc = (tx: number, ty: number) => `A${n(r)} ${n(r)} 0 0 1 ${n(tx)} ${n(ty)}`;
  return (
    `M${n(x + r)} ${n(y)}H${n(x + width - r)}${arc(x + width, y + r)}` +
    `V${n(y + height - r)}${arc(x + width - r, y + height)}` +
    `H${n(x + r)}${arc(x, y + height - r)}` +
    `V${n(y + r)}${arc(x + r, y)}Z`
  );
}
