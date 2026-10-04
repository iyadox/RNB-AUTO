/**
 * Scène « Route barrée » (docs/09, F.10), pour la 404 et la page d'erreur.
 *
 * Repère : un monde de 200 × 120 unités, chaussée à y = 96 ; le cadre a le même rapport
 * (200 / 120), donc la dépanneuse (HTML) se place en pourcentages du cadre sans décalage.
 * - Barrière à chevrons jaunes et noirs sur deux chevalets, deux feux orange à 1 Hz qui se
 *   répondent, deux cônes.
 * - Lampadaire au sodium : il « respire » (`.lamp-breathe`) sur la 404, il est éteint sur la page
 *   d'erreur.
 * - Panneau jaune « DÉVIATION », flèche vers le bas (la déviation est juste en dessous).
 * - 404 : la dépanneuse RNB AUTO arrive et freine devant la barrière, phares sur la barrière,
 *   gyrophare éteint (elle n'est pas en intervention ; deux boucles visibles au plus).
 *
 * Tout est décoratif (`aria-hidden`). Sans JavaScript et en `off` : état final.
 * Composant sans état ni accès serveur : utilisable par la page d'erreur (composant client).
 */
import type { ReactElement } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { Skyline } from "@/components/scenes/base/skyline";
import { cn } from "@/components/ui/cn";
import styles from "./errors.module.css";

export type DetourVariant = "notfound" | "error";

/** Feu orange de chantier : boîtier, lentille et halo (la lentille et le halo clignotent ensemble). */
function BarrierLight({ x, y, alt, id }: { x: number; y: number; alt?: boolean; id: string }) {
  const blink = cn("hazard", alt && styles.hazardAlt);
  return (
    <g>
      <rect x={x - 0.6} y={y + 2.2} width={1.2} height={3.6} fill="var(--color-asphalt-600)" />
      <rect x={x - 2.4} y={y - 2.4} width={4.8} height={4.8} rx={0.9} fill="var(--color-asphalt-850)" />
      <circle className={blink} cx={x} cy={y} r={9} fill={`url(#${id}-hazard)`} />
      <circle className={blink} cx={x} cy={y} r={1.75} fill="var(--color-beacon-400)" />
    </g>
  );
}

/** Cône de signalisation. */
function Cone({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 1.6} 94.6 L${x - 0.55} 87 H${x + 0.55} L${x + 1.6} 94.6Z`} fill="var(--color-beacon-500)" />
      <path d={`M${x - 1.2} 91.6 L${x - 0.9} 89.6 H${x + 0.9} L${x + 1.2} 91.6Z`} fill="var(--color-chalk)" opacity="0.85" />
      <rect x={x - 2.6} y={94.6} width={5.2} height={1.4} rx={0.3} fill="var(--color-asphalt-800)" />
    </g>
  );
}

export function DetourScene({ variant, id = "detour" }: { variant: DetourVariant; id?: string }): ReactElement {
  const lit = variant === "notfound";
  return (
    <div className={styles.frame} aria-hidden="true" data-pause-offscreen="">
      <Skyline layer="far" className={styles.frameSkyline} />
      <svg className={styles.world} viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id={`${id}-cone`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.4" />
            <stop offset="0.65" stopColor="var(--color-sodium)" stopOpacity="0.1" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0.05" />
          </linearGradient>
          <radialGradient id={`${id}-halo`}>
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.6" />
            <stop offset="0.3" stopColor="var(--color-sodium)" stopOpacity="0.16" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-pool`}>
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.36" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-hazard`}>
            <stop offset="0" stopColor="var(--color-beacon-400)" stopOpacity="0.75" />
            <stop offset="0.35" stopColor="var(--color-beacon-500)" stopOpacity="0.25" />
            <stop offset="1" stopColor="var(--color-beacon-500)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-road`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-asphalt-800)" />
            <stop offset="0.55" stopColor="var(--color-asphalt-900)" />
            <stop offset="1" stopColor="var(--color-night-950)" />
          </linearGradient>
          <linearGradient id={`${id}-wet`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.34" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-wet-beacon`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-beacon-500)" stopOpacity="0.3" />
            <stop offset="1" stopColor="var(--color-beacon-500)" stopOpacity="0" />
          </linearGradient>
          <pattern id={`${id}-chevrons`} width="4.4" height="4.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2.2" height="4.4" fill="var(--color-signal-500)" />
            <rect x="2.2" width="2.2" height="4.4" fill="var(--color-asphalt-950)" />
          </pattern>
          <pattern id={`${id}-chevrons-r`} width="4.4" height="4.4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <rect width="2.2" height="4.4" fill="var(--color-signal-500)" />
            <rect x="2.2" width="2.2" height="4.4" fill="var(--color-asphalt-950)" />
          </pattern>
        </defs>

        {/* Accotement derrière la barrière */}
        <path d="M0 92.6Q50 91.6 100 92.2T200 92V96H0Z" fill="var(--color-asphalt-900)" />

        {/* Lampadaire au sodium : allumé (il respire) sur la 404, éteint sur la page d'erreur */}
        {lit ? (
          <g className="lamp-breathe">
            <circle cx="125" cy="13.4" r="20" fill={`url(#${id}-halo)`} />
            <polygon points="121.6,14 128.4,14 152,96 98,96" fill={`url(#${id}-cone)`} />
            <ellipse cx="125" cy="96.6" rx="30" ry="2.6" fill={`url(#${id}-pool)`} />
          </g>
        ) : null}
        <rect x="148.6" y="14" width="1.6" height="82" fill="var(--color-asphalt-700)" />
        <rect x="148.6" y="14" width="0.45" height="82" fill="var(--color-sodium)" fillOpacity={lit ? 0.2 : 0.05} />
        <path d="M149.4 15.6Q149.4 11.6 145 11.6H131" fill="none" stroke="var(--color-asphalt-600)" strokeWidth="1.2" />
        <path d="M132.6 10.2H118.6Q117.8 12.6 119.8 13.6H130.2Q132.4 12.6 132.6 10.2Z" fill="var(--color-asphalt-750)" />
        <rect
          x="120"
          y="13.1"
          width="10"
          height="0.9"
          rx="0.4"
          fill={lit ? "var(--color-sodium)" : "var(--color-asphalt-600)"}
        />

        {/* Panneau « DÉVIATION » */}
        <rect x="174.3" y="50" width="1.4" height="46" fill="var(--color-asphalt-600)" />
        <rect x="161" y="36" width="28" height="16" rx="1.2" fill="var(--color-signal-500)" />
        <rect x="162" y="37" width="26" height="14" rx="0.8" fill="none" stroke="var(--color-ink)" strokeWidth="0.55" />
        <text x="175" y="42.9" textAnchor="middle" className={styles.signText} fill="var(--color-ink)">
          DÉVIATION
        </text>
        <path
          d="M171.4 44.6 L178.2 49 M178.2 45.3 V49 H174.5"
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="1"
          strokeLinecap="square"
        />

        {/* Chaussée mouillée : bord, ligne médiane, plots, reflets */}
        <rect x="-20" y="96" width="240" height="24" fill={`url(#${id}-road)`} />
        <path d="M-20 96H220" stroke="var(--color-chalk)" strokeOpacity="0.16" strokeWidth="0.3" />
        <path d="M-20 108H220" stroke="var(--color-chalk)" strokeOpacity="0.3" strokeWidth="0.6" strokeDasharray="7 7" />
        {[6, 34, 62, 90, 118, 146, 174].map((x) => (
          <rect key={x} x={x} y="107.6" width="1.1" height="0.8" rx="0.2" fill="var(--color-reflect)" fillOpacity="0.45" />
        ))}
        {lit ? <ellipse cx="125" cy="104" rx="1.6" ry="8" fill={`url(#${id}-wet)`} /> : null}
        <ellipse cx="104" cy="101" rx="1" ry="4.5" fill={`url(#${id}-wet-beacon)`} />
        <ellipse cx="156" cy="101" rx="1" ry="4.5" fill={`url(#${id}-wet-beacon)`} />

        {/* Barrière : deux chevalets, la lisse à chevrons, la lisse basse */}
        {[106, 154].map((x) => (
          <g key={x} stroke="var(--color-asphalt-500)" strokeWidth="1.1" strokeLinecap="round">
            <path d={`M${x - 1.5} 74 L${x - 4.5} 95.4`} />
            <path d={`M${x + 1.5} 74 L${x + 4.5} 95.4`} />
            <path d={`M${x - 3.4} 87.4 H${x + 3.4}`} strokeWidth="0.8" />
          </g>
        ))}
        <rect x="100" y="66" width="30" height="8.4" rx="0.8" fill={`url(#${id}-chevrons)`} />
        <rect x="130" y="66" width="30" height="8.4" rx="0.8" fill={`url(#${id}-chevrons-r)`} />
        <rect x="100" y="66" width="60" height="8.4" rx="0.8" fill="none" stroke="var(--color-asphalt-950)" strokeWidth="0.6" />
        <rect x="100.4" y="66.3" width="59.2" height="0.5" fill="var(--color-reflect)" fillOpacity="0.35" />
        <rect x="102" y="78.4" width="56" height="2.6" rx="0.5" fill="var(--color-chalk)" fillOpacity="0.82" />
        {[108, 118, 128, 138, 148].map((x) => (
          <rect key={x} x={x} y="78.4" width="5" height="2.6" fill="var(--color-asphalt-950)" fillOpacity="0.85" />
        ))}

        <BarrierLight x={102.4} y={61.6} id={id} />
        <BarrierLight x={157.6} y={61.6} id={id} alt />

        <Cone x={95} />
        <Cone x={166} />
      </svg>

      {lit ? (
        <div className={styles.truckLane} data-inview-once="">
          <div className={styles.truck}>
            <TowTruck headlights beacon={false} id={`${id}-truck`} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
