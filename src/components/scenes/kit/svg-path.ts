/**
 * Outils géométriques purs pour les illustrations du kit (aucun accès au navigateur) :
 * - `smoothPath` : courbe douce (Catmull-Rom → Bézier cubiques) passant par des points ;
 * - `pathEnd` : point d'arrivée et cap (degrés) d'un attribut `d`, pour poser un véhicule
 *   à l'arrivée d'un trajet dès le rendu serveur (état final, sans JavaScript) ;
 * - `viewBoxRatio` : proportions d'un `viewBox`, en valeur CSS `aspect-ratio`.
 */

export type Point = { x: number; y: number };

/**
 * Proportions d'un `viewBox` (« 0 20 640 220 » → « 640 / 220 »), pour la propriété CSS
 * `aspect-ratio` d'un `<svg>` en `content-visibility: auto` : tant que le dessin est sauté (loin
 * de l'écran), le navigateur ignore les proportions naturelles du `viewBox` ; écrites en CSS, la
 * hauteur reste exactement la même. `undefined` si le `viewBox` est invalide.
 */
export function viewBoxRatio(viewBox: string): string | undefined {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number);
  const [, , width, height] = parts;
  if (parts.length !== 4 || !width || !height || !(width > 0) || !(height > 0)) return undefined;
  return `${width} / ${height}`;
}

const fmt = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? "0" : String(rounded);
};

/** Courbe qui passe par tous les points. `tension` 0,5 = Catmull-Rom classique. */
export function smoothPath(points: readonly Point[], closed = false, tension = 0.5): string {
  const n = points.length;
  if (n === 0) return "";
  const first = points[0]!;
  if (n === 1) return `M${fmt(first.x)} ${fmt(first.y)}`;
  if (n === 2) return `M${fmt(first.x)} ${fmt(first.y)}L${fmt(points[1]!.x)} ${fmt(points[1]!.y)}`;
  const at = (i: number): Point => {
    if (closed) return points[((i % n) + n) % n]!;
    return points[Math.max(0, Math.min(n - 1, i))]!;
  };
  const k = tension / 3;
  let d = `M${fmt(first.x)} ${fmt(first.y)}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k };
    const c2 = { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k };
    d += `C${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(p2.x)} ${fmt(p2.y)}`;
  }
  return closed ? `${d}Z` : d;
}

/**
 * Point d'arrivée et cap (en degrés, 0 = vers la droite, sens horaire comme en SVG) d'un
 * chemin. Gère M, L, H, V, C, S, Q, T, A et Z, en absolu comme en relatif.
 */
export function pathEnd(d: string): { x: number; y: number; angle: number } {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  // Dernière direction non nulle (de → vers).
  let dirFrom: Point = { x: 0, y: 0 };
  let dirTo: Point = { x: 1, y: 0 };
  const isCommand = (t: string | undefined) => t !== undefined && /^[a-zA-Z]$/.test(t);
  const num = () => Number(tokens[i++]);
  const move = (fromX: number, fromY: number, cx: number, cy: number, toX: number, toY: number) => {
    // Tangente d'arrivée : du dernier point de contrôle distinct vers le point final.
    if (cx !== toX || cy !== toY) {
      dirFrom = { x: cx, y: cy };
      dirTo = { x: toX, y: toY };
    } else if (fromX !== toX || fromY !== toY) {
      dirFrom = { x: fromX, y: fromY };
      dirTo = { x: toX, y: toY };
    }
    x = toX;
    y = toY;
  };
  while (i < tokens.length) {
    if (isCommand(tokens[i])) cmd = tokens[i++]!;
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case "M": {
        const nx = num() + ox;
        const ny = num() + oy;
        x = nx;
        y = ny;
        startX = nx;
        startY = ny;
        cmd = rel ? "l" : "L";
        break;
      }
      case "L":
      case "T": {
        const nx = num() + ox;
        const ny = num() + oy;
        move(x, y, x, y, nx, ny);
        break;
      }
      case "H": {
        const nx = num() + ox;
        move(x, y, x, y, nx, y);
        break;
      }
      case "V": {
        const ny = num() + oy;
        move(x, y, x, y, x, ny);
        break;
      }
      case "C": {
        num();
        num();
        const c2x = num() + ox;
        const c2y = num() + oy;
        const nx = num() + ox;
        const ny = num() + oy;
        move(x, y, c2x, c2y, nx, ny);
        break;
      }
      case "S":
      case "Q": {
        const cx = num() + ox;
        const cy = num() + oy;
        const nx = num() + ox;
        const ny = num() + oy;
        move(x, y, cx, cy, nx, ny);
        break;
      }
      case "A": {
        num();
        num();
        num();
        num();
        num();
        const nx = num() + ox;
        const ny = num() + oy;
        move(x, y, x, y, nx, ny);
        break;
      }
      case "Z": {
        move(x, y, x, y, startX, startY);
        break;
      }
      default:
        i++;
    }
  }
  const angle = (Math.atan2(dirTo.y - dirFrom.y, dirTo.x - dirFrom.x) * 180) / Math.PI;
  return { x, y, angle: Math.round(angle * 100) / 100 + 0 };
}

/** Écrit « translate(x y) rotate(a) » avec des valeurs arrondies. */
export function poseTransform(x: number, y: number, angle = 0): string {
  return angle ? `translate(${fmt(x)} ${fmt(y)}) rotate(${fmt(angle)})` : `translate(${fmt(x)} ${fmt(y)})`;
}

export { fmt as formatSvgNumber };
