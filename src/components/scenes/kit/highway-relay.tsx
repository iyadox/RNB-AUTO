"use client";
/**
 * Le relais d'autoroute (docs/09, E.6 et F.4), vue de dessus schématique :
 * 1. sur l'autoroute, le dépanneur agréé (silhouette GRISE, neutre, étiquetée) prend en charge
 *    la voiture en panne sur la bande d'arrêt d'urgence ;
 * 2. il la dépose à la sortie, après le panneau bleu générique « SORTIE » ;
 * 3. la dépanneuse RNB AUTO prend le relais sur la route ordinaire.
 * La dépanneuse RNB AUTO n'apparaît JAMAIS sur une voie d'autoroute : son tronçon commence après
 * la sortie. Le bleu autoroute n'est utilisé que pour le panneau.
 *
 * - `draw` : `scrub` (défilement, ordinateur), `view` (une fois à l'entrée), `static`.
 * - `orientation` : `horizontal`, `vertical` (téléphone : schéma compact en S, autoroute en haut,
 *   bretelle à droite, rue en bas ; pastilles 1, 2, 3 posées sur le dessin et légendes en liste
 *   sous le dessin) ou `auto` (vertical sous 768 px). Légendes en vrai texte (`captions`).
 * - Sans JavaScript et en `off` : schéma complet fixe.
 * - En `auto`, le serveur rend les deux schémas (le CSS choisit, même sans JavaScript) ; après
 *   l'hydratation, seul celui qui correspond à l'écran reste dans la page (budget de nœuds, G.2).
 *   Il change d'orientation si l'écran passe le seuil de 768 px.
 * Composant client : son balisage n'est pas répété dans la charge RSC de la page.
 */
import { useId, useSyncExternalStore, type ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import { CarTopGlyph, FlagGlyph, TruckTopGlyph } from "./glyphs";
import styles from "./kit.module.css";
import { RoutePaths, type RouteLeg } from "./route-paths";

type HighwayRelayProps = {
  draw?: "scrub" | "view" | "static";
  captions?: boolean;
  orientation?: "auto" | "horizontal" | "vertical";
  className?: string;
};

// Espaces insécables avant « : » (typographie française).
const CAPTIONS = ["Sur l'autoroute\u00a0: le dépanneur agréé", "À la sortie", "RNB AUTO prend le relais"] as const;

/** Géométrie d'un schéma (un par orientation). */
type Layout = {
  viewBox: string;
  /** Chaussée de l'autoroute : bords haut et bas, lignes de voies, ligne de la bande d'arrêt. */
  highway: { x0: number; x1: number; top: number; lanes: number[]; bau: number; bottom: number; rail: number };
  /** Interruption du bord droit et de la glissière à l'endroit de la bretelle. */
  gap: [number, number];
  /** Chaussée opposée (au-delà du terre-plein), avec ses traînées de feux. */
  opposite: { top: number; bottom: number };
  ramp: string;
  roundabout: { x: number; y: number };
  street: string;
  blocks: string;
  car: { x: number; y: number };
  agreeParked: { x: number; y: number; angle: number };
  /** Étiquette « DÉPANNEUR AGRÉÉ » (sur deux lignes si `stacked`, pour dégager le panneau). */
  label: { x: number; y: number; anchor: "start" | "middle" | "end"; stacked?: boolean };
  sign: { x: number; y: number };
  flag: { x: number; y: number };
  /** Pastilles 1, 2, 3 posées sur le dessin (repères des légendes), facultatives. */
  pins?: { x: number; y: number }[];
  legs: RouteLeg[];
  scale: number;
  truckScale: number;
};

const HORIZONTAL: Layout = {
  viewBox: "0 0 960 300",
  highway: { x0: -20, x1: 980, top: 70, lanes: [96, 122], bau: 150, bottom: 170, rail: 177 },
  gap: [436, 612],
  opposite: { top: 8, bottom: 56 },
  ramp: "M450 160C540 160 578 180 604 214S640 246 662 250",
  roundabout: { x: 684, y: 252 },
  street: "M706 252C760 256 800 262 846 254S900 244 960 246",
  blocks: "M720 196h46v34h-46zM784 200h38v30h-38zM842 196h52v36h-52zM732 276h40v24h-40zM796 280h56v20h-56zM874 270h46v30h-46z",
  car: { x: 108, y: 160 },
  agreeParked: { x: 618, y: 226, angle: 52 },
  label: { x: 600, y: 262, anchor: "end" },
  sign: { x: 404, y: 210 },
  flag: { x: 912, y: 244 },
  legs: [
    { key: "agree", style: "agree", d: "M108 160C210 160 252 136 330 136L452 136C536 136 572 168 598 208" },
    { key: "transport", style: "transport", d: "M690 250C750 256 800 262 846 254S880 246 900 244" },
  ],
  scale: 1.15,
  truckScale: 1,
};

/**
 * Téléphone : schéma compact en S (environ 360 × 300 unités, soit 16:13 affiché sur 330-360 px)
 * au lieu d'un long ruban vertical. L'autoroute file vers la droite en haut, la bretelle plonge
 * vers le giratoire, la route ordinaire repart vers la gauche en bas : le dessin remplit le cadre.
 * Les étapes 1, 2, 3 sont des pastilles posées sur le tracé (`pins`), reprises par les légendes
 * en vrai texte sous le dessin (aucun chevauchement possible, même à 320 px).
 */
const VERTICAL: Layout = {
  viewBox: "0 0 360 300",
  highway: { x0: -20, x1: 380, top: 40, lanes: [60, 80], bau: 100, bottom: 114, rail: 120 },
  gap: [206, 318],
  opposite: { top: 0, bottom: 30 },
  ramp: "M206 107C252 107 280 120 292 144S300 170 300 178",
  roundabout: { x: 300, y: 200 },
  street: "M300 222C300 250 278 262 244 262C200 262 160 256 120 260S60 268 -20 268",
  blocks: "M18 140h40v40h-40zM22 196h46v38h-46zM84 204h38v32h-38zM138 200h50v36h-50zM206 186h40v44h-40zM110 282h42v18h-42zM212 280h44v20h-44zM330 240h30v48h-30z",
  car: { x: 56, y: 107 },
  agreeParked: { x: 298, y: 164, angle: 84 },
  label: { x: 282, y: 150, anchor: "end", stacked: true },
  sign: { x: 118, y: 150 },
  flag: { x: 58, y: 250 },
  pins: [
    { x: 56, y: 72 },
    { x: 334, y: 150 },
    { x: 178, y: 286 },
  ],
  legs: [
    { key: "agree", style: "agree", d: "M56 107C96 107 114 90 150 90L196 90C240 90 270 104 284 128S296 150 296 156" },
    { key: "transport", style: "transport", d: "M300 224C300 250 278 262 244 262C200 262 160 256 128 260S102 264 96 264" },
  ],
  scale: 1,
  truckScale: 0.92,
};

function RelaySvg({ layout, draw, prefix, className }: { layout: Layout; draw: NonNullable<HighwayRelayProps["draw"]>; prefix: string; className?: string }) {
  const { highway: h, opposite: o } = layout;
  const width = h.x1 - h.x0;
  const dash = `M${h.x0} 0H${h.x1}`;
  return (
    <svg viewBox={layout.viewBox} className={cn(styles.relaySvg, className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${prefix}-trail-w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e3ecff" stopOpacity="0" />
          <stop offset="1" stopColor="#e3ecff" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${prefix}-trail-r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff4b3a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff4b3a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${prefix}-fade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.07" stopColor="#fff" />
          <stop offset="0.93" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${prefix}-mask`} maskContentUnits="objectBoundingBox">
          <rect width="1" height="1" fill={`url(#${prefix}-fade)`} />
        </mask>
        <radialGradient id={`${prefix}-pool`}>
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Tout le schéma s'estompe sur les bords gauche et droit (pas de bloc découpé net). */}
      <g mask={`url(#${prefix}-mask)`}>
      {/* Chaussée opposée (au-delà du terre-plein) : traînées de feux lointaines, statiques */}
      <rect x={h.x0} y={o.top} width={width} height={o.bottom - o.top} fill="#0a0e17" />
      <path d={`${dash}`} transform={`translate(0 ${(o.top + o.bottom) / 2})`} stroke="#f5f3ee" strokeOpacity="0.14" strokeWidth="1.5" strokeDasharray="22 30" />
      <rect x={h.x0 + width * 0.12} y={o.top + 10} width={width * 0.22} height="2" fill={`url(#${prefix}-trail-r)`} />
      <rect x={h.x0 + width * 0.55} y={o.bottom - 14} width={width * 0.3} height="2" fill={`url(#${prefix}-trail-r)`} />
      <rect x={h.x0 + width * 0.38} y={o.top + 18} width={width * 0.16} height="1.6" fill={`url(#${prefix}-trail-r)`} />
      {/* Terre-plein central et sa glissière */}
      <path d={`M${h.x0} ${(o.bottom + h.top) / 2}H${h.x1}`} stroke="#6f7b88" strokeOpacity="0.5" strokeWidth="2" />

      {/* Bretelle de sortie, giratoire, route ordinaire et îlots bâtis */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={layout.ramp} stroke="#0d121c" strokeWidth="24" />
        <path d={layout.street} stroke="#0d121c" strokeWidth="22" />
        <circle cx={layout.roundabout.x} cy={layout.roundabout.y} r="22" stroke="#0d121c" strokeWidth="20" />
        <path d={layout.ramp} stroke="#f5f3ee" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="10 12" />
        <path d={layout.street} stroke="#f5f3ee" strokeOpacity="0.16" strokeWidth="1.2" strokeDasharray="12 14" />
      </g>
      <circle cx={layout.roundabout.x} cy={layout.roundabout.y} r="11" fill="#141c14" stroke="#f5f3ee" strokeOpacity="0.2" />
      <path d={layout.blocks} fill="#f5f3ee" fillOpacity="0.04" stroke="#f5f3ee" strokeOpacity="0.08" />
      <circle cx={layout.roundabout.x} cy={layout.roundabout.y} r="64" fill={`url(#${prefix}-pool)`} />

      {/* Autoroute : chaussée, voies, bande d'arrêt d'urgence, glissière de droite */}
      <rect x={h.x0} y={h.top} width={width} height={h.bottom - h.top} fill="#0d121c" />
      <path d={`M${h.x0} ${h.top}H${h.x1}M${h.x0} ${h.bau}H${h.x1}`} stroke="#f5f3ee" strokeOpacity="0.5" strokeWidth="1.6" />
      {h.lanes.map((y) => (
        <path key={y} d={`M${h.x0} ${y}H${h.x1}`} stroke="#f5f3ee" strokeOpacity="0.38" strokeWidth="1.6" strokeDasharray="26 34" />
      ))}
      <path d={`M${h.x0} ${h.bottom}H${layout.gap[0]}M${layout.gap[1]} ${h.bottom}H${h.x1}`} stroke="#f5f3ee" strokeOpacity="0.32" strokeWidth="1.2" />
      <path d={`M${h.x0} ${h.rail}H${layout.gap[0] - 8}M${layout.gap[1] + 8} ${h.rail}H${h.x1}`} stroke="#9ba6b2" strokeOpacity="0.55" strokeWidth="2.2" />
      <path
        d={`M${h.x0} ${h.rail}H${layout.gap[0] - 8}M${layout.gap[1] + 8} ${h.rail}H${h.x1}`}
        stroke="#9ba6b2"
        strokeOpacity="0.5"
        strokeWidth="5"
        strokeDasharray="1.6 22"
      />

      {/* Panneau bleu générique « SORTIE » (sans numéro), après la bande d'arrêt d'urgence */}
      <g transform={`translate(${layout.sign.x} ${layout.sign.y})`}>
        <path d="M0 18V40" stroke="#6f7b88" strokeWidth="2.4" />
        <rect x="-42" y="-14" width="84" height="32" rx="4" fill="#1d4fa3" stroke="#f5f3ee" strokeWidth="2" />
        <text x="-9" y="7" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f5f3ee" style={{ letterSpacing: "0.06em" }}>
          SORTIE
        </text>
        <path d="M26 -4l8 8M34 -2v6h-6" fill="none" stroke="#f5f3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Voiture en panne sur la bande d'arrêt d'urgence (cachée dès que le relais commence) */}
      <g className={styles.relayCar} transform={`translate(${layout.car.x} ${layout.car.y})`}>
        <CarTopGlyph hazards />
      </g>

      {/* Dépanneur agréé garé à la sortie, une fois la voiture remise */}
      <g className={styles.relayAgree}>
        <g transform={`translate(${layout.agreeParked.x} ${layout.agreeParked.y}) rotate(${layout.agreeParked.angle}) scale(${layout.truckScale})`}>
          <TruckTopGlyph tone="neutral" />
        </g>
        <text
          x={layout.label.x}
          y={layout.label.y}
          textAnchor={layout.label.anchor}
          fontSize="11"
          fontWeight="700"
          fill="#9ba6b2"
          stroke="#05070d"
          strokeWidth="3"
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ letterSpacing: "0.12em" }}
        >
          {layout.label.stacked ? (
            <>
              DÉPANNEUR
              <tspan x={layout.label.x} dy="13">
                AGRÉÉ
              </tspan>
            </>
          ) : (
            "DÉPANNEUR AGRÉÉ"
          )}
        </text>
      </g>

      <g transform={`translate(${layout.flag.x} ${layout.flag.y})`}>
        <FlagGlyph />
      </g>

      <RoutePaths
        legs={layout.legs}
        mode={draw}
        truck="top"
        idPrefix={prefix}
        scale={layout.scale}
        truckScale={layout.truckScale}
        scrubStart="top 80%"
        scrubEnd="bottom 45%"
      />
      </g>

      {/* Repères des étapes, hors du fondu des bords (mêmes couleurs que les légendes) */}
      {layout.pins?.map((pin, index) => (
        <g key={index} data-pin={index + 1} transform={`translate(${pin.x} ${pin.y})`} className={cn(styles.relayPin, "font-figure")}>
          <rect x="-11" y="-11" width="22" height="22" rx="4" stroke="#05070d" strokeWidth="2" />
          <text y="5" textAnchor="middle" fontSize="14" fontWeight="800" fill="#05070d">
            {index + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}

const WIDE_QUERY = "(min-width: 768px)";
type Shown = "both" | "horizontal" | "vertical";

const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const wideSnapshot = (): Shown => (window.matchMedia(WIDE_QUERY).matches ? "horizontal" : "vertical");
/** Rendu serveur et hydratation : les deux schémas (le CSS choisit). */
const serverSnapshot = (): Shown => "both";

export function HighwayRelay({ draw = "view", captions = true, orientation = "auto", className }: HighwayRelayProps): ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const shown = useSyncExternalStore(subscribeWide, wideSnapshot, serverSnapshot);
  const auto = orientation === "auto";
  const horizontal = orientation === "horizontal" || (auto && shown !== "vertical");
  const vertical = orientation === "vertical" || (auto && shown !== "horizontal");
  return (
    // `data-pause-offscreen` : les warnings de la voiture en panne clignotent (P14).
    <figure data-pause-offscreen="" className={cn(styles.relay, orientation === "auto" && styles.relayAuto, className)}>
      {horizontal ? (
        <div className={cn(styles.relayH, orientation === "auto" && styles.relayOnlyWide)}>
          <RelaySvg layout={HORIZONTAL} draw={draw} prefix={`relay-${uid}-h`} />
          {captions ? (
            <figcaption className={styles.relayCaptionsH}>
              <ol>
                {CAPTIONS.map((text, index) => (
                  <li key={text}>
                    <span className={cn(styles.relayStep, "font-figure")} aria-hidden="true">
                      {index + 1}
                    </span>
                    {text}
                  </li>
                ))}
              </ol>
            </figcaption>
          ) : null}
        </div>
      ) : null}
      {vertical ? (
        <div className={cn(styles.relayV, orientation === "auto" && styles.relayOnlyNarrow)}>
          <RelaySvg layout={VERTICAL} draw={draw} prefix={`relay-${uid}-v`} />
          {captions ? (
            <figcaption className={styles.relayCaptionsV}>
              <ol>
                {CAPTIONS.map((text, index) => (
                  <li key={text} data-step={index + 1}>
                    <span className={cn(styles.relayStep, "font-figure")} aria-hidden="true">
                      {index + 1}
                    </span>
                    {text}
                  </li>
                ))}
              </ol>
            </figcaption>
          ) : null}
        </div>
      ) : null}
    </figure>
  );
}
