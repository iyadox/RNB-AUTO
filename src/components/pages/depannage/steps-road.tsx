/**
 * /depannage, PK 02 « Quatre étapes, aucune surprise » : la route aux quatre bornes (F.1).
 *
 * - Ordinateur (≥ 1 024 px) : une route vue de dessus traverse la page ; quatre bornes
 *   (à tête jaune, comme les bornes des routes départementales) la bordent, chaque étape sous
 *   sa borne. La dépanneuse vue de dessus va de borne en borne, liée au défilement (scène
 *   `steps-road`, niveau `full`) ; le tracé jaune la suit et chaque borne s'allume à son passage.
 * - Mobile et tablette : route verticale à gauche ; le remplissage jaune suit le défilement
 *   (`view()` en CSS), la dépanneuse descend avec lui et chaque borne s'allume (reflet P6).
 * Sans JavaScript, en `lite` (mobile) et en `off` : état final (tracé complet, dépanneuse à la
 * dernière borne, bornes allumées). Les textes sont toujours lisibles.
 */
import type { CSSProperties, ReactElement } from "react";
import { TruckTopGlyph } from "@/components/scenes/kit/glyphs";
import { ChevronRow } from "./road-marks";
import styles from "./depannage.module.css";

/** Textes existants de la page, mot pour mot. */
const STEPS = [
  { title: "Vous décrivez la panne", text: "En ligne, par téléphone ou sur WhatsApp, en quelques secondes." },
  { title: "Vous voyez le prix", text: "L'estimation tient compte de la distance, de l'horaire et de la situation." },
  { title: "Nous confirmons", text: "Nous vous rappelons pour valider le prix et l'heure d'arrivée." },
  { title: "Nous intervenons", text: "Sur place si c'est possible, sinon votre véhicule est remorqué." },
] as const;

/* Route horizontale (ordinateur) : repère de 1 200 × 132 ; les bornes sont au centre des quatre
   colonnes (150, 450, 750, 1 050), la dépanneuse roule dans la voie du bas (y = 90). */
const ROAD_W = 1200;
const LANE_Y = 90;
const TRUCK_FROM = 24;
const TRUCK_TO = 1050;
const TRUCK_SCALE = 2.1;

/** Petite borne kilométrique : tête jaune, fût craie, numéro de l'étape. */
function Borne({ index }: { index: number }): ReactElement {
  return (
    <span className={styles.borne} data-retro="" aria-hidden="true">
      <span className={styles.borneCap} />
      <span className={styles.borneNumber}>{String(index + 1).padStart(2, "0")}</span>
    </span>
  );
}

function HorizontalRoad(): ReactElement {
  return (
    <svg viewBox={`0 0 ${ROAD_W} 132`} className={styles.stepsRoadSvg} aria-hidden="true">
      <defs>
        <linearGradient id="dp-steps-asphalt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-asphalt-850)" />
          <stop offset="0.5" stopColor="var(--color-asphalt-800)" />
          <stop offset="1" stopColor="var(--color-asphalt-900)" />
        </linearGradient>
        <linearGradient id="dp-steps-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.04" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.96" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="dp-steps-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={ROAD_W} height="132">
          <rect width={ROAD_W} height="132" fill="url(#dp-steps-fade)" />
        </mask>
      </defs>
      <g mask="url(#dp-steps-mask)">
        <rect x="0" y="40" width={ROAD_W} height="80" fill="url(#dp-steps-asphalt)" />
        <path d={`M0 44H${ROAD_W}M0 116H${ROAD_W}`} stroke="var(--color-chalk)" strokeOpacity="0.32" strokeWidth="2" />
        <path
          d={`M0 80H${ROAD_W}`}
          stroke="var(--color-chalk)"
          strokeOpacity="0.3"
          strokeWidth="2.5"
          strokeDasharray="30 30"
        />
        {/* Flaques de lumière sous chaque borne */}
        {[150, 450, 750, 1050].map((x) => (
          <ellipse key={x} cx={x} cy="44" rx="70" ry="10" fill="var(--color-sodium)" fillOpacity="0.06" />
        ))}
        {/* Tracé jaune : le trajet de la dépanneuse, dessiné jusqu'à la dernière borne */}
        <path
          className={`draw ${styles.stepsTrail}`}
          data-steps-trail=""
          pathLength={1}
          d={`M${TRUCK_FROM} ${LANE_Y}H${TRUCK_TO}`}
          fill="none"
          stroke="var(--color-signal-500)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      {/* La dépanneuse, à l'arrivée (état final) ; la scène la déplace */}
      <g data-steps-truck="" transform={`translate(${TRUCK_TO} ${LANE_Y})`}>
        <g transform={`scale(${TRUCK_SCALE})`}>
          <TruckTopGlyph headlights />
        </g>
      </g>
    </svg>
  );
}

export function StepsRoad(): ReactElement {
  return (
    <>
      <div
        className={styles.steps}
        data-scene="steps-road"
        data-from={TRUCK_FROM}
        data-to={TRUCK_TO}
        data-width={ROAD_W}
        data-lane={LANE_Y}
      >
        {/* Ordinateur : la route horizontale, sous la rangée des bornes */}
        <div className={styles.stepsRoadRow} aria-hidden="true">
          <HorizontalRoad />
        </div>

        {/* Mobile : la route verticale, son remplissage et la dépanneuse qui descend */}
        <div className={styles.stepsRail} aria-hidden="true">
          <span className={styles.stepsRailFill} />
          <span className={styles.stepsRailTruck}>
            <svg viewBox="-26 -26 52 104" className={styles.stepsRailTruckSvg}>
              <g transform="rotate(90)">
                <TruckTopGlyph headlights />
              </g>
            </svg>
          </span>
        </div>

        <ol className={styles.stepsList}>
          {STEPS.map((step, index) => (
            <li key={step.title} className={styles.step} data-step={index} style={{ "--i": index } as CSSProperties}>
              <Borne index={index} />
              <div className={styles.stepCopy}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <ChevronRow />
    </>
  );
}
