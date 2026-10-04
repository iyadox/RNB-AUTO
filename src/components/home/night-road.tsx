/**
 * La scène de nuit de l'ouverture (docs/09, E.1), décorative (`aria-hidden`).
 *
 * Ville au loin et ville proche (fichiers SVG statiques qui défilent), lampadaires au sodium et
 * leurs reflets, route mouillée et ses tirets, dépanneuse qui entre phares allumés (gyrophare,
 * reflets au sol), et la voiture du client arrêtée sur l'accotement, feux de détresse allumés.
 *
 * - Sans JavaScript : tout tourne en CSS (sans freinage) ; `data-loops-nojs` laisse tourner les
 *   boucles du kit (feux de détresse, gyrophare, roues), qui ailleurs attendent le JavaScript.
 * - Scène « hero-brake » (défilement) : les boucles ralentissent jusqu'à l'arrêt, la dépanneuse
 *   avance et s'arrête juste derrière la voiture, le nez plonge, les feux stop s'allument. Il ne
 *   reste que les feux de détresse et le gyrophare, qui se répondent.
 * - `off` : image fixe, dépanneuse arrêtée derrière la voiture (CSS).
 *
 * Légèreté (C.1-7) : aucune boucle ne redessine la scène. Les tirets glissent en `transform`
 * (calque plus large de 120 px), et les lumières qui clignotent (gyrophare, feux de détresse)
 * sont des calques HTML en dégradé radial, posés en % du cadre du véhicule, dont seule
 * l'opacité varie : les dessins SVG restent immobiles et ne sont jamais repeints. Sur
 * téléphone, roues et suspension s'arrêtent à la fin de l'arrivée (CSS).
 */
import { TowTruck } from "@/components/brand/tow-truck";
import { Skyline } from "@/components/scenes/base/skyline";
import { StreetLamps } from "@/components/scenes/base/street-lamps";
import { CarSide } from "@/components/scenes/kit/car-side";
import type { ReactNode } from "react";
import styles from "./home.module.css";

export const SCENE_ID = "scene-ouverture";

export function NightRoad({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.scene}>
      <div
        id={SCENE_ID}
        data-scene="hero-brake"
        data-pause-offscreen=""
        data-loops-nojs=""
        className={styles.sceneDecor}
        aria-hidden="true"
      >
        <Skyline layer="far" loop="slow" className={styles.skyFar} />
        <Skyline layer="near" loop="fast" className={styles.skyNear} />
        {/* Les lampadaires se tiennent au bord de la route (30 % du bas de la scène). */}
        <StreetLamps count={3} loop className={styles.lamps} />
        <div className={styles.road}>
          <div className={styles.roadDash} />
          <div className={styles.roadDashReflect} />
        </div>

        <div data-truck-rig className={styles.truckRig}>
          <div className="animate-truck-in">
            <span className={`${styles.beaconHalo} animate-beacon-flash`} />
            <span className={styles.brakeGlow} />
            <span className={`${styles.wet} ${styles.wetBrake}`} />
            <span
              className={`${styles.wet} ${styles.wetBeacon} animate-beacon-flash`}
            />
            <span className={`${styles.wet} ${styles.wetHead}`} />
            {/* Gyrophare : les deux feux alternent (le second décalé de 0,6 s). */}
            <span className={`${styles.beaconLens} animate-beacon-flash`} />
            <span className={`${styles.beaconLens} ${styles.beaconLensAlt} animate-beacon-flash`} />
            <TowTruck moving headlights beacon={false} id="hero-truck" />
          </div>
        </div>

        <div className={styles.car}>
          <CarSide id="hero-car" />
          {/* Feux de détresse (clignotants, halos et reflets au sol) : un seul calque, 1 Hz. */}
          <span className={`${styles.carHazards} hazard`} />
        </div>
      </div>
      {children}
    </div>
  );
}
