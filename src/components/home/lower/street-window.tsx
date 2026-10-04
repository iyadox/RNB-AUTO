/**
 * Fenêtre de rue de la section « Le prix avant le départ. » (docs/09, E.5) : une rue de
 * Seine-Saint-Denis vue à travers une vitrine, trois lampadaires, la dépanneuse garée.
 *
 * Elle suit le moment choisi dans le sélecteur (attribut `data-moment` posé par un parent) :
 * - `day` (en journée) : lumière de fin d'après-midi, commerces ouverts ;
 * - `sunday` (le dimanche) : même lumière, rideaux des commerces baissés ;
 * - `night` (la nuit) : le ciel s'assombrit, les fenêtres puis les lampadaires s'allument un à un
 *   (cascade de 80 ms), puis les phares de la dépanneuse.
 * Toutes les couleurs viennent des jetons (attributs `style`, les attributs SVG n'acceptent pas
 * `var()`). Les changements sont des fondus d'opacité et des `transform` (C.1-7), instantanés en
 * « moins d'animations ». Décor : `aria-hidden`, aucune information.
 */
import type { CSSProperties, ReactElement } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import styles from "../home-lower.module.css";

const W = 640;
const GROUND = 262;
const ROAD = 274;

type Building = { x: number; w: number; top: number; cols: number };

/** Façades de la rue (dessin fixe, déterministe). */
const BUILDINGS: Building[] = [
  { x: -4, w: 150, top: 78, cols: 4 },
  { x: 146, w: 128, top: 120, cols: 3 },
  { x: 274, w: 152, top: 52, cols: 4 },
  { x: 426, w: 116, top: 104, cols: 3 },
  { x: 542, w: 102, top: 68, cols: 3 },
];

/** Horizon lointain (silhouettes), derrière la rue. */
const FAR =
  "M0 262V176h22v-18h30v26h18v-40h26v34h20v-22h34v46h18v-56h12v-10h20v10h10v64h26v-30h30v18h22v-48h28v36h26v-24h18v-18h24v52h20v-34h30v22h26v-58h14v-8h18v8h12v70h24v-26h28v14h22v-44h30v40h24v-30h20v-16h26v48h20v-22h26v54Z";

/** Petites lumières du horizon lointain, la nuit. */
const FAR_LIGHTS: [number, number][] = [
  [30, 170], [84, 152], [108, 180], [150, 160], [186, 150], [232, 172], [268, 150],
  [318, 176], [352, 156], [402, 136], [446, 168], [480, 142], [520, 166], [566, 150], [604, 168],
];

const STARS: [number, number, number][] = [
  [40, 30, 1.1], [118, 18, 0.8], [196, 44, 1], [252, 22, 0.7], [338, 30, 0.9], [410, 14, 0.8], [470, 40, 1.1], [610, 24, 0.9],
];

const LAMPS = [24, 300, 566];

type Win = { x: number; y: number; lit: boolean; i: number };

function windowsOf(b: Building, index: number): Win[] {
  const out: Win[] = [];
  const margin = 14;
  const winW = 14;
  const gap = (b.w - margin * 2 - winW * b.cols) / Math.max(1, b.cols - 1);
  let row = 0;
  for (let y = b.top + 18; y + 18 <= 204; y += 30, row++) {
    for (let c = 0; c < b.cols; c++) {
      const n = index * 31 + row * 7 + c * 3;
      out.push({ x: b.x + margin + c * (winW + gap), y, lit: n % 5 < 2, i: (n * 7) % 12 });
    }
  }
  return out;
}

const WINDOWS = BUILDINGS.flatMap(windowsOf);

const c = (token: string): CSSProperties => ({ fill: `var(--color-${token})` });
const mix = (a: string, b: string, pct: number): CSSProperties => ({
  fill: `color-mix(in oklab, var(--color-${a}), var(--color-${b}) ${pct}%)`,
});
const stop = (color: string, opacity = 1): CSSProperties => ({ stopColor: color, stopOpacity: opacity });

export function StreetWindow({ id }: { id: string }): ReactElement {
  const p = (name: string) => `${id}-${name}`;
  return (
    <div className={styles.windowScene} aria-hidden="true">
      <svg viewBox={`0 0 ${W} 360`} className={styles.windowSvg} preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id={p("sky-night")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop("var(--color-night-950)")} />
            <stop offset="0.7" style={stop("var(--color-night-800)")} />
            <stop offset="1" style={stop("color-mix(in oklab, var(--color-night-800), var(--color-sodium) 16%)")} />
          </linearGradient>
          <linearGradient id={p("sky-day")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop("color-mix(in oklab, var(--color-dusk-700), var(--color-xenon) 34%)")} />
            <stop offset="0.62" style={stop("color-mix(in oklab, var(--color-dusk-500), var(--color-xenon) 30%)")} />
            <stop offset="1" style={stop("color-mix(in oklab, var(--color-dawn-gold) 70%, var(--color-dusk-500))")} />
          </linearGradient>
          <radialGradient id={p("sun")}>
            <stop offset="0" style={stop("var(--color-dawn-gold)", 0.75)} />
            <stop offset="0.35" style={stop("var(--color-dawn-gold)", 0.28)} />
            <stop offset="1" style={stop("var(--color-dawn-gold)", 0)} />
          </radialGradient>
          <linearGradient id={p("cone")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop("var(--color-sodium)", 0.55)} />
            <stop offset="0.6" style={stop("var(--color-sodium)", 0.14)} />
            <stop offset="1" style={stop("var(--color-sodium)", 0)} />
          </linearGradient>
          <radialGradient id={p("pool")}>
            <stop offset="0" style={stop("var(--color-sodium)", 0.42)} />
            <stop offset="1" style={stop("var(--color-sodium)", 0)} />
          </radialGradient>
          <linearGradient id={p("wet")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop("var(--color-sodium)", 0.4)} />
            <stop offset="1" style={stop("var(--color-sodium)", 0)} />
          </linearGradient>
          <linearGradient id={p("beam")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={stop("var(--color-xenon)", 0.6)} />
            <stop offset="1" style={stop("var(--color-xenon)", 0)} />
          </linearGradient>
          <linearGradient id={p("shop")} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop("var(--color-sodium)", 0.62)} />
            <stop offset="1" style={stop("var(--color-sodium)", 0.2)} />
          </linearGradient>
          <pattern id={p("ribs")} width="8" height="5" patternUnits="userSpaceOnUse">
            <rect width="8" height="5" style={c("asphalt-600")} />
            <rect y="3.6" width="8" height="1.4" style={c("asphalt-750")} />
          </pattern>
        </defs>

        {/* ─── Base de nuit ─────────────────────────────────────────────── */}
        <rect width={W} height={GROUND + 4} fill={`url(#${p("sky-night")})`} />
        <g className={styles.nightOnly}>
          {STARS.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} style={c("xenon")} opacity="0.8" />
          ))}
          <circle cx="586" cy="46" r="13" style={c("xenon")} />
          <circle cx="592" cy="41" r="12" style={c("night-950")} />
        </g>
        <path d={FAR} style={c("night-800")} />
        <g className={styles.nightOnly}>
          {FAR_LIGHTS.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" style={c("sodium")} opacity="0.55" />
          ))}
        </g>
        {BUILDINGS.map((b) => (
          <rect key={`n${b.x}`} x={b.x} y={b.top} width={b.w} height={GROUND - b.top} style={c("asphalt-850")} />
        ))}
        {WINDOWS.map((w) => (
          <rect key={`nw${w.x}-${w.y}`} x={w.x} y={w.y} width="14" height="18" style={c("night-950")} />
        ))}
        <rect y={GROUND} width={W} height={ROAD - GROUND} style={c("asphalt-800")} />
        <rect y={ROAD} width={W} height={360 - ROAD} style={c("asphalt-900")} />

        {/* ─── Lumière du jour (fondu) ──────────────────────────────────── */}
        <g className={styles.dayOnly}>
          <rect width={W} height={GROUND + 4} fill={`url(#${p("sky-day")})`} />
          <circle cx="212" cy="96" r="150" fill={`url(#${p("sun")})`} />
          <circle cx="212" cy="96" r="14" style={mix("dawn-gold", "paper", 55)} />
          <path d={FAR} style={mix("dusk-500", "xenon", 22)} />
          {BUILDINGS.map((b, i) => (
            <rect
              key={`d${b.x}`}
              x={b.x}
              y={b.top}
              width={b.w}
              height={GROUND - b.top}
              style={mix("asphalt-600", "dawn-gold", i % 2 ? 14 : 24)}
            />
          ))}
          {WINDOWS.map((w) => (
            <rect key={`dw${w.x}-${w.y}`} x={w.x} y={w.y} width="14" height="18" style={mix("dusk-700", "xenon", 28)} />
          ))}
          <rect y={GROUND} width={W} height={ROAD - GROUND} style={mix("asphalt-500", "dawn-gold", 14)} />
          <rect y={ROAD} width={W} height={360 - ROAD} style={c("asphalt-700")} />
        </g>

        {/* Corniches, bandeaux d'étage et bord du trottoir : traits fixes, jour comme nuit. */}
        {BUILDINGS.map((b) => (
          <g key={`k${b.x}`} style={c("asphalt-950")}>
            <rect x={b.x - 2} y={b.top - 3} width={b.w + 4} height="5" opacity="0.7" />
            {Array.from({ length: Math.floor((200 - b.top - 18) / 30) + 1 }, (_, r) => (
              <rect key={r} x={b.x} y={b.top + 40 + r * 30} width={b.w} height="1.5" opacity="0.28" />
            ))}
          </g>
        ))}
        <rect y={ROAD - 2} width={W} height="2" style={c("chalk")} opacity="0.18" />
        <path d={`M-20 ${ROAD + 46}H${W + 20}`} stroke="var(--color-chalk)" strokeOpacity="0.32" strokeWidth="3" strokeDasharray="34 34" />

        {/* ─── Fenêtres allumées, la nuit (cascade) ─────────────────────── */}
        <g>
          {WINDOWS.filter((w) => w.lit).map((w) => (
            <rect
              key={`l${w.x}-${w.y}`}
              x={w.x}
              y={w.y}
              width="14"
              height="18"
              className={styles.litWindow}
              style={{ ...c(w.i % 7 === 3 ? "xenon" : "sodium"), "--i": w.i, "--o": w.i % 7 === 3 ? 0.42 : 0.5 + (w.i % 4) * 0.12 } as CSSProperties}
            />
          ))}
        </g>

        {/* ─── Commerces : vitrines ouvertes en semaine, rideaux baissés sinon ─── */}
        {BUILDINGS.map((b) => (
          <g key={`s${b.x}`}>
            <rect x={b.x + 12} y={214} width={b.w - 24} height={GROUND - 216} fill={`url(#${p("shop")})`} />
            <rect x={b.x + 12} y={214} width={b.w - 24} height={GROUND - 216} fill={`url(#${p("ribs")})`} className={styles.shutter} />
            {[0.34, 0.67].map((f) => (
              <rect key={f} x={b.x + 12 + (b.w - 24) * f - 1.5} y={214} width="3" height={GROUND - 216} style={c("asphalt-950")} opacity="0.75" />
            ))}
            <path d={`M${b.x + 8} 206h${b.w - 16}l-6 10h${-(b.w - 28)}Z`} style={c("asphalt-950")} opacity="0.82" />
            <path d={`M${b.x + 8} 206h${b.w - 16}`} stroke="var(--color-chalk)" strokeOpacity="0.16" strokeWidth="1.5" />
          </g>
        ))}

        {/* ─── Lampadaires : fût, crosse, tête ; lumière la nuit ─────────── */}
        {LAMPS.map((x, i) => (
          <g key={`lamp${x}`} style={{ "--n": i } as CSSProperties}>
            <g className={styles.lampLight}>
              <polygon points={`${x + 20},150 ${x + 34},150 ${x + 96},356 ${x - 42},356`} fill={`url(#${p("cone")})`} />
              <ellipse cx={x + 27} cy={ROAD + 22} rx="72" ry="13" fill={`url(#${p("pool")})`} />
              <rect x={x + 19} y={ROAD + 24} width="16" height={360 - ROAD - 24} fill={`url(#${p("wet")})`} />
            </g>
            <rect x={x - 2} y={140} width="4" height={GROUND + 6 - 140} style={c("asphalt-950")} />
            <path d={`M${x} 146q0-8 10-8h12`} fill="none" stroke="var(--color-asphalt-950)" strokeWidth="3" />
            <rect x={x + 18} y={135} width="18" height="7" rx="2" style={c("asphalt-950")} />
            <rect x={x + 20} y={141} width="14" height="3" rx="1.5" style={c("asphalt-400")} />
            <rect x={x + 20} y={141} width="14" height="3" rx="1.5" className={styles.lampBulb} style={c("sodium")} />
          </g>
        ))}

        {/* Faisceau des phares de la dépanneuse sur la chaussée, la nuit. */}
        <polygon points={`246,${ROAD + 8} 470,${ROAD - 16} 470,${ROAD + 70} 246,${ROAD + 26}`} fill={`url(#${p("beam")})`} className={styles.truckBeam} />
      </svg>

      <div className={styles.windowTruck}>
        <TowTruck id={p("truck")} headlights beacon={false} parts className="h-auto w-full" />
      </div>
      {/* Reflet de la vitre et rideau métallique qui se lève à l'entrée (décor). */}
      <span className={styles.windowGlass} />
      <span className={styles.windowCurtain} />
    </div>
  );
}
