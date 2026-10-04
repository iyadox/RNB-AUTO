/**
 * PK 01 · « Roulant, non roulant, accidenté » (docs/09, F.2, P9).
 *
 * - Ordinateur (pointeur fin, avec JavaScript, hors `off`) : la grande scène du plateau reste
 *   collante à droite (`position: sticky`, jamais d'épinglage GSAP) ; les six situations
 *   défilent à gauche, 80 vh chacune. L'aide du runtime pose `data-beat` : la scène change
 *   d'état à chaque situation (cales, avant enfoncé, roue bloquée, barre de hauteur, garage,
 *   maison).
 * - Mobile, sans JavaScript et en `off` : rien de collant ; chaque situation a sa vignette.
 * Textes repris mot pour mot de l'ancienne page.
 */
import type { CSSProperties, ReactElement } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { Skyline } from "@/components/scenes/base/skyline";
import { CarSide } from "@/components/scenes/kit/car-side";
import { SituationVignette, StageBackdrop, StageOverlays, type SituationKind } from "./situation-art";
import styles from "./remorquage.module.css";

const SITUATIONS: { kind: SituationKind; title: string; text: string }[] = [
  { kind: "non-roulant", title: "Véhicule non roulant", text: "Chargement au treuil sur le plateau, sans forcer la mécanique." },
  { kind: "accident", title: "Après un accident", text: "Véhicule endommagé ou impossible à déplacer : nous adaptons le chargement." },
  { kind: "roues-bloquees", title: "Roues bloquées", text: "Frein bloqué, boîte automatique, roues abîmées : dites-le nous à la demande." },
  { kind: "parking", title: "Parking et sous-sol", text: "Indiquez s'il s'agit d'un parking : la hauteur et l'accès comptent." },
  { kind: "garage", title: "Vers votre garage", text: "Nous déposons le véhicule chez le garagiste de votre choix, aux horaires d'ouverture." },
  { kind: "domicile", title: "Chez vous", text: "Votre véhicule peut aussi être déposé à votre domicile ou à toute adresse." },
];

/** Typographie française : espace insécable avant « : ; ? ! ». */
const frenchSpacing = (text: string) => text.replace(/\s+([:;?!])/g, " $1");
const pad = (n: number) => String(n).padStart(2, "0");

export function SituationsStage(): ReactElement {
  return (
    <div data-stage="" className={styles.stage}>
      <ol className={styles.steps}>
        {SITUATIONS.map((situation, index) => (
          <li key={situation.kind} data-stage-step="" className={styles.step} style={{ "--i": index } as CSSProperties}>
            <div className={styles.stepInner} data-reveal="" data-reveal-step={String((index % 2) + 1)}>
              <span className={styles.stepVignette} aria-hidden="true">
                <SituationVignette kind={situation.kind} />
              </span>
              <div>
                <span className={styles.stepNumber} aria-hidden="true">
                  {pad(index + 1)}
                </span>
                <h3 className={styles.stepTitle}>{situation.title}</h3>
                <p className={styles.stepText}>{frenchSpacing(situation.text)}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div data-stage-visual="" className={styles.stageVisual} aria-hidden="true">
        <StageArt />
      </div>
    </div>
  );
}

/** La scène du plateau : décor, dépanneuse, voiture du client, marques de chaque situation. */
function StageArt(): ReactElement {
  return (
    <div className={styles.art} data-pause-offscreen="">
      <div className={styles.artNumerals}>
        {SITUATIONS.map((situation, index) => (
          <span key={situation.kind} data-show={String(index + 1)}>
            {pad(index + 1)}
          </span>
        ))}
      </div>
      <Skyline layer="far" className={styles.artSkyline} />
      <div className={`${styles.artLayer} ${styles.artBackdrop}`}>
        <StageBackdrop />
      </div>

      {/* Temps 1 à 4 : plateau incliné, câble du treuil tendu vers la voiture au pied de la rampe */}
      <div className={styles.artTruckLoading} data-show="1 2 3 4">
        <TowTruck id="rq-stage-load" bed="tilted" cable beacon />
      </div>
      <div className={styles.artCar} data-show="1 3 4">
        <CarSide id="rq-stage-car" />
      </div>
      <div className={styles.artCar} data-show="2">
        <CarSide id="rq-stage-car-hz" hazards />
      </div>
      {/* Temps 5 et 6 : voiture chargée, la dépanneuse arrive devant la destination */}
      <div className={styles.artTruckDeliver} data-show="5 6">
        <TowTruck id="rq-stage-deliver" loaded headlights beacon />
      </div>

      <div className={styles.artLayer}>
        <StageOverlays />
      </div>

      <span className={styles.artCorner} />
      <span className={styles.artCorner} />
      <span className={styles.artCorner} />
      <span className={styles.artCorner} />
      <div className={styles.artHud}>
        <div className={styles.artPips}>
          {SITUATIONS.map((situation) => (
            <span key={situation.kind} />
          ))}
        </div>
        <p className={styles.artCaption}>
          {SITUATIONS.map((situation, index) => (
            <span key={situation.kind} data-show={String(index + 1)}>
              {pad(index + 1)} · {situation.title}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
