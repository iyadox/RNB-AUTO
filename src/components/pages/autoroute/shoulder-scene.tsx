"use client";

/**
 * /panne-autoroute, ouverture (docs/09, F.4) : la bande d'arrêt d'urgence, de nuit.
 *
 * Vue depuis la bande d'arrêt d'urgence, derrière la voiture en panne : feux de détresse à 1 Hz
 * (seule boucle de la scène, petites surfaces, pause hors écran), glissière et ses catadioptres,
 * passagers en pictogramme derrière la glissière, borne orange d'appel d'urgence, panneau bleu
 * générique (sans numéro), lampadaires au sodium du terre-plein, traînées de feux lointaines
 * STATIQUES (pose longue). Aucune dépanneuse : on est sur l'autoroute.
 *
 * Toute la géométrie passe par la même caméra (`perspective.ts`) : voies, glissière et décor
 * fuient vers un seul point. Composant client sans état (décision L9-F3-1) : la charge RSC ne
 * porte qu'une référence, pas le balisage SVG ; rendu serveur identique. Décoratif (`aria-hidden`).
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import { dashes, depth, posts, project, ribbon, scaleAt, type Camera } from "./perspective";
import { CityGlow, Streak } from "./city-glow";
import styles from "./autoroute.module.css";

/** viewBox 720 × 760 ; horizon à 300, point de fuite à 330 ; bas du cadre = premier plan. */
const CAM: Camera = { vpX: 330, horizon: 300, k: 120, camH: 460 / 120, d0: 6 };
const FAR = 900;

// Profil en travers (mètres, 0 = caméra, au milieu de la bande d'arrêt d'urgence).
const RAIL_X = 3.2;
const BAU_EDGE = 1.6;
const BAU_LINE = -1.3;
const LANES = [-4.8, -8.3];
const LEFT_EDGE = -11.8;
const MEDIAN = [-12.6, -12.2] as const;
const OPPOSITE = [-25, -13.2] as const;

/** Distance de l'arrière de la voiture (échelle 0,5 : la voiture occupe le milieu du cadre). */
const CAR_D = 6;
const CAR_X = 0.1;

const f = (n: number) => Math.round(n * 10) / 10;

/** Petit disque, à concaténer dans un seul tracé (un nœud SVG pour toute une série). */
const dot = (x: number, y: number, r: number) => `M${f(x - r)} ${y}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;

/** Face verticale (glissière, séparateur) entre deux hauteurs, le long d'une ligne. */
function wall(x: number, low: number, high: number, from: number, to: number) {
  const a = project(CAM, x, from, high);
  const b = project(CAM, x, to, high);
  const c = project(CAM, x, to, low);
  const d = project(CAM, x, from, low);
  return `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}L${d.x} ${d.y}Z`;
}

/** Rectangle vertical, face à la caméra, à la distance `d` (x0..x1, y0..y1 en mètres). */
function face(x0: number, x1: number, y0: number, y1: number, d: number) {
  const a = project(CAM, x0, d, y1);
  const b = project(CAM, x1, d, y0);
  return { x: a.x, y: a.y, width: f(b.x - a.x), height: f(b.y - a.y) };
}

/** Lampadaire du terre-plein : mât, crosse, tête, cône de lumière et flaque au sol. */
function Lamp({ d }: { d: number }) {
  const s = scaleAt(CAM, d);
  const foot = project(CAM, MEDIAN[1] - 0.2, d);
  const top = project(CAM, MEDIAN[1] - 0.2, d, 11.6);
  const head = project(CAM, -9.6, d, 11.2);
  const pool = project(CAM, -8.8, d);
  const coneL = project(CAM, -12, d);
  const coneR = project(CAM, -5.6, d);
  return (
    <g>
      <path
        d={`M${head.x} ${head.y}L${coneR.x} ${coneR.y}L${coneL.x} ${coneL.y}Z`}
        fill="url(#sh-cone)"
        opacity={Math.min(1, 0.4 + depth(CAM, d) * 2)}
      />
      <ellipse cx={pool.x} cy={pool.y} rx={f(4.2 * s)} ry={f(Math.max(1.5, 4.2 * s * 0.18))} fill="url(#sh-pool)" />
      {/* Reflet étiré sur la chaussée mouillée */}
      <Streak x={pool.x} y={pool.y} width={Math.max(1.2, 0.5 * s)} height={Math.min(44, Math.max(6, 2.4 * s))} fill="url(#sh-wet-sodium)" />
      <path
        d={`M${foot.x} ${foot.y}V${top.y}Q${top.x} ${f(top.y - 0.4 * s)} ${f(top.x + 0.6 * s)} ${f(top.y - 0.3 * s)}L${head.x} ${head.y}`}
        fill="none"
        stroke="var(--color-asphalt-700)"
        strokeWidth={f(Math.max(1, 0.22 * s))}
        strokeLinecap="round"
      />
      <rect x={f(head.x - 0.7 * s)} y={f(head.y - 0.12 * s)} width={f(1.1 * s)} height={f(Math.max(1.4, 0.24 * s))} rx="1" fill="var(--color-sodium)" />
      <circle cx={head.x} cy={f(head.y + 0.1 * s)} r={f(Math.max(3, 1.1 * s))} fill="url(#sh-bulb)" />
    </g>
  );
}

/** Traînée de feux en pose longue (rouge dans notre sens, xénon en face). Statique. */
function Trail({ x, from, to, height, width, fill, opacity }: { x: number; from: number; to: number; height: number; width: number; fill: string; opacity: number }) {
  return <path d={ribbon(CAM, x - width / 2, x + width / 2, from, to, 1, height)} fill={fill} opacity={opacity} />;
}

/** La voiture en panne, vue de l'arrière, feux de détresse allumés. */
function BrokenCar() {
  const s = scaleAt(CAM, CAR_D);
  const L = CAR_X - 0.9;
  const R = CAR_X + 0.9;
  const ground = project(CAM, CAR_X, CAR_D);
  const bumper = face(L - 0.02, R + 0.02, 0.24, 0.56, CAR_D);
  const panel = face(L, R, 0.54, 0.98, CAR_D);
  // Lunette arrière inclinée : le haut est plus loin (d + 0,45) et plus étroit.
  const wB1 = project(CAM, L + 0.12, CAR_D, 0.98);
  const wB2 = project(CAM, R - 0.12, CAR_D, 0.98);
  const wT1 = project(CAM, L + 0.3, CAR_D + 0.45, 1.36);
  const wT2 = project(CAM, R - 0.3, CAR_D + 0.45, 1.36);
  const rF1 = project(CAM, L + 0.26, CAR_D + 2.3, 1.42);
  const rF2 = project(CAM, R - 0.26, CAR_D + 2.3, 1.42);
  // Montants arrière (custode) : la lunette est sertie dans la caisse.
  const pL1 = project(CAM, L, CAR_D, 0.98);
  const pL2 = project(CAM, L + 0.2, CAR_D + 0.45, 1.38);
  const pR1 = project(CAM, R, CAR_D, 0.98);
  const pR2 = project(CAM, R - 0.2, CAR_D + 0.45, 1.38);
  const tyreL = face(L + 0.06, L + 0.32, 0, 0.3, CAR_D + 0.3);
  const tyreR = face(R - 0.32, R - 0.06, 0, 0.3, CAR_D + 0.3);
  const tailL = face(L, L + 0.42, 0.74, 0.9, CAR_D);
  const tailR = face(R - 0.42, R, 0.74, 0.9, CAR_D);
  const ambL = face(L + 0.02, L + 0.26, 0.6, 0.73, CAR_D);
  const ambR = face(R - 0.26, R - 0.02, 0.6, 0.73, CAR_D);
  const plate = face(CAR_X - 0.26, CAR_X + 0.26, 0.36, 0.48, CAR_D);
  const lampL = { x: f(ambL.x + ambL.width / 2), y: f(ambL.y + ambL.height / 2) };
  const lampR = { x: f(ambR.x + ambR.width / 2), y: f(ambR.y + ambR.height / 2) };
  return (
    <g>
      {/* Ombre portée et reflets fixes des feux rouges sur la chaussée mouillée */}
      <ellipse cx={ground.x} cy={f(ground.y + 2)} rx={f(1.15 * s)} ry={f(0.16 * s)} fill="var(--color-night-950)" opacity="0.85" />
      <Streak x={f(tailL.x + tailL.width / 2)} y={f(ground.y + 2)} width={0.14 * s} height={0.75 * s} fill="url(#sh-wet-red)" />
      <Streak x={f(tailR.x + tailR.width / 2)} y={f(ground.y + 2)} width={0.14 * s} height={0.75 * s} fill="url(#sh-wet-red)" />

      <rect {...tyreL} rx="3" fill="var(--color-night-950)" />
      <rect {...tyreR} rx="3" fill="var(--color-night-950)" />
      {/* Pavillon (vu un peu d'en haut), lunette, hayon, pare-chocs */}
      <path d={`M${pL2.x} ${pL2.y}L${rF1.x} ${rF1.y}L${rF2.x} ${rF2.y}L${pR2.x} ${pR2.y}Z`} fill="url(#sh-roof)" />
      <path
        d={`M${pL1.x} ${pL1.y}L${pL2.x} ${pL2.y}L${wT1.x} ${wT1.y}L${wB1.x} ${wB1.y}ZM${pR1.x} ${pR1.y}L${pR2.x} ${pR2.y}L${wT2.x} ${wT2.y}L${wB2.x} ${wB2.y}Z`}
        fill="var(--color-asphalt-800)"
      />
      <path d={`M${wB1.x} ${wB1.y}L${wT1.x} ${wT1.y}L${wT2.x} ${wT2.y}L${wB2.x} ${wB2.y}Z`} fill="url(#sh-glass)" stroke="var(--color-asphalt-700)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d={`M${f(wT1.x + 8)} ${f(wT1.y + 3)}L${f(wT1.x + 22)} ${f(wT1.y + 3)}L${f(wB1.x + 30)} ${f(wB1.y - 3)}L${f(wB1.x + 14)} ${f(wB1.y - 3)}Z`} fill="var(--color-xenon)" opacity="0.07" />
      <rect {...panel} rx="5" fill="url(#sh-body)" />
      <rect {...bumper} rx="6" fill="var(--color-asphalt-850)" />
      <path d={`M${panel.x + 4} ${f(panel.y + 1)}H${f(panel.x + panel.width - 4)}`} stroke="var(--color-sodium)" strokeOpacity="0.28" strokeWidth="1.2" />
      <rect {...plate} rx="1.5" fill="var(--color-chalk)" opacity="0.62" />
      {/* Liseré du lampadaire sur le pavillon et les montants (la source la plus proche) */}
      <path
        d={`M${pL1.x} ${pL1.y}L${pL2.x} ${pL2.y}L${rF1.x} ${rF1.y}M${rF2.x} ${rF2.y}L${pR2.x} ${pR2.y}L${pR1.x} ${pR1.y}`}
        fill="none"
        stroke="var(--color-sodium)"
        strokeOpacity="0.32"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Feux arrière (fixes) */}
      <rect {...tailL} rx="2" fill="var(--color-brake)" opacity="0.85" />
      <rect {...tailR} rx="2" fill="var(--color-brake)" opacity="0.85" />

      {/* Feux de détresse : 1 Hz, petites surfaces, avec leur halo et leur reflet au sol */}
      <g className="hazard">
        <ellipse cx={lampL.x} cy={lampL.y} rx={f(0.62 * s)} ry={f(0.42 * s)} fill="url(#sh-hazard-glow)" />
        <ellipse cx={lampR.x} cy={lampR.y} rx={f(0.62 * s)} ry={f(0.42 * s)} fill="url(#sh-hazard-glow)" />
        <rect {...ambL} rx="2" fill="var(--color-beacon-400)" />
        <rect {...ambR} rx="2" fill="var(--color-beacon-400)" />
        <Streak x={lampL.x} y={f(ground.y + 2)} width={0.16 * s} height={1.05 * s} fill="url(#sh-wet-amber)" />
        <Streak x={lampR.x} y={f(ground.y + 2)} width={0.16 * s} height={1.05 * s} fill="url(#sh-wet-amber)" />
      </g>
    </g>
  );
}

/** Passagers en pictogramme, derrière la glissière (adulte en gilet, enfant). */
function Passengers() {
  const people = [
    { x: 4.7, d: 7, h: 1.76, vest: true },
    { x: 5.5, d: 7.6, h: 1.26, vest: false },
  ];
  return (
    <g>
      {people.map((p) => {
        const s = scaleAt(CAM, p.d);
        const foot = project(CAM, p.x, p.d);
        const h = p.h * s;
        const w = p.h * 0.27 * s;
        const head = 0.075 * p.h * s;
        const body = `M${f(foot.x - w * 0.36)} ${foot.y}L${f(foot.x - w * 0.3)} ${f(foot.y - h * 0.46)}L${f(foot.x - w * 0.5)} ${f(foot.y - h * 0.5)}L${f(foot.x - w * 0.5)} ${f(foot.y - h * 0.76)}Q${f(foot.x - w * 0.5)} ${f(foot.y - h * 0.84)} ${f(foot.x - w * 0.36)} ${f(foot.y - h * 0.84)}H${f(foot.x + w * 0.36)}Q${f(foot.x + w * 0.5)} ${f(foot.y - h * 0.84)} ${f(foot.x + w * 0.5)} ${f(foot.y - h * 0.76)}L${f(foot.x + w * 0.5)} ${f(foot.y - h * 0.5)}L${f(foot.x + w * 0.3)} ${f(foot.y - h * 0.46)}L${f(foot.x + w * 0.36)} ${foot.y}Z`;
        return (
          <g key={p.x}>
            <ellipse cx={foot.x} cy={f(foot.y + 1)} rx={f(w * 0.7)} ry={f(Math.max(1.5, w * 0.12))} fill="var(--color-night-950)" opacity="0.7" />
            <path d={body} fill="var(--color-asphalt-700)" />
            <circle cx={foot.x} cy={f(foot.y - h * 0.84 - head * 1.25)} r={f(head)} fill="var(--color-asphalt-700)" />
            {p.vest ? (
              <g>
                <path
                  d={`M${f(foot.x - w * 0.46)} ${f(foot.y - h * 0.52)}V${f(foot.y - h * 0.8)}H${f(foot.x + w * 0.46)}V${f(foot.y - h * 0.52)}Z`}
                  fill="var(--color-signal-500)"
                  opacity="0.88"
                />
                <path
                  d={`M${f(foot.x - w * 0.46)} ${f(foot.y - h * 0.6)}H${f(foot.x + w * 0.46)}M${f(foot.x - w * 0.46)} ${f(foot.y - h * 0.68)}H${f(foot.x + w * 0.46)}`}
                  stroke="var(--color-reflect)"
                  strokeWidth={f(Math.max(1.2, 0.035 * s))}
                />
              </g>
            ) : null}
            {/* Liseré du lampadaire / des feux sur l'épaule */}
            <path d={`M${f(foot.x - w * 0.4)} ${f(foot.y - h * 0.83)}H${f(foot.x + w * 0.1)}`} stroke="var(--color-beacon-400)" strokeOpacity="0.45" strokeWidth="1.2" />
          </g>
        );
      })}
    </g>
  );
}

/** Borne orange d'appel d'urgence, derrière la glissière. */
function CallBox() {
  const d = 15;
  const s = scaleAt(CAM, d);
  const x = 3.95;
  const post = face(x - 0.05, x + 0.05, 0, 0.62, d);
  const box = face(x - 0.24, x + 0.24, 0.6, 1.36, d);
  const cap = face(x - 0.28, x + 0.28, 1.34, 1.42, d);
  const handset = project(CAM, x, d, 1.08);
  return (
    <g>
      <rect {...post} fill="var(--color-asphalt-600)" />
      <rect {...box} rx="2" fill="var(--color-beacon-500)" />
      <rect {...cap} rx="1" fill="var(--color-beacon-600)" />
      <rect x={box.x} y={f(box.y + box.height * 0.7)} width={box.width} height={f(Math.max(1.5, 0.06 * s))} fill="var(--color-reflect)" opacity="0.8" />
      <path
        d={`M${f(handset.x - 0.12 * s)} ${f(handset.y - 0.06 * s)}q${f(0.12 * s)} ${f(-0.12 * s)} ${f(0.24 * s)} 0`}
        fill="none"
        stroke="var(--color-asphalt-950)"
        strokeWidth={f(Math.max(1.6, 0.06 * s))}
        strokeLinecap="round"
      />
    </g>
  );
}

/** Panneau bleu générique, sans numéro ni nom : seulement une flèche de sortie et des lignes. */
function MotorwaySign() {
  const d = 30;
  const s = scaleAt(CAM, d);
  const postA = face(4.4, 4.55, 0, 2.3, d);
  const postB = face(7.95, 8.1, 0, 2.3, d);
  const panel = face(3.9, 8.6, 2.2, 4.8, d);
  const pad = 0.16 * s;
  const lineX = panel.x + panel.width * 0.12;
  return (
    <g>
      <rect {...postA} fill="var(--color-asphalt-600)" />
      <rect {...postB} fill="var(--color-asphalt-600)" />
      <rect {...panel} rx="2.5" fill="var(--color-motorway-600)" />
      <rect
        x={f(panel.x + pad)}
        y={f(panel.y + pad)}
        width={f(panel.width - 2 * pad)}
        height={f(panel.height - 2 * pad)}
        rx="1.5"
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth={f(Math.max(1.2, 0.08 * s))}
      />
      <path
        d={`M${f(lineX)} ${f(panel.y + panel.height * 0.36)}h${f(panel.width * 0.46)}M${f(lineX)} ${f(panel.y + panel.height * 0.6)}h${f(panel.width * 0.34)}`}
        stroke="var(--color-chalk)"
        strokeOpacity="0.85"
        strokeWidth={f(Math.max(2, 0.28 * s))}
        strokeLinecap="round"
      />
      <path
        d={`M${f(panel.x + panel.width * 0.72)} ${f(panel.y + panel.height * 0.74)}l${f(panel.width * 0.14)} ${f(-panel.height * 0.42)}m${f(-panel.width * 0.09)} 0h${f(panel.width * 0.09)}v${f(panel.height * 0.2)}`}
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth={f(Math.max(2, 0.24 * s))}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Le panneau renvoie la lumière des phares : très léger reflet en bas */}
      <rect x={panel.x} y={f(panel.y + panel.height)} width={panel.width} height={f(0.9 * s)} fill="url(#sh-sign-wet)" />
    </g>
  );
}

export function ShoulderScene({ className }: { className?: string }): ReactElement {
  const rail = { low: 0.52, high: 0.82 };
  // Catadioptres de la glissière : ceux qui sont près de la voiture renvoient l'orange des
  // feux de détresse (même rythme), les autres restent blancs et fixes.
  let reflectorsFar = "";
  let reflectorsNear = "";
  for (let d = 8; d < 260; d += 8) {
    const p = project(CAM, RAIL_X - 0.02, d, 0.67);
    const r = Math.max(0.6, 0.05 * scaleAt(CAM, d));
    if (d >= 4 && d <= 16) reflectorsNear += dot(p.x, p.y, r * 1.3);
    else reflectorsFar += dot(p.x, p.y, r);
  }
  let medianDots = "";
  for (let d = 4; d < 300; d += 12) {
    const p = project(CAM, MEDIAN[1] + 0.01, d, 0.55);
    medianDots += dot(p.x, p.y, Math.max(0.5, 0.045 * scaleAt(CAM, d)));
  }

  const road = ribbon(CAM, LEFT_EDGE, RAIL_X, 0, FAR);
  const bau = ribbon(CAM, BAU_LINE, RAIL_X, 0, FAR);
  const bank = ribbon(CAM, RAIL_X, 40, 0, FAR);
  const opposite = ribbon(CAM, OPPOSITE[0], OPPOSITE[1], 0, FAR);

  return (
    <div className={cn(styles.shoulder, className)} aria-hidden="true" data-pause-offscreen="">
      <svg className={styles.shoulderSvg} viewBox="0 0 720 760" preserveAspectRatio="xMaxYMax slice">
        <defs>
          <linearGradient id="sh-asphalt" x1="0" y1="300" x2="0" y2="760" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-night-800)" />
            <stop offset="0.25" stopColor="var(--color-night-900)" />
            <stop offset="1" stopColor="var(--color-night-950)" />
          </linearGradient>
          <linearGradient id="sh-bank" x1="0" y1="300" x2="0" y2="760" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-night-900)" />
            <stop offset="1" stopColor="var(--color-night-950)" />
          </linearGradient>
          <linearGradient id="sh-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.26" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0.01" />
          </linearGradient>
          <radialGradient id="sh-pool">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sh-bulb">
            <stop offset="0" stopColor="var(--color-reflect)" stopOpacity="0.9" />
            <stop offset="0.3" stopColor="var(--color-sodium)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sh-wet-sodium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sh-wet-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-brake)" stopOpacity="0.4" />
            <stop offset="1" stopColor="var(--color-brake)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sh-wet-amber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-beacon-400)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--color-beacon-400)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="sh-hazard-glow">
            <stop offset="0" stopColor="var(--color-beacon-400)" stopOpacity="0.75" />
            <stop offset="0.35" stopColor="var(--color-beacon-500)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--color-beacon-500)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sh-trail-red" x1="0" y1="300" x2="0" y2="560" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-brake)" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="var(--color-brake)" stopOpacity="0.6" />
            <stop offset="1" stopColor="var(--color-brake)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sh-trail-white" x1="0" y1="300" x2="0" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-xenon)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--color-xenon)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sh-roof" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-asphalt-800)" />
            <stop offset="1" stopColor="var(--color-asphalt-850)" />
          </linearGradient>
          <linearGradient id="sh-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-night-800)" />
            <stop offset="1" stopColor="var(--color-night-950)" />
          </linearGradient>
          <linearGradient id="sh-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-asphalt-800)" />
            <stop offset="1" stopColor="var(--color-asphalt-900)" />
          </linearGradient>
          <linearGradient id="sh-sign-wet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-motorway-600)" stopOpacity="0.25" />
            <stop offset="1" stopColor="var(--color-motorway-600)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <CityGlow id="sh-city" x0={-40} x1={760} horizon={300} maxHeight={30} seed={11} />

        {/* Chaussées, accotement et talus */}
        <path d={opposite} fill="url(#sh-asphalt)" opacity="0.8" />
        <path d={road} fill="url(#sh-asphalt)" />
        <path d={bau} fill="var(--color-night-950)" opacity="0.35" />
        <path d={bank} fill="url(#sh-bank)" />

        {/* Marquages : rive gauche continue, voies en tirets (3 m / 10 m), ligne large de la
            bande d'arrêt d'urgence, rive droite */}
        <g fill="var(--color-chalk)">
          <path d={ribbon(CAM, LEFT_EDGE, LEFT_EDGE + 0.15, 0, FAR)} opacity="0.35" />
          {LANES.map((x) => (
            <path key={x} d={dashes(CAM, x, 0.15, 3, 10, 0, 320, 4)} opacity="0.5" />
          ))}
          <path d={dashes(CAM, BAU_LINE, 0.3, 3.5, 3.5, 0, 260)} opacity="0.62" />
          <path d={ribbon(CAM, BAU_EDGE, BAU_EDGE + 0.12, 0, FAR)} opacity="0.22" />
          <path d={dashes(CAM, -19.2, 0.15, 3, 10, 0, 320)} opacity="0.2" />
        </g>

        {/* Traînées de feux lointaines : pose longue, statiques */}
        <g>
          {[-3.05, -6.55, -10.05].flatMap((lane, i) =>
            [-0.7, 0.7].map((side) => (
              <Trail key={`${lane}${side}`} x={lane + side} from={9 + i * 7} to={FAR} height={0.75} width={0.09} fill="url(#sh-trail-red)" opacity={0.75 - i * 0.12} />
            )),
          )}
          {[-15.3, -18.6, -22].flatMap((lane) =>
            [-0.7, 0.7].map((side) => (
              <Trail key={`${lane}${side}`} x={lane + side} from={30} to={FAR} height={0.65} width={0.1} fill="url(#sh-trail-white)" opacity={0.7} />
            )),
          )}
        </g>

        {/* Terre-plein central : séparateur en béton et ses catadioptres */}
        <path d={wall(MEDIAN[1], 0, 0.8, 0, FAR)} fill="var(--color-asphalt-800)" />
        <path d={wall(MEDIAN[1], 0.72, 0.8, 0, FAR)} fill="var(--color-asphalt-600)" opacity="0.6" />
        <path d={medianDots} fill="var(--color-reflect)" opacity="0.55" />

        {/* Lampadaires au sodium du terre-plein (statiques) */}
        {[176, 126, 76, 26].map((d) => (
          <Lamp key={d} d={d} />
        ))}

        <MotorwaySign />
        <CallBox />

        {/* Glissière : lisse, montants, catadioptres */}
        <path d={posts(CAM, RAIL_X + 0.05, rail.high, 4, 0, 200)} stroke="var(--color-asphalt-600)" strokeWidth="2" />
        <path d={wall(RAIL_X, rail.low, rail.high, 0, FAR)} fill="var(--color-asphalt-500)" />
        <path d={wall(RAIL_X, rail.high - 0.06, rail.high, 0, FAR)} fill="var(--color-reflect)" opacity="0.35" />
        <path d={wall(RAIL_X, rail.low, rail.low + 0.05, 0, FAR)} fill="var(--color-night-950)" opacity="0.6" />
        <path d={reflectorsFar} fill="var(--color-reflect)" opacity="0.8" />

        <Passengers />
        <BrokenCar />
        <path className="hazard" d={reflectorsNear} fill="var(--color-beacon-400)" />
      </svg>
    </div>
  );
}
