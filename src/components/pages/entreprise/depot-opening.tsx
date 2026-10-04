/**
 * Ouverture de /entreprise « Le dépôt, avant le départ » (docs/09, F.6, PK 00).
 *
 * La façade du dépôt la nuit : enseigne losange allumée (elle grésille en s'allumant), rideau
 * métallique qui monte une fois (1,2 s), lumière de l'atelier qui se répand sur le parvis, puis
 * la dépanneuse, garée devant, fait deux appels de phares. Quand la scène sort de l'écran
 * (niveau `full`, CSS seul), la dépanneuse part vers la droite : c'est le départ.
 *
 * Repère : un monde de proportions 5 × 4 ancré en bas, placé en pourcentages. Boucle visible :
 * le gyrophare seulement (en pause hors de l'écran). Sans JavaScript et en `off` : état final
 * (rideau levé, atelier éclairé, phares allumés). Tout est décoratif (`aria-hidden`).
 */
import type { CSSProperties, ReactElement } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { Depot } from "@/components/scenes/base/depot";
import { Skyline } from "@/components/scenes/base/skyline";
import { cn } from "@/components/ui/cn";
import styles from "./entreprise.module.css";

export function DepotOpening(): ReactElement {
  return (
    <div className={styles.openFrame} data-loops-nojs="" aria-hidden="true">
      <div className={styles.openStage} data-inview-once="" data-pause-offscreen="">
        <div className={styles.openCity} />
        <div className={styles.openSkyline} data-parallax="" style={{ "--depth": 0.25 } as CSSProperties}>
          <Skyline layer="far" className={styles.openSkylineInner} />
        </div>
        <div className={styles.openGround} />
        <div className={styles.openRoad} />

        <div className={styles.openSignHalo} />
        <div className={styles.openDepot}>
          <Depot animate="open" className="w-full" />
        </div>
        <div className={styles.openDoorGlow} />
        <div className={styles.openSpill} />

        {/* Reflets mouillés : appliques au sodium et enseigne. */}
        <div className={styles.openWet} style={{ left: "23.2%" }} />
        <div className={styles.openWet} style={{ left: "39.8%" }} />
        <div className={cn(styles.openWet, styles.openWetSign)} style={{ left: "31%" }} />

        <div className={styles.openTruckLane}>
          <div className={styles.openTruckWet} />
          <div className={styles.openTruck}>
            <TowTruck headlights parts id="entreprise-open-truck" />
          </div>
          <div className={styles.openFlare} />
        </div>
      </div>
    </div>
  );
}
