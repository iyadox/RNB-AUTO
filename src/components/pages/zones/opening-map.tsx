/**
 * PK 00 · Ouverture « Vue du ciel » de /zones-d-intervention (docs/09, F.3).
 *
 * Titre, accroche et bouton visibles et immobiles dès la première image (C.1-3). La carte vient
 * APRÈS le texte : en dessous sur mobile (60svh), à droite sur ordinateur (80vh) avec un voile
 * sombre sous le texte. Le Plan RNB est balayé par le gyrophare du dépôt et recule lentement
 * (1,12 → 1, une fois). Son fond est publié en symbole (`zones-plan`), réutilisé par les
 * vignettes des secteurs.
 */
import type { CSSProperties, ReactElement } from "react";
import { ScenePause } from "@/components/motion/scene-pause";
import { CallLink, PrimaryLink } from "@/components/public/actions";
import { Plate } from "@/components/public/page-blocks";
import { PlanIdf } from "@/components/scenes/kit/plan-idf/plan-idf";
import type { PublicSiteInfo } from "@/server/site/public-info";
import styles from "./zones.module.css";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";
/** Identifiant du symbole du fond de carte (vignettes du PK 02). */
export const PLAN_SYMBOL_ID = "zones-plan";
const MAP_ID = "zones-carte";

export function OpeningMap({ info }: { info: PublicSiteInfo }): ReactElement {
  return (
    <section id="ouverture" data-sky="minuit" className={styles.opening}>
      <div className={styles.veil} aria-hidden="true" />
      <div className={CONTAINER}>
        <div className={styles.openingText}>
          <Plate pk="00" pictogram="pin">
            Zones d&apos;intervention
          </Plate>
          <h1 className={styles.title}>
            Depuis Bobigny,{" "}
            <em data-beam="load" className="not-italic">
              toute <span className="whitespace-nowrap">l&apos;Île-de-France.</span>
            </em>
          </h1>
          <p className={styles.lead}>
            {`Notre dépanneuse part de ${info.depotLabel}. Indiquez votre position dans la demande en ligne : la distance réelle et le prix sont calculés immédiatement.`}
          </p>
          <div className={styles.actions}>
            <PrimaryLink href="/demande">Calculer mon prix</PrimaryLink>
            <CallLink phone={info.phone} size="lg" className="max-sm:hidden" />
          </div>
        </div>
      </div>

      <div className={styles.mapStage}>
        <div className={styles.mapParallax} data-parallax="" style={{ "--depth": 0.22 } as CSSProperties}>
          <div className={styles.mapTilt}>
            <div id={MAP_ID} className={styles.mapRecoil}>
              <div className={styles.mapGlow} aria-hidden="true" />
              <PlanIdf depot={info.depot} sweep labels="all" symbolId={PLAN_SYMBOL_ID} />
              <span className={styles.corner} aria-hidden="true" />
              <span className={styles.corner} aria-hidden="true" />
              <span className={styles.corner} aria-hidden="true" />
              <span className={styles.corner} aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className={styles.mapCaption}>
          <span>Plan schématique</span>
          <ScenePause targetId={MAP_ID} />
        </div>
      </div>
      <div className={styles.edgeLine} aria-hidden="true" />
    </section>
  );
}
