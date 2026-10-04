/**
 * Les trois trajets de la dépanneuse (docs/09, A.1 et B.8) : « le calcul ». Dépôt → vous
 * (① aller), vous → destination (② transport, en jaune : c'est votre véhicule), destination →
 * dépôt (③ retour). En dépannage sur place (`on_site`), pas de transport : l'aller et le retour.
 *
 * - Les kilomètres de l'aller et du transport s'affichent s'ils sont connus ; le retour n'en
 *   affiche JAMAIS.
 * - `draw` : `view` (une fois à l'entrée), `scrub` (défilement, ordinateur), `loop` (attente du
 *   calcul dans /demande), `static`. Sans JavaScript et en `off` : tracés complets, dépanneuse
 *   rentrée au dépôt.
 * - Le schéma est décoratif (`aria-hidden`) ; la légende en dessous est du vrai texte.
 */
import { useId, type ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import { DepotGlyph, FlagGlyph, PinGlyph } from "./glyphs";
import styles from "./kit.module.css";
import { RoutePaths, type RouteLeg } from "./route-paths";

type ThreeLegsProps = {
  mode?: "tow" | "on_site";
  km?: { aller: number | null; transport: number | null } | null;
  draw?: "view" | "scrub" | "loop" | "static";
  compact?: boolean;
  className?: string;
};

const DEPOT = { x: 84, y: 170 };
const YOU = { x: 330, y: 74 };
const DEST = { x: 560, y: 134 };

// Les tracés partent du bord du dépôt et y reviennent : la dépanneuse rentrée se gare sous le
// losange (état final), en biais vers le bas : ses phares éclairent le bord du plan, jamais
// l'enseigne du dépôt.
const LEGS_TOW: RouteLeg[] = [
  { key: "aller", style: "aller", d: `M104 160C176 156 214 74 ${YOU.x} ${YOU.y}` },
  { key: "transport", style: "transport", d: `M${YOU.x} ${YOU.y}C432 74 468 134 ${DEST.x} ${DEST.y}` },
  { key: "retour", style: "retour", d: `M${DEST.x} ${DEST.y}C566 206 430 214 318 212S166 206 124 220` },
];
const LEGS_ON_SITE: RouteLeg[] = [
  LEGS_TOW[0]!,
  { key: "retour", style: "retour", d: `M${YOU.x} ${YOU.y}C344 154 270 214 200 212S158 208 124 220` },
];

const kmFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const formatKm = (value: number | null | undefined) => (value === null || value === undefined ? null : `${kmFormat.format(value)} km`);

/** Pastille numérotée posée sur un tronçon. */
function Badge({ x, y, n, tone }: { x: number; y: number; n: number; tone: "aller" | "transport" | "retour" }) {
  const fill = tone === "transport" ? "#ffc400" : "#05070d";
  const stroke = tone === "transport" ? "#05070d" : tone === "aller" ? "#f5f3ee" : "#6f7b88";
  const color = tone === "transport" ? "#05070d" : tone === "aller" ? "#f5f3ee" : "#c8ced6";
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={styles.mark}>
      <circle r="12.5" fill={fill} stroke={stroke} strokeWidth="2" />
      <text y="4.6" textAnchor="middle" fontSize="13" fontWeight="900" fill={color} style={{ fontStretch: "75%" }}>
        {n}
      </text>
      </g>
    </g>
  );
}

export function ThreeLegs({ mode = "tow", km = null, draw = "view", compact = false, className }: ThreeLegsProps): ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const tow = mode === "tow";
  const legs = tow ? LEGS_TOW : LEGS_ON_SITE;
  const allerKm = formatKm(km?.aller);
  const transportKm = tow ? formatKm(km?.transport) : null;

  return (
    // `data-pause-offscreen` : les warnings de l'épingle « Vous » clignotent (P14).
    <figure data-pause-offscreen="" className={cn(styles.threeLegs, compact && styles.threeLegsCompact, className)}>
      <svg viewBox={compact ? "40 40 560 196" : "0 20 640 220"} className={styles.threeLegsSvg} aria-hidden="true">
        <defs>
          <pattern id={`tl-${uid}-dots`} width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="#f5f3ee" fillOpacity="0.07" />
          </pattern>
          <radialGradient id={`tl-${uid}-fade`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.35" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id={`tl-${uid}-mask`} maskUnits="userSpaceOnUse" x="0" y="20" width="640" height="220">
            <rect x="0" y="20" width="640" height="220" fill={`url(#tl-${uid}-fade)`} />
          </mask>
        </defs>
        {/* Plan discret : trame de points et rues stylisées, fondus vers les bords */}
        <g mask={`url(#tl-${uid}-mask)`}>
          <rect x="0" y="20" width="640" height="220" fill={`url(#tl-${uid}-dots)`} />
          <g fill="none" stroke="#f5f3ee" strokeOpacity="0.07" strokeWidth="7" strokeLinecap="round">
            <path d="M0 118C120 102 220 140 340 128S540 92 640 104" />
            <path d="M210 240C228 170 250 90 236 20" />
            <path d="M450 240C470 190 452 110 490 20" />
          </g>
        </g>

        <RoutePaths legs={legs} mode={draw} truck="top" idPrefix={`tl-${uid}`} scale={1.05} truckScale={1.15} />

        <g transform={`translate(${DEPOT.x} ${DEPOT.y})`}>
          <g className={styles.mark}>
            <DepotGlyph />
          </g>
        </g>
        <g transform={`translate(${YOU.x} ${YOU.y})`}>
          <g className={styles.mark}>
            <PinGlyph label={compact ? undefined : "Vous"} hazards />
          </g>
        </g>
        {tow ? (
          <g transform={`translate(${DEST.x} ${DEST.y})`}>
            <g className={styles.mark}>
              <FlagGlyph />
            </g>
          </g>
        ) : null}

        <Badge x={196} y={112} n={1} tone="aller" />
        {tow ? <Badge x={452} y={96} n={2} tone="transport" /> : null}
        <Badge x={tow ? 420 : 232} y={tow ? 212 : 205} n={tow ? 3 : 2} tone="retour" />
      </svg>

      <figcaption className={styles.threeLegsLegend}>
        <ol>
          <li data-leg="aller">
            <span className={styles.legSwatch} aria-hidden="true" />
            <span className={styles.legName}>
              <span aria-hidden="true">1 · </span>Aller
            </span>
            {allerKm ? <span className={styles.legKm}>{allerKm}</span> : null}
          </li>
          {tow ? (
            <li data-leg="transport">
              <span className={styles.legSwatch} aria-hidden="true" />
              <span className={styles.legName}>
                <span aria-hidden="true">2 · </span>Transport
              </span>
              {transportKm ? <span className={styles.legKm}>{transportKm}</span> : null}
            </li>
          ) : null}
          <li data-leg="retour">
            <span className={styles.legSwatch} aria-hidden="true" />
            <span className={styles.legName}>
              <span aria-hidden="true">{tow ? "3" : "2"} · </span>Retour
            </span>
          </li>
        </ol>
      </figcaption>
    </figure>
  );
}
