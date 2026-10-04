/**
 * Calques des zones sur le « Plan RNB » (docs/09, F.3, PK 02) : surface allumée, communes du
 * plan qui s'éclairent, trajet « aller » depuis le dépôt et dépanneuse à l'arrivée. Décor
 * (le `<svg>` parent porte `aria-hidden`) : les secteurs sont donnés en texte dans la liste.
 * Rendu serveur, dans le repère 600 × 600 du plan.
 */
import type { CSSProperties, ReactElement } from "react";
import { DepotGlyph, TruckTopGlyph } from "@/components/scenes/kit/glyphs";
import { formatSvgNumber as f, poseTransform, type Point } from "@/components/scenes/kit/svg-path";
import type { ZoneShape } from "./zone-geometry";
import styles from "./zones.module.css";

export function ZoneLayer({
  shape,
  depot,
  idPrefix,
  order,
  truck = true,
}: {
  shape: ZoneShape;
  depot: Point | null;
  idPrefix: string;
  /** Rang du temps de la scène collante (1 à 4) qui allume ce calque. */
  order?: number;
  truck?: boolean;
}): ReactElement {
  const maskId = `${idPrefix}-${shape.zone}-mask`;
  const haloId = `${idPrefix}-${shape.zone}-halo`;
  return (
    <g className={styles.zoneLayer} data-zone={shape.zone} data-order={order}>
      <defs>
        <radialGradient id={haloId}>
          <stop offset="0" stopColor="#ffc400" stopOpacity="0.42" />
          <stop offset="0.55" stopColor="#ffc400" stopOpacity="0.12" />
          <stop offset="1" stopColor="#ffc400" stopOpacity="0" />
        </radialGradient>
        {shape.route ? (
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600">
            <path className={styles.routeMask} d={shape.route.d} pathLength={1} fill="none" stroke="#fff" strokeWidth="14" />
          </mask>
        ) : null}
      </defs>

      {shape.area ? (
        <>
          <path className={styles.zoneFill} d={shape.area} fillRule="evenodd" />
          <path className={styles.zoneEdge} d={shape.area} fillRule="evenodd" fill="none" />
        </>
      ) : depot ? (
        <>
          <circle className={styles.zoneFill93} cx={f(depot.x)} cy={f(depot.y)} r="86" fill={`url(#${haloId})`} />
          <circle className={styles.zoneEdge} cx={f(depot.x)} cy={f(depot.y)} r="62" fill="none" strokeDasharray="3 7" />
        </>
      ) : null}

      {/* Onde du gyrophare du dépôt quand la zone s'allume (scène collante seulement). */}
      {depot ? <circle className={styles.zonePing} cx={f(depot.x)} cy={f(depot.y)} r="60" /> : null}

      <g className={styles.zoneCities}>
        {shape.cities.map((city, index) => (
          <g key={city.name} style={{ "--i": index } as CSSProperties} className={styles.zoneCity}>
            <circle cx={f(city.p.x)} cy={f(city.p.y)} r="11" className={styles.zoneCityHalo} />
            <circle cx={f(city.p.x)} cy={f(city.p.y)} r="4.2" className={styles.zoneCityDot} />
          </g>
        ))}
      </g>

      {shape.route ? (
        <g className={styles.zoneRoute}>
          <path
            d={shape.route.d}
            mask={`url(#${maskId})`}
            fill="none"
            stroke="#f5f3ee"
            strokeOpacity="0.8"
            strokeWidth="2.4"
            strokeDasharray="5 7"
            strokeLinecap="round"
          />
          {truck ? (
            <g transform={poseTransform(shape.route.end.x, shape.route.end.y, shape.route.end.angle)}>
              <g className={styles.zoneTruck}>
                <TruckTopGlyph headlights />
              </g>
            </g>
          ) : null}
        </g>
      ) : null}
    </g>
  );
}

/** Losange du dépôt, à poser au-dessus des calques (vignettes : le symbole du plan n'en a pas). */
export function DepotMark({ depot, scale = 1 }: { depot: Point | null; scale?: number }): ReactElement | null {
  if (!depot) return null;
  return (
    <g transform={`translate(${f(depot.x)} ${f(depot.y)}) scale(${scale})`}>
      <DepotGlyph />
    </g>
  );
}
