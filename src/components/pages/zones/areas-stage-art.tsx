/**
 * Le plan collant de /zones-d-intervention (docs/09, F.3, P9) : ordinateur à pointeur fin
 * seulement. Module client chargé à la demande par `AreasStageVisual` : ni le HTML, ni la charge
 * RSC, ni le téléphone ne portent ses quelque 330 éléments SVG.
 * Chaque secteur allume sa zone au temps posé par l'aide des scènes collantes (`data-beat`).
 */
import type { ReactElement } from "react";
import { PlanIdf } from "@/components/scenes/kit/plan-idf/plan-idf";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { AREAS } from "./areas";
import { zoneGeometry } from "./zone-geometry";
import { ZoneLayer } from "./zone-layers";
import styles from "./zones.module.css";

/** Rang du secteur (1 à 4) dans la scène collante. */
const orderOf = (zone: string) => AREAS.findIndex((area) => area.zone === zone) + 1;

export function AreasStageArt({ depot }: { depot: PublicSiteInfo["depot"] }): ReactElement {
  const geometry = zoneGeometry(depot);
  return (
    <div className={styles.stagePlanFrame}>
      {/* Surfaces, ondes et trajets SOUS les noms des communes et le losange du dépôt
          (`underlay`) ; points allumés et dépanneuse au-dessus. */}
      <PlanIdf
        depot={depot}
        labels="major"
        underlay={geometry.shapes.map((shape) => (
          <ZoneLayer
            key={shape.zone}
            part="under"
            shape={shape}
            depot={geometry.depot}
            idPrefix="zones-stage"
            order={orderOf(shape.zone)}
          />
        ))}
      >
        {geometry.shapes.map((shape) => (
          <ZoneLayer
            key={shape.zone}
            part="over"
            shape={shape}
            depot={geometry.depot}
            idPrefix="zones-stage"
            order={orderOf(shape.zone)}
          />
        ))}
      </PlanIdf>
      <span className={styles.stageCaption}>Plan schématique</span>
      <div className={styles.stageHud}>
        <span className={styles.stageCurrent}>
          {AREAS.map((area) => (
            <span key={area.zone}>{area.title}</span>
          ))}
        </span>
        <span className={styles.pips}>
          {AREAS.map((area) => (
            <span key={area.zone} />
          ))}
        </span>
      </div>
    </div>
  );
}
