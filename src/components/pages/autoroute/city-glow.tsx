/**
 * Décor partagé des scènes de /panne-autoroute.
 *
 * Ville lointaine sur l'horizon des scènes de /panne-autoroute : silhouettes basses, quelques
 * fenêtres au sodium et la lueur orangée qu'elles donnent au bas du ciel (la lueur a sa source).
 * Dessinée dans le repère du SVG de la scène : elle reste collée à l'horizon quel que soit le
 * cadrage. Déterministe (même rendu à chaque fois), statique.
 */
import type { ReactElement } from "react";

/** Générateur pseudo-aléatoire déterministe (LCG). */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

export function CityGlow({
  id,
  x0,
  x1,
  horizon,
  maxHeight,
  seed = 7,
}: {
  id: string;
  x0: number;
  x1: number;
  horizon: number;
  maxHeight: number;
  seed?: number;
}): ReactElement {
  const rand = seeded(seed);
  let blocks = "";
  let windows = "";
  let x = x0;
  while (x < x1) {
    const w = 6 + rand() * 18;
    const tall = rand() > 0.82;
    const h = (tall ? 0.6 + rand() * 0.4 : 0.15 + rand() * 0.4) * maxHeight;
    blocks += `M${x.toFixed(1)} ${horizon}V${(horizon - h).toFixed(1)}H${(x + w).toFixed(1)}V${horizon}Z`;
    for (let wy = horizon - h + 3; wy < horizon - 2; wy += 4) {
      for (let wx = x + 2; wx < x + w - 2; wx += 3.5) {
        if (rand() > 0.86) windows += `M${wx.toFixed(1)} ${wy.toFixed(1)}h1.4v1.4h-1.4Z`;
      }
    }
    x += w + (rand() > 0.7 ? rand() * 8 : 0);
  }
  const span = x1 - x0;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="1" r="0.5">
          <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={x0 + span / 2} cy={horizon} rx={span * 0.62} ry={maxHeight * 3.2} fill={`url(#${id}-glow)`} />
      <path d={blocks} fill="var(--color-night-900)" />
      <path d={windows} fill="var(--color-sodium)" opacity="0.55" />
    </g>
  );
}

/**
 * Reflet vertical étiré d'une lumière sur la chaussée mouillée (B.5) : une ellipse fine, sans
 * arête, sous la source. Statique (sauf si son parent clignote, comme les feux de détresse).
 */
export function Streak({ x, y, width, height, fill }: { x: number; y: number; width: number; height: number; fill: string }): ReactElement {
  const r = (n: number) => Math.round(n * 10) / 10;
  return <ellipse cx={r(x)} cy={r(y + height / 2)} rx={r(width / 2)} ry={r(height / 2)} fill={fill} />;
}
