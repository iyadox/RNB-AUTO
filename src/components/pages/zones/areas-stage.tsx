/**
 * PK 02 · « Où intervenons-nous ? » (docs/09, F.3, P9).
 *
 * - Ordinateur (avec JavaScript, hors `off`) : le Plan RNB reste collant à droite
 *   (`position: sticky`, jamais d'épinglage) ; les quatre secteurs défilent à gauche, 80 vh
 *   chacun. L'aide du runtime pose `data-beat` : chaque secteur allume sa zone (halo autour du
 *   dépôt, anneau intérieur, moyen, extérieur), trace un trajet depuis le dépôt et y pose la
 *   dépanneuse ; les zones déjà parcourues restent en veilleuse.
 * - Mobile, sans JavaScript et en `off` : rien de collant ; chaque secteur a sa vignette
 *   d'anneau (`<use>` du symbole du plan de l'ouverture).
 * Textes et communes repris mot pour mot de l'ancienne page.
 */
import type { CSSProperties, ReactElement } from "react";
import { PlanIdf } from "@/components/scenes/kit/plan-idf/plan-idf";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { AREAS, placeSlug } from "./areas";
import { PLAN_SYMBOL_ID } from "./opening-map";
import { zoneGeometry } from "./zone-geometry";
import { DepotMark, ZoneLayer } from "./zone-layers";
import { ZoneRings } from "./zone-rings";
import styles from "./zones.module.css";

const pad = (n: number) => String(n).padStart(2, "0");
/** Rang du secteur (1 à 4) dans la scène collante. */
const orderOf = (zone: string) => AREAS.findIndex((area) => area.zone === zone) + 1;

export function AreasStage({ depot }: { depot: PublicSiteInfo["depot"] }): ReactElement {
  const geometry = zoneGeometry(depot);
  return (
    <div data-stage="" className={styles.stage}>
      <ol className={styles.areaList}>
        {AREAS.map((area, index) => {
          const shape = geometry.shapes.find((item) => item.zone === area.zone)!;
          return (
            <li key={area.zone} id={`secteur-${area.zone}`} data-stage-step="" className={styles.areaItem}>
              <div className={styles.plaque} data-reveal="">
                <div className={styles.plaqueHead}>
                  <svg viewBox={shape.viewBox} className={styles.vignette} aria-hidden="true">
                    <use href={`#${PLAN_SYMBOL_ID}`} width="600" height="600" />
                    <ZoneLayer shape={shape} depot={geometry.depot} idPrefix="zones-vig" truck={false} />
                    <DepotMark depot={geometry.depot} scale={area.zone === "grande-couronne" ? 1.6 : 1} />
                  </svg>
                  <div>
                    <span className={styles.areaMeta} aria-hidden="true">
                      <ZoneRings active={area.zone} className={styles.areaRings} />
                      <span className={styles.areaNumber}>
                        {pad(index + 1)} / {pad(AREAS.length)}
                      </span>
                    </span>
                    <h3 className={styles.areaTitle}>{area.title}</h3>
                    <p className={styles.areaText}>{area.text}</p>
                  </div>
                </div>
                <ul className={styles.chips} data-inview-once="">
                  {area.places.map((place, i) => (
                    <li key={place} data-place={placeSlug(place)} className={styles.chip} style={{ "--i": i } as CSSProperties}>
                      {place}
                    </li>
                  ))}
                  {area.more ? (
                    <li
                      data-place="paris"
                      className={`${styles.chip} ${styles.chipMore}`}
                      style={{ "--i": area.places.length } as CSSProperties}
                    >
                      {area.more}
                    </li>
                  ) : null}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <div data-stage-visual="" className={styles.stageVisual} aria-hidden="true">
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
      </div>
    </div>
  );
}
