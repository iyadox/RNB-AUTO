/**
 * Ouverture de /questions-frequentes (docs/09, F.5, PK 00) : « la route en point d'interrogation ».
 *
 * Un quartier de nuit vu de dessus ; une route dessine un grand « ? », et le point du « ? » est le
 * losange du dépôt. Des lampadaires au sodium éclairent la chaussée. La dépanneuse (vue de dessus,
 * phares allumés) parcourt la route une fois (6 s, scène `question-road`) puis se gare au dépôt.
 *
 * État de base = état final : sans JavaScript, en `off` ou si la scène échoue, la dépanneuse est
 * garée au dépôt. Tout est décoratif (`aria-hidden`) : le titre dit la même chose.
 * Géométrie calculée ici, côté serveur (aucun calcul dans le navigateur avant la scène).
 */
import type { ReactElement } from "react";
import { DepotGlyph, TruckTopGlyph } from "@/components/scenes/kit/glyphs";
import styles from "./faq.module.css";

type Point = { x: number; y: number };
type Cubic = [Point, Point, Point, Point];

const p = (x: number, y: number): Point => ({ x, y });

/** Le « ? » : boucle du haut, courbe vers le centre, fût vertical (repère 720 × 560). */
const ROAD: Cubic[] = [
  [p(262, 226), p(250, 140), p(300, 76), p(366, 76)],
  [p(366, 76), p(440, 76), p(482, 126), p(482, 186)],
  [p(482, 186), p(482, 248), p(436, 276), p(398, 296)],
  [p(398, 296), p(370, 311), p(360, 330), p(360, 364)],
  [p(360, 364), p(360, 377), p(360, 391), p(360, 404)],
];
/** Allée du dépôt : du bas du fût jusqu'au point du « ? ». */
const DRIVEWAY: Cubic = [p(360, 404), p(360, 410), p(360, 416), p(360, 422)];
const DEPOT = p(360, 494);
/** Position garée (fin de l'allée), tournée vers le dépôt. Identique à la fin du tracé. */
export const PARKED_TRANSFORM = "translate(360 422) rotate(90)";

const f = (n: number) => Number(n.toFixed(1));

function bezier([a, b, c, d]: Cubic, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}
function tangent([a, b, c, d]: Cubic, t: number): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x),
    y: 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y),
  };
}
const pathOf = (segments: Cubic[]) =>
  `M${segments[0]![0].x} ${segments[0]![0].y}` + segments.map(([, b, c, d]) => `C${b.x} ${b.y} ${c.x} ${c.y} ${d.x} ${d.y}`).join("");

const ROAD_D = pathOf(ROAD);
const ROUTE_D = pathOf([...ROAD, DRIVEWAY]);
const DRIVEWAY_D = pathOf([DRIVEWAY]);

/** Points échantillonnés le long de la route (écartement des immeubles). */
const SAMPLES: Point[] = ROAD.flatMap((segment) => Array.from({ length: 16 }, (_, i) => bezier(segment, i / 16)));

/** Lampadaires : segment, position sur le segment, côté (1 = extérieur de la boucle). */
const LAMPS: { seg: number; t: number; side: 1 | -1 }[] = [
  { seg: 0, t: 0.3, side: 1 },
  { seg: 0, t: 0.95, side: 1 },
  { seg: 1, t: 0.62, side: 1 },
  { seg: 2, t: 0.55, side: 1 },
  { seg: 3, t: 0.62, side: -1 },
];

function lampPose({ seg, t, side }: (typeof LAMPS)[number]) {
  const at = bezier(ROAD[seg]!, t);
  const tan = tangent(ROAD[seg]!, t);
  const len = Math.hypot(tan.x, tan.y) || 1;
  // Normale « à gauche » du sens de marche : l'extérieur de la boucle.
  const nx = (tan.y / len) * side;
  const ny = (-tan.x / len) * side;
  return {
    base: p(f(at.x + nx * 36), f(at.y + ny * 36)),
    head: p(f(at.x + nx * 14), f(at.y + ny * 14)),
    pool: p(f(at.x + nx * 6), f(at.y + ny * 6)),
  };
}

/** Immeubles du quartier : grille régulière, sauf là où passe la route ou le dépôt. */
function blocks() {
  const list: { x: number; y: number; w: number; h: number; lit: number[] }[] = [];
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 8; row++) {
      const x = 4 + col * 74;
      const y = 6 + row * 72;
      const w = 56 + ((col * 7 + row * 3) % 3) * 4;
      const h = 50 + ((col + row * 5) % 2) * 6;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const nearRoad = SAMPLES.some((s) => Math.abs(s.x - cx) < w / 2 + 30 && Math.abs(s.y - cy) < h / 2 + 30);
      // Cour du dépôt : dégagée autour du losange et à sa droite, où s'inscrit la ville.
      const nearDepot = (Math.abs(DEPOT.x - cx) < w / 2 + 40 && cy > 380) || (cx > DEPOT.x && cx - DEPOT.x < w / 2 + 150 && cy > 440);
      if (nearRoad || nearDepot) continue;
      // Quelques fenêtres allumées, réparties sans hasard (rendu identique à chaque fois).
      const seed = (col * 13 + row * 7) % 5;
      const lit = seed === 0 ? [0, 2] : seed === 2 ? [1] : seed === 4 ? [0, 1, 3] : [];
      list.push({ x, y, w, h, lit });
    }
  }
  return list;
}
const BLOCKS = blocks();

export function QuestionRoad({ depotCity }: { depotCity: string | null }): ReactElement {
  return (
    <div className={styles.qr} data-scene="question-road" data-pause-offscreen aria-hidden="true">
      <svg className={styles.qrSvg} viewBox="0 0 720 560" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="qr-pool">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.42" />
            <stop offset="0.55" stopColor="var(--color-sodium)" stopOpacity="0.12" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="qr-depot-glow">
            <stop offset="0" stopColor="var(--color-signal-500)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--color-signal-500)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Quartier : îlots sombres, quelques fenêtres au sodium */}
        <g>
          {BLOCKS.map((b) => (
            <g key={`${b.x}-${b.y}`}>
              <rect className={styles.qrBlock} x={b.x} y={b.y} width={b.w} height={b.h} rx="3" />
              {b.lit.map((i) => (
                <rect key={i} className={styles.qrWindow} x={b.x + 9 + i * 11} y={b.y + 10 + (i % 2) * 16} width="5" height="3" rx="1" opacity={0.5 + (i % 2) * 0.3} />
              ))}
            </g>
          ))}
        </g>

        {/* Lueur du dépôt, le point du « ? » */}
        <circle cx={DEPOT.x} cy={DEPOT.y} r="86" fill="url(#qr-depot-glow)" />

        {/* La route en « ? » : ombre, rives, chaussée, axe en tirets */}
        <path d={ROAD_D} fill="none" stroke="var(--color-night-950)" strokeOpacity="0.7" strokeWidth="64" strokeLinecap="round" />
        <path d={ROAD_D} fill="none" stroke="var(--color-chalk)" strokeOpacity="0.32" strokeWidth="48" strokeLinecap="round" />
        <path d={ROAD_D} fill="none" stroke="var(--color-asphalt-850)" strokeWidth="44" strokeLinecap="round" />
        <path d={ROAD_D} fill="none" stroke="var(--color-chalk)" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="12 14" />
        {/* Allée du dépôt, plus étroite */}
        <path d={DRIVEWAY_D} fill="none" stroke="var(--color-asphalt-850)" strokeWidth="26" />
        <path d={DRIVEWAY_D} fill="none" stroke="var(--color-chalk)" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="4 6" transform="translate(-14 0)" />
        <path d={DRIVEWAY_D} fill="none" stroke="var(--color-chalk)" strokeOpacity="0.28" strokeWidth="1.5" strokeDasharray="4 6" transform="translate(14 0)" />

        {/* Lampadaires : flaque sur la chaussée, crosse, tête au sodium */}
        {LAMPS.map((lamp) => {
          const pose = lampPose(lamp);
          return (
            <g key={`${lamp.seg}-${lamp.t}`}>
              <circle cx={pose.pool.x} cy={pose.pool.y} r="40" fill="url(#qr-pool)" />
              <path d={`M${pose.base.x} ${pose.base.y}L${pose.head.x} ${pose.head.y}`} stroke="var(--color-asphalt-600)" strokeWidth="3" strokeLinecap="round" />
              <circle cx={pose.base.x} cy={pose.base.y} r="3.5" fill="var(--color-asphalt-700)" />
              <circle cx={pose.head.x} cy={pose.head.y} r="4" fill="var(--color-sodium)" />
            </g>
          );
        })}

        {/* Tracé suivi par la dépanneuse (invisible) */}
        <path data-qr-route="" d={ROUTE_D} fill="none" stroke="none" />

        {/* Le dépôt, point du « ? » */}
        <g transform={`translate(${DEPOT.x} ${DEPOT.y}) scale(1.6)`}>
          <DepotGlyph pulse />
        </g>
        {depotCity ? (
          <text
            className={styles.qrCity}
            x={DEPOT.x + 44}
            y={DEPOT.y + 5}
            textAnchor="start"
            fontSize="13"
            fill="var(--color-chalk)"
            fillOpacity="0.72"
          >
            {depotCity.toUpperCase()}
          </text>
        ) : null}

        {/* La dépanneuse : garée au dépôt (état final) ; la scène lui fait parcourir le « ? » */}
        <g className={styles.qrTruck} data-qr-truck="" transform={PARKED_TRANSFORM}>
          <g transform="scale(1.2)">
            <TruckTopGlyph headlights />
          </g>
        </g>
      </svg>
    </div>
  );
}
