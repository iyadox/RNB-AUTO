"use client";
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
 *
 * Budget (G.2) : composant client (son dessin n'est pas répété dans la charge RSC de la page)
 * et formes regroupées en un tracé par couleur : environ 90 nœuds au lieu de 320. Les fenêtres
 * allumées sont regroupées par rang de cascade (même délai, même teinte) : la cascade est
 * identique à celle d'un dessin fenêtre par fenêtre. Le dessin (SVG et dépanneuse) n'est monté
 * qu'à l'approche (`useNearViewport`) : le cadre 16:9, la vitre et le rideau sont rendus tout de
 * suite, rien ne bouge. Sans JavaScript, le rideau métallique reste baissé (CSS).
 */
import type { CSSProperties, ReactElement } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { useNearViewport } from "../lazy-scene";
import styles from "../home-lower.module.css";

const W = 640;
const H = 360;
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

/* ─── Tracés regroupés (calculés une fois) ─────────────────────────────────────────── */

const n = (value: number) => Number(value.toFixed(2));
const rect = (x: number, y: number, w: number, h: number) => `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}Z`;
const dot = (x: number, y: number, r: number) => `M${n(x - r)} ${y}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(-2 * r)} 0`;
const facade = (b: Building) => rect(b.x, b.top, b.w, GROUND - b.top);
const win = (w: Win) => rect(w.x, w.y, 14, 18);

const PATHS = {
  stars: STARS.map(([x, y, r]) => dot(x, y, r)).join(""),
  farLights: FAR_LIGHTS.map(([x, y]) => rect(x, y, 3, 3)).join(""),
  facades: BUILDINGS.map(facade).join(""),
  facadesEven: BUILDINGS.filter((_, i) => i % 2 === 0).map(facade).join(""),
  facadesOdd: BUILDINGS.filter((_, i) => i % 2 === 1).map(facade).join(""),
  windows: WINDOWS.map(win).join(""),
  cornices: BUILDINGS.map((b) => rect(b.x - 2, b.top - 3, b.w + 4, 5)).join(""),
  bands: BUILDINGS.map((b) =>
    Array.from({ length: Math.floor((200 - b.top - 18) / 30) + 1 }, (_, r) => rect(b.x, b.top + 40 + r * 30, b.w, 1.5)).join(""),
  ).join(""),
  shops: BUILDINGS.map((b) => rect(b.x + 12, 214, b.w - 24, GROUND - 216)).join(""),
  mullions: BUILDINGS.map((b) =>
    [0.34, 0.67].map((f) => rect(b.x + 12 + (b.w - 24) * f - 1.5, 214, 3, GROUND - 216)).join(""),
  ).join(""),
  awnings: BUILDINGS.map((b) => `M${b.x + 8} 206h${b.w - 16}l-6 10h${-(b.w - 28)}Z`).join(""),
  awningEdges: BUILDINGS.map((b) => `M${b.x + 8} 206h${b.w - 16}`).join(""),
  posts: LAMPS.map((x) => rect(x - 2, 140, 4, GROUND + 6 - 140) + `M${x + 20} 135h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-14a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Z`).join(""),
  arms: LAMPS.map((x) => `M${x} 146q0-8 10-8h12`).join(""),
  bulbs: LAMPS.map((x) => `M${x + 21.5} 141h11a1.5 1.5 0 0 1 0 3h-11a1.5 1.5 0 0 1 0-3Z`).join(""),
};

/**
 * Fenêtres allumées, une couche par teinte (xénon, ou sodium plus ou moins fort) : cinq couches
 * qui s'allument l'une après l'autre (cascade), éparpillées sur toutes les façades.
 */
const litLook = (i: number) => (i % 7 === 3 ? "x" : `s${i % 4}`);
const LIT = ["s0", "x", "s1", "s2", "s3"].map((look, rank) => ({
  rank,
  d: WINDOWS.filter((w) => w.lit && litLook(w.i) === look).map(win).join(""),
  token: look === "x" ? "xenon" : "sodium",
  opacity: look === "x" ? 0.42 : 0.5 + Number(look.slice(1)) * 0.12,
})).filter((layer) => layer.d !== "");

const c = (token: string): CSSProperties => ({ fill: `var(--color-${token})` });
const mix = (a: string, b: string, pct: number): CSSProperties => ({
  fill: `color-mix(in oklab, var(--color-${a}), var(--color-${b}) ${pct}%)`,
});
const stop = (color: string, opacity = 1): CSSProperties => ({ stopColor: color, stopOpacity: opacity });

export function StreetWindow({ id }: { id: string }): ReactElement {
  const p = (name: string) => `${id}-${name}`;
  const [ref, near] = useNearViewport<HTMLDivElement>();
  return (
    <div ref={ref} className={styles.windowScene} aria-hidden="true">
      {near ? <StreetDrawing p={p} /> : null}
      {/* Reflet de la vitre et rideau métallique qui se lève à l'entrée (décor). */}
      <span className={styles.windowGlass} />
      <span className={styles.windowCurtain} />
    </div>
  );
}

/** La rue et la dépanneuse garée (monté à l'approche). */
function StreetDrawing({ p }: { p: (name: string) => string }): ReactElement {
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.windowSvg} preserveAspectRatio="xMidYMax slice">
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
          {/* Géométries dessinées deux fois (nuit et jour) : une seule fois ici. */}
          <path id={p("far")} d={FAR} />
          <path id={p("win")} d={PATHS.windows} />
          <pattern id={p("ribs")} width="8" height="5" patternUnits="userSpaceOnUse">
            <rect width="8" height="5" style={c("asphalt-600")} />
            <rect y="3.6" width="8" height="1.4" style={c("asphalt-750")} />
          </pattern>
        </defs>

        {/* ─── Base de nuit ─────────────────────────────────────────────── */}
        <rect width={W} height={GROUND + 4} fill={`url(#${p("sky-night")})`} />
        <path d={PATHS.stars} style={c("xenon")} opacity="0.8" className={styles.nightOnly} />
        {/* Croissant de lune (disque de 13 moins un disque de 12 décalé vers le haut à droite). */}
        <path
          d="M582.69 33.43A13 13 0 1 0 597.77 51.52A12 12 0 0 1 582.69 33.43Z"
          style={c("xenon")}
          className={styles.nightOnly}
        />
        <use href={`#${p("far")}`} style={c("night-800")} />
        <path d={PATHS.farLights} style={c("sodium")} opacity="0.55" className={styles.nightOnly} />
        <path d={PATHS.facades} style={c("asphalt-850")} />
        <use href={`#${p("win")}`} style={c("night-950")} />
        <path d={rect(0, GROUND, W, ROAD - GROUND)} style={c("asphalt-800")} />
        <path d={rect(0, ROAD, W, H - ROAD)} style={c("asphalt-900")} />

        {/* ─── Lumière du jour (fondu) ──────────────────────────────────── */}
        <g className={styles.dayOnly}>
          <rect width={W} height={GROUND + 4} fill={`url(#${p("sky-day")})`} />
          <circle cx="212" cy="96" r="150" fill={`url(#${p("sun")})`} />
          <circle cx="212" cy="96" r="14" style={mix("dawn-gold", "paper", 55)} />
          <use href={`#${p("far")}`} style={mix("dusk-500", "xenon", 22)} />
          <path d={PATHS.facadesEven} style={mix("asphalt-600", "dawn-gold", 24)} />
          <path d={PATHS.facadesOdd} style={mix("asphalt-600", "dawn-gold", 14)} />
          <use href={`#${p("win")}`} style={mix("dusk-700", "xenon", 28)} />
          <path d={rect(0, GROUND, W, ROAD - GROUND)} style={mix("asphalt-500", "dawn-gold", 14)} />
          <path d={rect(0, ROAD, W, H - ROAD)} style={c("asphalt-700")} />
        </g>

        {/* Corniches, bandeaux d'étage et bord du trottoir : traits fixes, jour comme nuit. */}
        <path d={PATHS.cornices} style={c("asphalt-950")} opacity="0.7" />
        <path d={PATHS.bands} style={c("asphalt-950")} opacity="0.28" />
        <path d={rect(0, ROAD - 2, W, 2)} style={c("chalk")} opacity="0.18" />
        <path d={`M-20 ${ROAD + 46}H${W + 20}`} stroke="var(--color-chalk)" strokeOpacity="0.32" strokeWidth="3" strokeDasharray="34 34" />

        {/* ─── Fenêtres allumées, la nuit (cascade par rang) ─────────────── */}
        {LIT.map((layer) => (
          <path
            key={layer.rank}
            d={layer.d}
            className={styles.litWindow}
            style={{ ...c(layer.token), "--i": layer.rank * 2.4, "--o": layer.opacity } as CSSProperties}
          />
        ))}

        {/* ─── Commerces : vitrines ouvertes en semaine, rideaux baissés sinon ─── */}
        <path d={PATHS.shops} fill={`url(#${p("shop")})`} />
        <path d={PATHS.shops} fill={`url(#${p("ribs")})`} className={styles.shutter} />
        <path d={PATHS.mullions} style={c("asphalt-950")} opacity="0.75" />
        <path d={PATHS.awnings} style={c("asphalt-950")} opacity="0.82" />
        <path d={PATHS.awningEdges} stroke="var(--color-chalk)" strokeOpacity="0.16" strokeWidth="1.5" />

        {/* ─── Lampadaires : lumière la nuit (cascade), puis fût, crosse, tête ─── */}
        {LAMPS.map((x, i) => {
          const light = { className: styles.lampLight, style: { "--n": i } as CSSProperties };
          return [
            <polygon key={`c${x}`} {...light} points={`${x + 20},150 ${x + 34},150 ${x + 96},356 ${x - 42},356`} fill={`url(#${p("cone")})`} />,
            <ellipse key={`p${x}`} {...light} cx={x + 27} cy={ROAD + 22} rx="72" ry="13" fill={`url(#${p("pool")})`} />,
            <rect key={`w${x}`} {...light} x={x + 19} y={ROAD + 24} width="16" height={H - ROAD - 24} fill={`url(#${p("wet")})`} />,
          ];
        })}
        <path d={PATHS.posts} style={c("asphalt-950")} />
        <path d={PATHS.arms} fill="none" stroke="var(--color-asphalt-950)" strokeWidth="3" />
        <path d={PATHS.bulbs} style={c("asphalt-400")} />
        {LAMPS.map((x, i) => (
          <rect
            key={x}
            x={x + 20}
            y={141}
            width="14"
            height="3"
            rx="1.5"
            className={styles.lampBulb}
            style={{ ...c("sodium"), "--n": i } as CSSProperties}
          />
        ))}

        {/* Faisceau des phares de la dépanneuse sur la chaussée, la nuit. */}
        <polygon points={`246,${ROAD + 8} 470,${ROAD - 16} 470,${ROAD + 70} 246,${ROAD + 26}`} fill={`url(#${p("beam")})`} className={styles.truckBeam} />
      </svg>

      <div className={styles.windowTruck}>
        <TowTruck id={p("truck")} headlights beacon={false} parts className="h-auto w-full" />
      </div>
    </>
  );
}
