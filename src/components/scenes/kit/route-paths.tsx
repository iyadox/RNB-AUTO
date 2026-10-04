/**
 * Tracés des trajets (docs/09, P10), fragment SVG conforme au contrat du runtime :
 * - racine `<g data-route data-route-mode>` (+ `data-route-start` / `data-route-end` en `scrub`) ;
 * - un tronçon `[data-route-leg="aller|transport|retour|agree"]` par trajet, dans l'ordre ;
 * - tronçons pleins : classe `draw` et `pathLength="1"` ; tronçons en pointillés : révélés
 *   par un masque dont le tracé plein porte `draw` (`data-draw-mask`), ce qui garde les tirets ;
 * - véhicule `[data-route-truck]` posé À L'ARRIVÉE du dernier tronçon (état final, calculé au
 *   rendu) ; le runtime le déplace et l'oriente pendant l'animation, puis le remet en place.
 *
 * Styles : `aller` pointillé craie à 70 % ; `transport` jaune plein, épais (votre véhicule) ;
 * `retour` pointillé gris fin ; `agree` (dépanneur agréé) gris neutre.
 * Le véhicule change d'allure selon le tronçon en cours (`data-route-current`) : vide à l'aller
 * et au retour, chargé pendant le transport, dépanneur agréé gris sur un tronçon `agree`.
 * `off` et sans JavaScript : tracés complets, véhicule à l'arrivée.
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import { TruckTopGlyph } from "./glyphs";
import styles from "./kit.module.css";
import { pathEnd, poseTransform } from "./svg-path";

export type RouteLeg = { key: string; d: string; style: "aller" | "transport" | "retour" | "agree" };

type RoutePathsProps = {
  legs: RouteLeg[];
  mode: "scrub" | "view" | "loop" | "static";
  /** Dépanneuse vue de dessus qui suit le tronçon en cours. */
  truck?: "top" | null;
  /** Préfixe des identifiants SVG (masques) : unique dans la page. */
  idPrefix: string;
  /** Bornes ScrollTrigger du mode `scrub` (défaut du runtime : « top 75% » → « bottom 35% »). */
  scrubStart?: string;
  scrubEnd?: string;
  /**
   * Épaisseur des traits, en multiple de l'unité du `viewBox` (1 par défaut : pensé pour un plan
   * de 600 unités affiché à 300-600 px). Ajout au cahier : `vector-effect` est incompatible
   * avec `pathLength`, l'épaisseur suit donc l'échelle du dessin.
   */
  scale?: number;
  /** Taille de la dépanneuse (1 = 46 unités de long). */
  truckScale?: number;
};

const DASHED = { aller: true, retour: true, transport: false, agree: false } as const;

function Leg({ leg, prefix, scale }: { leg: RouteLeg; prefix: string; scale: number }): ReactElement {
  const w = (value: number) => value * scale;
  if (leg.style === "transport") {
    return (
      <g data-route-leg="transport" className={styles.legTransport}>
        <path className="draw" pathLength={1} d={leg.d} fill="none" stroke="#ffc400" strokeOpacity="0.16" strokeWidth={w(16)} strokeLinecap="round" strokeLinejoin="round" />
        <path className="draw" pathLength={1} d={leg.d} fill="none" stroke="#05070d" strokeOpacity="0.55" strokeWidth={w(9)} strokeLinecap="round" strokeLinejoin="round" />
        <path className="draw" pathLength={1} d={leg.d} fill="none" stroke="#ffc400" strokeWidth={w(5.5)} strokeLinecap="round" strokeLinejoin="round" />
        <path className="draw" pathLength={1} d={leg.d} fill="none" stroke="#fff3b0" strokeOpacity="0.7" strokeWidth={w(1.2)} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  if (leg.style === "agree") {
    return (
      <g data-route-leg="agree">
        <path className="draw" pathLength={1} d={leg.d} fill="none" stroke="#05070d" strokeOpacity="0.5" strokeWidth={w(8)} strokeLinecap="round" strokeLinejoin="round" />
        <path className="draw" pathLength={1} d={leg.d} fill="none" stroke="#9ba6b2" strokeOpacity="0.85" strokeWidth={w(4)} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  const maskId = `${prefix}-mask-${leg.key}`;
  const maskPathId = `${prefix}-maskpath-${leg.key}`;
  const aller = leg.style === "aller";
  return (
    <path
      data-route-leg={leg.style}
      data-draw-mask={maskPathId}
      mask={`url(#${maskId})`}
      d={leg.d}
      fill="none"
      stroke={aller ? "#f5f3ee" : "#6f7b88"}
      strokeOpacity={aller ? 0.7 : 0.95}
      strokeWidth={w(aller ? 3 : 2.2)}
      strokeDasharray={aller ? `${w(5)} ${w(7)}` : `${w(3)} ${w(7)}`}
      strokeLinecap="round"
    />
  );
}

export function RoutePaths({
  legs,
  mode,
  truck = null,
  idPrefix,
  scrubStart,
  scrubEnd,
  scale = 1,
  truckScale = 1,
}: RoutePathsProps): ReactElement | null {
  if (legs.length === 0) return null;
  const last = legs[legs.length - 1]!;
  const end = pathEnd(last.d);
  const finalLook = last.style === "transport" ? styles.truckIsLoaded : last.style === "agree" ? styles.truckIsAgree : styles.truckIsEmpty;
  const dashed = legs.filter((leg) => DASHED[leg.style]);

  return (
    <g
      data-route=""
      data-route-mode={mode}
      data-route-start={mode === "scrub" ? scrubStart : undefined}
      data-route-end={mode === "scrub" ? scrubEnd : undefined}
      className={styles.route}
    >
      {dashed.length > 0 ? (
        <defs>
          {dashed.map((leg) => (
            <mask key={leg.key} id={`${idPrefix}-mask-${leg.key}`} maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="10000" height="10000">
              <path
                id={`${idPrefix}-maskpath-${leg.key}`}
                className="draw"
                pathLength={1}
                d={leg.d}
                fill="none"
                stroke="#fff"
                strokeWidth={(leg.style === "aller" ? 10 : 8) * scale}
                strokeLinecap="round"
              />
            </mask>
          ))}
        </defs>
      ) : null}
      {legs.map((leg) => (
        <Leg key={leg.key} leg={leg} prefix={idPrefix} scale={scale} />
      ))}
      {truck === "top" ? (
        <g data-route-truck="" transform={poseTransform(end.x, end.y, end.angle)} className={cn(styles.routeTruck, finalLook)}>
          <g transform={truckScale === 1 ? undefined : `scale(${truckScale})`} className={styles.routeTruckBody}>
            <g className={styles.truckEmpty}>
              <TruckTopGlyph headlights />
            </g>
            <g className={styles.truckLoaded}>
              <TruckTopGlyph headlights loaded />
            </g>
            <g className={styles.truckAgree}>
              <TruckTopGlyph headlights loaded tone="neutral" />
            </g>
          </g>
        </g>
      ) : null}
    </g>
  );
}
