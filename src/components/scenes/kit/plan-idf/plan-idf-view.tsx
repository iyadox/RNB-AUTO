"use client";
/**
 * Le « Plan RNB » (docs/09, B.7, E.4, E.7, F.3) : une carte SCHÉMATIQUE unique de
 * l'Île-de-France, en SVG, vue de dessus. Aucune distance n'y figure jamais ; l'appelant écrit
 * « Plan schématique » en texte à côté. À importer depuis `./plan-idf` (qui exporte aussi les
 * outils du repère, utilisables côté serveur).
 *
 * - `region` (disque) : centre Paris, compression en racine carrée jusqu'à 60 km. Anneaux
 *   schématiques : Paris (périphérique), petite couronne, grande couronne (bord du disque).
 * - `depot` (carré) : 12 km autour du dépôt, linéaire ; rues stylisées, canal, Seine, Marne.
 * - Dépôt : `depot.lat/lng`, sinon la ville `depot.city` connue du plan, sinon aucun marqueur.
 * - `sweep` : le gyrophare du dépôt balaie (un tour en 5 s) ; chaque ville s'éclaire au passage
 *   du faisceau (délai calculé au rendu, à partir de son angle). À l'entrée, les villes
 *   apparaissent une à une (40 ms). `off` : villes allumées, sans balayage.
 * - `static` : aucune apparition ni boucle (villes allumées, pas de balayage, pas d'onde du
 *   dépôt, épingle sans feux de détresse) : un plan fixe (F.7, /contact).
 * - `detail="low"` : plan allégé (budget de nœuds, G.2) : sans les rues stylisées ni la route
 *   nationale, sans réticule ni graduations sur le disque.
 * - `points` : épingle « Vous », drapeau de destination (vraies positions, /demande).
 * - `underlay` : calques SVG dessinés SOUS les communes et le losange du dépôt (zones,
 *   surfaces), dans le repère du plan (600 × 600).
 * - `children` : contenu SVG supplémentaire AU-DESSUS de tout, dans le repère du plan, par
 *   exemple des `RoutePaths` dont les points viennent de `planPoint`.
 * - `symbolId` : le fond de carte est rendu dans un `<symbol>` réutilisable ailleurs dans la
 *   page (`<use href="#id" width="600" height="600">`), recadré par un autre `viewBox`.
 * - Noms des communes : jamais hors du cadre, jamais sur un autre nom ni sur une marque (losange,
 *   nom du dépôt, épingle et son étiquette, drapeau), par boîtes estimées (`plan-labels.ts`).
 *   Un nom gênant passe de l'autre côté du point ; s'il ne tient d'aucun côté, il est masqué.
 *   L'étiquette « Vous » et le nom du dépôt changent de côté si l'épingle les recouvre.
 * Décoratif (`aria-hidden`) : les informations sont données en texte par la page.
 *
 * Composant client : son balisage n'est pas répété dans la charge RSC de la page (G.2).
 */
import { useId, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { DepotGlyph, FlagGlyph, PinGlyph } from "../glyphs";
import styles from "../kit.module.css";
import { formatSvgNumber as f, smoothPath, type Point } from "../svg-path";
import { CITIES, MARNE, OURCQ, PERIPHERIQUE, PETITE_COURONNE, ROADS, SEINE, findCity, type GeoPoint } from "./geo";
import { PLAN_CENTER as CENTER, PLAN_RADIUS as RADIUS, PLAN_SIZE, planPoint, resolveDepotPosition } from "./plan-geometry";
import { layoutPlanLabels, type Anchor, type CityLabelPlan } from "./plan-labels";
import { projectIdf, type PlanVariant } from "./projection";

const SWEEP_SECONDS = 5;

type Highlight = "paris" | "petite-couronne" | "grande-couronne" | "93";

export type PlanIdfProps = {
  depot: PublicSiteInfo["depot"];
  variant?: PlanVariant;
  sweep?: boolean;
  highlight?: Highlight | null;
  labels?: "major" | "all" | "none";
  points?: { kind: "vous" | "destination"; lat: number; lng: number }[];
  /** Plan fixe : aucune apparition, aucune boucle. */
  static?: boolean;
  /** `low` : sans rues stylisées, route nationale, réticule ni graduations. */
  detail?: "full" | "low";
  /** Calques SVG sous les communes et le losange du dépôt (repère 600 × 600). */
  underlay?: ReactNode;
  children?: ReactNode;
  symbolId?: string;
  className?: string;
};

/**
 * Placement préféré des noms sur le disque régional (les communes de la Seine-Saint-Denis sont
 * serrées) : réglé pour que tous tiennent sans se toucher à 14 / 11,5 et 16 / 13 unités.
 */
const REGION_LABELS: Record<string, [number, number, Anchor]> = {
  Paris: [-9, 4, "end"],
  "Saint-Denis": [-7, -7, "end"],
  Montreuil: [8, 6, "start"],
  Pantin: [-9, -2, "end"],
  Bondy: [10, 0, "start"],
  "Aulnay-sous-Bois": [9, -9, "start"],
  "Noisy-le-Grand": [8, 8, "start"],
  Roissy: [8, -5, "start"],
  Créteil: [8, 5, "start"],
  Argenteuil: [-7, 6, "end"],
  Versailles: [-8, 4, "end"],
  Cergy: [-8, -3, "end"],
  Évry: [8, 5, "start"],
  Meaux: [0, -11, "middle"],
};

const project = (points: readonly GeoPoint[], variant: PlanVariant, center: GeoPoint | undefined): Point[] =>
  points.map((p) => {
    const u = projectIdf(p.lat, p.lng, variant, center);
    return { x: CENTER + u.x * RADIUS[variant], y: CENTER + u.y * RADIUS[variant] };
  });

/** Disque complet en chemin (pour les zones en « anneau » avec la règle evenodd). */
const circlePath = (r: number) => `M${CENTER - r} ${CENTER}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

/** Angle (degrés, 0 = nord, sens horaire) du point vu depuis le dépôt. */
const bearing = (from: Point, to: Point) => ((Math.atan2(to.x - from.x, -(to.y - from.y)) * 180) / Math.PI + 360) % 360;

/** Route secondaire, absente du plan allégé. */
const MINOR_ROADS = new Set(["n3"]);

export function PlanIdf({
  depot,
  variant = "region",
  sweep: sweepProp = false,
  highlight = null,
  labels = "major",
  points = [],
  static: isStatic = false,
  detail = "full",
  underlay,
  children,
  symbolId,
  className,
}: PlanIdfProps): ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `plan-${uid}-${name}`;
  const region = variant === "region";
  const low = detail === "low";
  const R = RADIUS[variant];

  const depotGeo = resolveDepotPosition(depot);
  const center = !region ? (depotGeo ?? undefined) : undefined;
  const depotPoint = depotGeo ? project([depotGeo], variant, center)[0]! : null;
  const depotCity = findCity(depot.city);
  // Le balayage n'existe pas sur un plan fixe.
  const sweep = sweepProp && !isStatic && depotPoint !== null;

  const periph = smoothPath(project(PERIPHERIQUE, variant, center), true, 0.42);
  const petite = smoothPath(project(PETITE_COURONNE, variant, center), true);
  const seine = smoothPath(project(SEINE, variant, center));
  const marne = smoothPath(project(MARNE, variant, center));
  const ourcq = smoothPath(project(OURCQ, variant, center));
  // Tous les axes en un seul tracé par couche (bitume, puis trait clair).
  const roads = ROADS.filter((road) => !(low && MINOR_ROADS.has(road.id)))
    .map((road) => smoothPath(project(road.points, variant, center), road.ring === true))
    .join("");

  const outline = region ? circlePath(R) : `M0 0H${PLAN_SIZE}V${PLAN_SIZE}H0Z`;
  const highlightPath =
    highlight === "paris"
      ? periph
      : highlight === "petite-couronne"
        ? `${petite}${periph}`
        : highlight === "grande-couronne"
          ? `${outline}${petite}`
          : null;

  const pointPositions = points.map((point) => ({ kind: point.kind, p: planPoint(point.lat, point.lng, variant, depot) }));

  const cities = CITIES.map((city, index) => {
    const p = project([city], variant, center)[0]!;
    return { city, p, index };
  }).filter(({ city, p }) => {
    // La ville du dépôt est son marqueur ; une commune cachée sous le losange n'est pas dessinée.
    if (depotCity && city.name === depotCity.name && depotPoint) return false;
    if (depotPoint && Math.hypot(p.x - depotPoint.x, p.y - depotPoint.y) < (region ? 15 : 10)) return false;
    const margin = 6;
    return region
      ? Math.hypot(p.x - CENTER, p.y - CENTER) <= R
      : p.x > margin && p.x < PLAN_SIZE - margin && p.y > margin && p.y < PLAN_SIZE - margin;
  });

  // Noms : jamais hors du cadre, jamais l'un sur l'autre ni sur une marque (boîtes estimées,
  // à la taille normale et sur un plan étroit) ; voir `plan-labels.ts`.
  const layout = layoutPlanLabels({
    region,
    depot: depotPoint ? { p: depotPoint, name: depot.city } : null,
    points: pointPositions,
    cities: cities.map(({ city, p }) => {
      const major = city.major === true;
      const [dx, dy, anchor] = region
        ? (REGION_LABELS[city.name] ?? [8, 4, "start"])
        : p.x > PLAN_SIZE - 120 ||
            (depotPoint && p.x < depotPoint.x && p.x > depotPoint.x - 90 && p.y > depotPoint.y && p.y < depotPoint.y + 60)
          ? ([-8, 4, "end"] as const)
          : ([8, 4, "start"] as const);
      return { name: city.name, p, major, wanted: labels === "all" || (labels === "major" && (major || !region)), dx, dy, anchor };
    }),
  });
  const narrowClass = (plan: CityLabelPlan) =>
    plan.narrow === "hide"
      ? styles.cityLabelHideNarrow
      : plan.narrow === "flip"
        ? plan.anchor === "start"
          ? styles.cityLabelFlipEnd
          : styles.cityLabelFlipStart
        : undefined;

  const base = (
    <g>
      {region ? (
        <>
          <circle cx={CENTER} cy={CENTER} r={R + 18} fill={`url(#${id("halo")})`} />
          <circle cx={CENTER} cy={CENTER} r={R} fill={`url(#${id("disc")})`} />
          <path d={outline} fill={`url(#${id("dots")})`} />
          {low ? null : (
            <>
              {/* Réticule d'écran radar : deux cercles et douze rayons très discrets, sans distance.
                  Ils occupent la grande couronne (sinon vide) et répondent au balayage du gyrophare. */}
              <path
                d={graticule(R)}
                fill="none"
                stroke="#f5f3ee"
                strokeOpacity="0.07"
                strokeWidth="1"
                strokeDasharray="1.5 5"
                strokeLinecap="round"
              />
              {/* Graduations de la couronne (repère d'orientation, sans distance) */}
              <path d={ticks(R)} stroke="#f5f3ee" strokeOpacity="0.22" strokeWidth="1" />
            </>
          )}
          {/* Couronne extérieure (deux cercles en un tracé) */}
          <path d={circlePath(R)} fill="none" stroke="#f5f3ee" strokeOpacity="0.16" strokeWidth="1.2" />
          <path d={circlePath(R + 9)} fill="none" stroke="#f5f3ee" strokeOpacity="0.07" strokeWidth="1" />
          <path d={`M${CENTER} ${CENTER - R - 22}l-5 9h10Z`} fill="#f5f3ee" fillOpacity="0.55" />
        </>
      ) : (
        <>
          <rect width={PLAN_SIZE} height={PLAN_SIZE} fill={`url(#${id("disc")})`} />
          {low ? null : <rect width={PLAN_SIZE} height={PLAN_SIZE} fill={`url(#${id("streets")})`} />}
        </>
      )}

      <g clipPath={`url(#${id("clip")})`}>
        {/* Petite couronne et Paris (anneaux schématiques) */}
        <path
          d={petite}
          fill="#f5f3ee"
          fillOpacity="0.022"
          stroke="#f5f3ee"
          strokeOpacity="0.17"
          strokeWidth="1.2"
          strokeDasharray="2 6"
          strokeLinecap="round"
        />

        {/* Grands axes stylisés */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={roads} stroke="#05070d" strokeOpacity="0.7" strokeWidth={region ? 3.4 : 7} />
          <path d={roads} stroke="#9ba6b2" strokeOpacity={region ? 0.2 : 0.26} strokeWidth={region ? 1.3 : 3.2} />
        </g>

        {/* Eau : Seine, Marne, canal de l'Ourcq */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={seine} stroke="#1b3550" strokeWidth={region ? 5 : 9.5} />
          <path d={marne} stroke="#1b3550" strokeWidth={region ? 3.6 : 7} />
          <path d={ourcq} stroke="#1b3550" strokeWidth={region ? 2.2 : 4} />
          <path d={seine} stroke="#3a6a98" strokeOpacity="0.42" strokeWidth={region ? 1.2 : 1.8} />
          <path d={marne} stroke="#3a6a98" strokeOpacity="0.38" strokeWidth={region ? 0.9 : 1.5} />
          <path d={ourcq} stroke="#3a6a98" strokeOpacity="0.45" strokeWidth={region ? 0.7 : 1.1} />
        </g>

        {/* Boulevard périphérique */}
        <path d={periph} fill="#f5f3ee" fillOpacity="0.035" stroke="#05070d" strokeOpacity="0.7" strokeWidth={region ? 4.4 : 9} />
        <path d={periph} fill="none" stroke="#c8ced6" strokeOpacity={region ? 0.42 : 0.5} strokeWidth={region ? 1.8 : 3.6} />
      </g>
      {region ? null : <rect width={PLAN_SIZE} height={PLAN_SIZE} fill={`url(#${id("vignette")})`} />}
    </g>
  );

  return (
    <div
      className={cn(
        styles.plan,
        region ? styles.planRegion : styles.planDepot,
        sweep && styles.planSweep,
        isStatic && styles.planStatic,
        className,
      )}
      data-inview-once={isStatic ? undefined : ""}
      // Boucles du plan (balayage, onde du dépôt, warnings de l'épingle) : en pause hors écran.
      data-pause-offscreen={!isStatic && (sweep || depotPoint || points.length > 0) ? "" : undefined}
    >
      <svg
        viewBox={`0 0 ${PLAN_SIZE} ${PLAN_SIZE}`}
        preserveAspectRatio={region ? "xMidYMid meet" : "xMidYMid slice"}
        className={styles.planSvg}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={id("disc")} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#111a2e" />
            <stop offset="0.7" stopColor="#0a101d" />
            <stop offset="1" stopColor="#070a12" />
          </radialGradient>
          {region ? (
            <>
              <radialGradient id={id("halo")} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0.86" stopColor="#ffd27a" stopOpacity="0.07" />
                <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
              </radialGradient>
              <pattern id={id("dots")} width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#f5f3ee" fillOpacity="0.07" />
              </pattern>
            </>
          ) : (
            <>
              <radialGradient id={id("vignette")} cx="0.5" cy="0.5" r="0.72">
                <stop offset="0.55" stopColor="#05070d" stopOpacity="0" />
                <stop offset="1" stopColor="#05070d" stopOpacity="0.92" />
              </radialGradient>
              {low ? null : (
                <pattern id={id("streets")} width="38" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)">
                  <path d="M0 0.5H38M0.5 0V30M19 0V15M0 15H19" fill="none" stroke="#f5f3ee" strokeOpacity="0.045" strokeWidth="1" />
                </pattern>
              )}
            </>
          )}
          {highlight === "93" && depotPoint ? (
            <radialGradient id={id("hl93")}>
              <stop offset="0" stopColor="#ffc400" stopOpacity="0.32" />
              <stop offset="0.6" stopColor="#ffc400" stopOpacity="0.1" />
              <stop offset="1" stopColor="#ffc400" stopOpacity="0" />
            </radialGradient>
          ) : null}
          {sweep && depotPoint ? (
            <radialGradient id={id("beam")} gradientUnits="userSpaceOnUse" cx={f(depotPoint.x)} cy={f(depotPoint.y)} r={R * 1.3}>
              <stop offset="0" stopColor="#ffb15c" stopOpacity="1" />
              <stop offset="0.45" stopColor="#ff7a1a" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
            </radialGradient>
          ) : null}
          <clipPath id={id("clip")}>
            <path d={outline} />
          </clipPath>
          {symbolId ? (
            <symbol id={symbolId} viewBox={`0 0 ${PLAN_SIZE} ${PLAN_SIZE}`} overflow="visible">
              {base}
            </symbol>
          ) : null}
        </defs>

        {symbolId ? <use href={`#${symbolId}`} width={PLAN_SIZE} height={PLAN_SIZE} /> : base}

        {/* Zone mise en avant */}
        {highlightPath ? (
          <path
            d={highlightPath}
            fillRule="evenodd"
            fill="#ffc400"
            fillOpacity="0.13"
            stroke="#ffc400"
            strokeOpacity="0.7"
            strokeWidth="1.6"
            clipPath={`url(#${id("clip")})`}
          />
        ) : null}
        {highlight === "93" && depotPoint ? (
          <circle cx={depotPoint.x} cy={depotPoint.y} r={region ? 74 : 150} fill={`url(#${id("hl93")})`} />
        ) : null}

        {/* Faisceau du gyrophare du dépôt (un tour en 5 s) */}
        {sweep && depotPoint ? (
          <g clipPath={`url(#${id("clip")})`}>
            <g className={cn(styles.sweepBeam, styles.loop)} style={{ transformOrigin: `${f(depotPoint.x)}px ${f(depotPoint.y)}px` }}>
              {SWEEP_SLICES.map((opacity, i) => (
                <path key={i} d={slice(depotPoint, R * 1.3, i)} fill={`url(#${id("beam")})`} fillOpacity={opacity} />
              ))}
              <path
                d={`M${f(depotPoint.x)} ${f(depotPoint.y)}V${f(depotPoint.y - R * 1.3)}`}
                stroke={`url(#${id("beam")})`}
                strokeWidth="1.6"
              />
            </g>
          </g>
        ) : null}

        {underlay}

        {/* Communes */}
        <g>
          {cities.map(({ city, p, index }) => {
            const major = city.major === true;
            const plan = layout.cities.get(city.name)!;
            const { showLabel, dx, dy, anchor, narrowShift } = plan;
            const delay = depotPoint ? (bearing(depotPoint, p) / 360) * SWEEP_SECONDS - SWEEP_SECONDS : 0;
            const dot = (
              <>
                {major ? <circle cx={f(p.x)} cy={f(p.y)} r="9" fill="#ffc400" fillOpacity="0.14" /> : null}
                <circle
                  cx={f(p.x)}
                  cy={f(p.y)}
                  r={major ? 4 : 2.8}
                  fill={major ? "#ffc400" : "#c8ced6"}
                  stroke="#05070d"
                  strokeWidth="1.2"
                />
                {showLabel ? (
                  <text
                    className={cn(styles.cityLabel, !major && styles.cityLabelMinor, narrowClass(plan), plan.hideMid && styles.cityLabelHideMid)}
                    x={f(p.x + dx)}
                    y={f(p.y + dy)}
                    textAnchor={anchor}
                    fontSize={major ? 14 : region ? 11.5 : 13}
                    fontWeight={major ? 800 : 600}
                    fill={major ? "#f5f3ee" : "#c8ced6"}
                    stroke="#05070d"
                    strokeWidth="3.2"
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    style={narrowShift ? ({ "--label-shift": `${narrowShift}px` } as CSSProperties) : undefined}
                  >
                    {city.name}
                  </text>
                ) : null}
              </>
            );
            return (
              <g
                key={city.name}
                className={styles.city}
                style={
                  sweep ? ({ "--i": index, "--ping-delay": `${delay.toFixed(2)}s` } as CSSProperties) : ({ "--i": index } as CSSProperties)
                }
              >
                {/* Le passage du faisceau anime un groupe intérieur (l'apparition anime l'extérieur). */}
                {sweep ? <g className={cn(styles.cityInner, styles.loop)}>{dot}</g> : dot}
              </g>
            );
          })}
        </g>

        {/* Dépôt RNB AUTO */}
        {depotPoint ? (
          <g transform={`translate(${f(depotPoint.x)} ${f(depotPoint.y)})`}>
            <g className={styles.mark}>
              <DepotGlyph pulse={!sweep && !isStatic} />
              {depot.city ? (
                <text
                  className={styles.depotLabel}
                  y={layout.depotName === "below" ? 31 : -22}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="800"
                  fill="#ffc400"
                  stroke="#05070d"
                  strokeWidth="3.2"
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  style={{ letterSpacing: "0.14em" }}
                >
                  {depot.city.toUpperCase()}
                </text>
              ) : null}
            </g>
          </g>
        ) : null}

        {/* Vraies positions (/demande) */}
        {/* `data-plan-point` : repère stable pour les scènes et le CSS des pages. */}
        {pointPositions.map((point, index) => (
          <g key={`${point.kind}-${index}`} data-plan-point={point.kind} transform={`translate(${f(point.p.x)} ${f(point.p.y)})`}>
            <g className={styles.mark}>
              {point.kind === "vous" ? (
                <PinGlyph label="Vous" labelAt={layout.pointLabels[index] ?? undefined} hazards={!isStatic} />
              ) : (
                <FlagGlyph />
              )}
            </g>
          </g>
        ))}

        {children}
      </svg>
    </div>
  );
}

/** Réticule du disque : cercles à 58 % et 82 % du rayon, rayons tous les 30° (hors centre). */
function graticule(r: number): string {
  let d = circlePath(f2(r * 0.58)) + circlePath(f2(r * 0.82));
  for (let deg = 0; deg < 360; deg += 30) {
    const a = (deg * Math.PI) / 180;
    const inner = r * 0.36;
    d += `M${f(CENTER + inner * Math.sin(a))} ${f(CENTER - inner * Math.cos(a))}L${f(CENTER + r * Math.sin(a))} ${f(CENTER - r * Math.cos(a))}`;
  }
  return d;
}

/** Arrondi au dixième, en nombre. */
const f2 = (value: number) => Math.round(value * 10) / 10;

/** Graduations de la couronne : un trait tous les 10°, plus long tous les 90°. */
function ticks(r: number): string {
  let d = "";
  for (let deg = 0; deg < 360; deg += 10) {
    const a = (deg * Math.PI) / 180;
    const inner = r + 3;
    const outer = r + (deg % 90 === 0 ? 14 : 7);
    d += `M${f(CENTER + inner * Math.sin(a))} ${f(CENTER - inner * Math.cos(a))}L${f(CENTER + outer * Math.sin(a))} ${f(CENTER - outer * Math.cos(a))}`;
  }
  return d;
}

/** Faisceau en 16 tranches de 3,25° : l'opacité décroît derrière le bord d'attaque (nord à t = 0). */
const SLICE_DEG = 3.25;
const SWEEP_SLICES = Array.from({ length: 16 }, (_, i) => Number((0.34 * (1 - i / 16) ** 1.7).toFixed(3)));

function slice(origin: Point, r: number, index: number): string {
  // Angles mesurés depuis le nord, sens horaire ; la tranche 0 touche le bord d'attaque.
  const at = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${f(origin.x + r * Math.sin(a))} ${f(origin.y - r * Math.cos(a))}`;
  };
  const from = -(index + 1) * SLICE_DEG;
  const to = -index * SLICE_DEG;
  return `M${f(origin.x)} ${f(origin.y)}L${at(from)}A${f(r)} ${f(r)} 0 0 1 ${at(to)}Z`;
}
