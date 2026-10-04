/**
 * E.4 · « De la panne à la solution, sans stress. » (docs/09, PK 02, titre existant).
 *
 * Les quatre étapes existantes, mot pour mot (la ville du dépôt vient des réglages).
 * - Ordinateur : scène collante (P9) ; la carte reste à droite (`position: sticky`, jamais
 *   d'épinglage GSAP) et se redresse en entrant (plan grue, P8) ; les textes défilent à gauche.
 *   Temps : l'épingle tombe, l'étiquette du prix se déplie, l'aller se trace avec la dépanneuse,
 *   puis le transport en jaune, le retour, et la légende s'imprime (scène « story »).
 * - Mobile : RIEN de collant. Chaque étape a sa mini-carte 16:10, puis la borne, le titre et
 *   le texte. Le tronçon de l'étape se dessine une fois à l'entrée.
 * - Interrupteur « Remorquage » / « Réparé sur place » : deux boutons radio, CSS `:has`,
 *   fonctionne sans JavaScript.
 * Sans JavaScript et en `off` : tout est tracé, la dépanneuse est au drapeau.
 */
import type { PublicSiteInfo } from "@/server/site/public-info";
import { Plate } from "@/components/public/page-blocks";
import { MiniMap, StoryMap } from "./story-map";
import styles from "./home.module.css";

function steps(city: string | null) {
  return [
    {
      title: "Vous nous dites où vous êtes",
      text: "Un geste suffit : votre téléphone nous donne votre position. Vous pouvez aussi taper l'adresse.",
    },
    {
      title: "Vous voyez le prix tout de suite",
      text: "Votre véhicule, le problème, la destination : trois réponses et l'estimation s'affiche. Pas de mauvaise surprise.",
    },
    {
      title: "La dépanneuse arrive",
      text: city
        ? `Nous vous rappelons pour confirmer, puis la dépanneuse part de ${city} vers vous.`
        : "Nous vous rappelons pour confirmer, puis la dépanneuse part vers vous.",
    },
    {
      title: "Votre véhicule part où vous voulez",
      text: "Garage, domicile ou autre adresse : votre véhicule est chargé avec soin et transporté.",
    },
  ];
}

/** Typographie française : espace insécable avant « : ». */
const nbsp = (text: string) => text.replace(/ :/g, " :");

export function Story({ info }: { info: PublicSiteInfo }) {
  return (
    <section
      id="comment-ca-marche"
      data-sky="nuit"
      data-stage=""
      data-tilt-scope=""
      data-scene="story"
      className={styles.story}
    >
      <div className={styles.container}>
        <div data-reveal>
          <Plate pk="02">Comment ça marche</Plate>
        </div>
        <h2 data-split className={`${styles.sectionTitle} mt-4 max-w-[13em]`}>
          De la panne à la solution, sans stress.
        </h2>

        <div className={styles.stageGrid}>
          <div className={styles.visual} data-stage-visual="">
            <StoryMap depot={info.depot} />
          </div>

          <ol className={styles.steps}>
            {steps(info.depot.city).map((step, index) => (
              <li key={step.title} data-stage-step="" className={styles.step}>
                <div className="w-full">
                  {index === 0 ? null : <MiniMap step={(index + 1) as 2 | 3 | 4} />}
                  <div className={styles.stepBody}>
                    <span className={styles.borne} aria-hidden="true">
                      <span>{index + 1}</span>
                    </span>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepText}>{nbsp(step.text)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className={styles.storyFooter}>
            <p className={styles.legend}>
              <strong>
                <span aria-hidden="true">① </span>Aller · <span aria-hidden="true">② </span>Transport ·{" "}
                <span aria-hidden="true">③ </span>Retour
              </strong>
              {nbsp(" : les trois trajets de la dépanneuse sont pris en compte dans le prix.")}
            </p>
            <fieldset className={styles.toggle}>
              <legend className="sr-only">Trajets de la dépanneuse</legend>
              <label>
                <input type="radio" name="story-mode" value="tow" defaultChecked />
                Remorquage
              </label>
              <label>
                <input type="radio" name="story-mode" value="on_site" />
                Réparé sur place
              </label>
            </fieldset>
            <p className={`${styles.siteNote} ${styles.siteOnly}`}>
              {nbsp("Réparé sur place : pas de transport, seulement l'aller et le retour de la dépanneuse.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
