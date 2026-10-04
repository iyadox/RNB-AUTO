/**
 * PK 01 · « Roulant, non roulant, accidenté » (docs/09, F.2, P9).
 *
 * - Ordinateur (pointeur fin, avec JavaScript, hors `off`) : la grande scène du plateau reste
 *   collante à droite (`position: sticky`, jamais d'épinglage GSAP) ; les six situations
 *   défilent à gauche, 58 vh chacune (grand numéro qui s'allume, vignette sous un faisceau).
 *   L'aide du runtime pose `data-beat` : la scène change d'état à chaque situation (cales, avant
 *   enfoncé, roue bloquée, barre de hauteur, garage, maison).
 * - Mobile, sans JavaScript et en `off` : rien de collant ; chaque situation a sa vignette. La
 *   grande scène n'est alors pas dans le DOM (`StageVisual`, montée à la demande).
 * Textes repris mot pour mot de l'ancienne page.
 */
import type { CSSProperties, ReactElement } from "react";
import { SituationVignette } from "./situation-art";
import { SITUATIONS, pad } from "./situations";
import { StageVisual } from "./stage-visual";
import styles from "./remorquage.module.css";

/** Typographie française : espace insécable avant « : ; ? ! ». */
const frenchSpacing = (text: string) => text.replace(/\s+([:;?!])/g, "\u00a0$1");

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

      {/* Grande scène du plateau : montée sur ordinateur seulement (`StageVisual`). */}
      <StageVisual />
    </div>
  );
}
