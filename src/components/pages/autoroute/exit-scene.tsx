"use client";

/**
 * /panne-autoroute, PK 02 : la sortie (docs/09, F.4).
 *
 * Vue depuis la bretelle de sortie, de nuit : l'autoroute file tout droit à gauche (lumière
 * froide, traînées de feux statiques) ; la bretelle s'en écarte vers la droite, passe le panneau
 * bleu générique « SORTIE » (sans numéro) et entre dans la lumière au sodium de la route
 * ordinaire. Le trajet jaune de votre véhicule ne commence qu'APRÈS le panneau : c'est là que
 * RNB AUTO prend le relais (losange). Aucune dépanneuse sur l'autoroute.
 *
 * Seul mouvement : le trajet jaune se trace une fois à l'entrée (P10, mode `view`, sans GSAP).
 * Sans JavaScript et en `off` : tracé complet. Composant client sans état (décision L9-F3-1 :
 * la charge RSC ne porte qu'une référence) ; rendu serveur identique. Décoratif (`aria-hidden`).
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import { dashes, groundLine, posts, project, ribbon, scaleAt, type Camera } from "./perspective";
import { CityGlow, Streak } from "./city-glow";
import styles from "./autoroute.module.css";

/** Repère 960 × 540 (horizon à 210), cadré sur la sortie : viewBox 120 100 760 400 (centré sur la bretelle, pour que le recadrage du téléphone garde le panneau et le losange ; le premier plan vide est coupé). */
const CAM: Camera = { vpX: 420, horizon: 210, k: 110, camH: 6, d0: 6 };
const FAR = 900;

/** Écart de la bretelle vers la droite (mètres), selon la distance. */
const offset = (d: number) => (d < 12 ? 0 : 0.0026 * (d - 12) ** 2);
const rampLeft = (d: number) => -0.5 + offset(d);
const rampRight = (d: number) => 3.7 + offset(d) * 1.04;
const rampCentre = (d: number) => 1.6 + offset(d) * 1.02;
const rampRail = (d: number) => 4.9 + offset(d) * 1.05;
const RAMP_END = 150;

const f = (n: number) => Math.round(n * 10) / 10;

function RampLamp({ d }: { d: number }) {
  const s = scaleAt(CAM, d);
  const x = rampRail(d) + 0.6;
  const foot = project(CAM, x, d);
  const top = project(CAM, x, d, 10);
  const head = project(CAM, x - 2.2, d, 9.7);
  const pool = project(CAM, rampCentre(d), d);
  const coneL = project(CAM, rampLeft(d) - 1, d);
  const coneR = project(CAM, rampRight(d) + 1.2, d);
  return (
    <g>
      <path d={`M${head.x} ${head.y}L${coneR.x} ${coneR.y}L${coneL.x} ${coneL.y}Z`} fill="url(#ex-cone)" />
      <ellipse cx={pool.x} cy={pool.y} rx={f(3.8 * s)} ry={f(Math.max(1.4, 3.8 * s * 0.2))} fill="url(#ex-pool)" />
      <Streak x={pool.x} y={pool.y} width={Math.max(1, 0.4 * s)} height={Math.min(50, Math.max(5, 2.2 * s))} fill="url(#ex-wet)" />
      <path
        d={`M${foot.x} ${foot.y}V${top.y}L${head.x} ${head.y}`}
        fill="none"
        stroke="var(--color-asphalt-700)"
        strokeWidth={f(Math.max(1, 0.2 * s))}
        strokeLinecap="round"
      />
      <circle cx={head.x} cy={f(head.y + 0.1 * s)} r={f(Math.max(2.5, 0.9 * s))} fill="url(#ex-bulb)" />
    </g>
  );
}

/** Panneau bleu générique au nez de la bretelle : « SORTIE » et une flèche, sans numéro. */
function ExitSign() {
  const d = 22;
  const s = scaleAt(CAM, d);
  const cx = -0.5 + offset(d) / 2;
  const postA = project(CAM, cx - 1.2, d);
  const postB = project(CAM, cx + 1.2, d);
  const panelTL = project(CAM, cx - 2.3, d, 4.6);
  const panelBR = project(CAM, cx + 2.3, d, 2.4);
  const w = panelBR.x - panelTL.x;
  const h = panelBR.y - panelTL.y;
  return (
    <g>
      <path d={`M${postA.x} ${postA.y}V${panelBR.y}M${postB.x} ${postB.y}V${panelBR.y}`} stroke="var(--color-asphalt-600)" strokeWidth={f(Math.max(1.5, 0.14 * s))} />
      <rect x={panelTL.x} y={panelTL.y} width={f(w)} height={f(h)} rx="3" fill="var(--color-motorway-600)" />
      <rect
        x={f(panelTL.x + 0.14 * s)}
        y={f(panelTL.y + 0.14 * s)}
        width={f(w - 0.28 * s)}
        height={f(h - 0.28 * s)}
        rx="2"
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth={f(Math.max(1.2, 0.07 * s))}
      />
      <text
        x={f(panelTL.x + w * 0.4)}
        y={f(panelTL.y + h * 0.62)}
        textAnchor="middle"
        fontSize={f(h * 0.3)}
        fontWeight="800"
        fill="var(--color-chalk)"
        style={{ letterSpacing: "0.06em" }}
      >
        SORTIE
      </text>
      <path
        d={`M${f(panelTL.x + w * 0.79)} ${f(panelTL.y + h * 0.7)}l${f(w * 0.09)} ${f(-h * 0.38)}m${f(-w * 0.06)} 0h${f(w * 0.06)}v${f(h * 0.18)}`}
        fill="none"
        stroke="var(--color-chalk)"
        strokeWidth={f(Math.max(1.6, 0.18 * s))}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function ExitScene({ className }: { className?: string }): ReactElement {
  // Zébras du nez de la bretelle (entre la rive de l'autoroute et la bretelle qui s'écarte).
  let hatch = "";
  for (let d = 13; d < 56; d += 2.4) {
    const a = project(CAM, -0.5, d);
    const b = project(CAM, rampLeft(d + 2), d + 2);
    const c = project(CAM, rampLeft(d + 2.7), d + 2.7);
    const e = project(CAM, -0.5, d + 0.7);
    hatch += `M${a.x} ${a.y}L${b.x} ${b.y}L${c.x} ${c.y}L${e.x} ${e.y}Z`;
  }
  const end = project(CAM, rampCentre(RAMP_END), RAMP_END);
  const endS = scaleAt(CAM, RAMP_END);

  return (
    <div className={cn(styles.exit, className)} aria-hidden="true">
      <svg className={styles.exitSvg} viewBox="120 100 760 400" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="ex-asphalt" x1="0" y1="210" x2="0" y2="540" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-night-800)" />
            <stop offset="0.3" stopColor="var(--color-night-900)" />
            <stop offset="1" stopColor="var(--color-night-950)" />
          </linearGradient>
          <linearGradient id="ex-ramp" x1="0" y1="210" x2="0" y2="540" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="color-mix(in srgb, var(--color-sodium) 14%, var(--color-night-900))" />
            <stop offset="0.45" stopColor="color-mix(in srgb, var(--color-sodium) 5%, var(--color-night-900))" />
            <stop offset="1" stopColor="var(--color-night-950)" />
          </linearGradient>
          <linearGradient id="ex-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.32" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0.03" />
          </linearGradient>
          <radialGradient id="ex-pool">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.34" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ex-bulb">
            <stop offset="0" stopColor="var(--color-reflect)" stopOpacity="0.9" />
            <stop offset="0.3" stopColor="var(--color-sodium)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ex-wet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ex-trail" x1="0" y1="210" x2="0" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--color-brake)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--color-brake)" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="ex-relay-glow">
            <stop offset="0" stopColor="var(--color-signal-500)" stopOpacity="0.45" />
            <stop offset="1" stopColor="var(--color-signal-500)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <CityGlow id="ex-city" x0={-40} x1={1000} horizon={210} maxHeight={26} seed={23} />

        {/* Autoroute (à gauche, tout droit) et bretelle (à droite, qui s'écarte) */}
        <path d={ribbon(CAM, -12, -0.5, 0, FAR)} fill="url(#ex-asphalt)" />
        <path d={ribbon(CAM, -0.5, rampLeft, 12, RAMP_END, 24)} fill="var(--color-night-950)" opacity="0.7" />
        <path d={ribbon(CAM, rampLeft, rampRight, 0, RAMP_END, 30)} fill="url(#ex-ramp)" />
        <path d={hatch} fill="var(--color-chalk)" opacity="0.3" />

        <g fill="var(--color-chalk)">
          <path d={ribbon(CAM, -12, -11.85, 0, FAR)} opacity="0.3" />
          <path d={dashes(CAM, -8.2, 0.15, 3, 10, 0, 320)} opacity="0.4" />
          <path d={dashes(CAM, -4.4, 0.15, 3, 10, 0, 320, 5)} opacity="0.45" />
          <path d={ribbon(CAM, -0.62, -0.5, 12, FAR)} opacity="0.4" />
          <path d={dashes(CAM, -0.56, 0.3, 3, 3, 0, 12)} opacity="0.55" />
          <path d={ribbon(CAM, (d) => rampLeft(d), (d) => rampLeft(d) + 0.14, 12, RAMP_END, 30)} opacity="0.45" />
          <path d={ribbon(CAM, (d) => rampRight(d) - 0.14, rampRight, 0, RAMP_END, 30)} opacity="0.35" />
        </g>

        {/* Traînées de feux de l'autoroute : pose longue, statiques */}
        {[-2.5, -6.3, -10].flatMap((lane, i) =>
          [-0.7, 0.7].map((side) => (
            <path
              key={`${lane}${side}`}
              d={ribbon(CAM, lane + side - 0.045, lane + side + 0.045, 18 + i * 8, FAR, 1, 0.75)}
              fill="url(#ex-trail)"
              opacity={0.7 - i * 0.12}
            />
          )),
        )}

        {/* Glissière de la bretelle et ses catadioptres */}
        <path d={posts(CAM, 4.9, 0.8, 4, 0, 12)} stroke="var(--color-asphalt-600)" strokeWidth="2" />
        <path
          d={ribbon(CAM, rampRail, (d) => rampRail(d) + 0.08, 0, RAMP_END, 30, 0.8)}
          fill="var(--color-asphalt-500)"
        />

        {[125, 96, 70, 48, 30, 16].map((d) => (
          <RampLamp key={d} d={d} />
        ))}

        <ExitSign />

        {/* Votre véhicule : le trajet jaune ne commence qu'après le panneau de sortie */}
        <g data-route="" data-route-mode="view">
          <path
            className="draw"
            pathLength={1}
            data-route-leg="transport"
            d={groundLine(CAM, rampCentre, 26, RAMP_END, 28)}
            fill="none"
            stroke="var(--color-signal-500)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* RNB AUTO prend le relais : losange au bout du trajet, sur la route ordinaire */}
        <g transform={`translate(${end.x} ${f(end.y - 0.6 * endS - 10)})`}>
          <circle r="22" fill="url(#ex-relay-glow)" />
          <path d="M0 -9L9 0L0 9L-9 0Z" fill="var(--color-night-950)" stroke="var(--color-signal-500)" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M0 9V16" stroke="var(--color-signal-500)" strokeWidth="1.6" />
        </g>
      </svg>
    </div>
  );
}
