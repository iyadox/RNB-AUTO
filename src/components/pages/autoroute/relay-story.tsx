/**
 * /panne-autoroute, PK 01 « Le dépanneur agréé, puis RNB AUTO » (docs/09, F.4).
 *
 * Le relais d'autoroute vu de dessus (`HighwayRelay`, tracé une fois à l'entrée, sans GSAP),
 * puis les trois plaques (textes existants). Sur ordinateur, chaque plaque est suspendue sous
 * l'endroit du schéma qu'elle explique (voie, sortie, route ordinaire) et elles descendent comme
 * la bretelle. Bleu autoroute pour les deux premières, jamais pour RNB AUTO.
 */
import type { ReactElement } from "react";
import { HighwayRelay } from "@/components/scenes/kit/highway-relay";
import { InfoPlaque } from "@/components/scenes/kit/info-plaque";
import { Plate } from "@/components/public/page-blocks";
import type { IconName } from "@/components/ui/icon";
import styles from "./autoroute.module.css";

const STEPS: { icon: IconName; title: string; text: string; tone: "motorway" | "night" }[] = [
  {
    icon: "road",
    title: "Sur l'autoroute",
    text: "Seul le dépanneur agréé pour ce secteur peut intervenir sur la voie. Le tarif est fixé par la réglementation.",
    tone: "motorway",
  },
  {
    icon: "flag",
    title: "À la sortie",
    text: "Il sort votre véhicule de l'autoroute et le dépose à son dépôt ou à un point hors de la zone réglementée.",
    tone: "motorway",
  },
  {
    icon: "truck",
    title: "RNB AUTO prend le relais",
    text: "Nous récupérons votre véhicule à cet endroit et l'emmenons au garage, chez vous ou à l'adresse de votre choix.",
    tone: "night",
  },
];

export function RelaySection(): ReactElement {
  return (
    <section id="qui-intervient" data-sky="bleue" className={styles.relaySection}>
      <div className={styles.relayHead}>
        <Plate pk="01">Qui intervient&nbsp;?</Plate>
        <h2 className={styles.sectionTitle}>
          Le dépanneur agréé, puis <em>RNB AUTO</em>
        </h2>
      </div>
      <RelayStory />
    </section>
  );
}

function RelayStory(): ReactElement {
  return (
    <div className={styles.relayStory}>
      <div className={styles.relayFrame}>
        <HighwayRelay draw="view" captions={false} />
      </div>
      <ol className={styles.relaySteps}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.relayStep}>
            <span className={styles.relayHanger} aria-hidden="true" />
            <InfoPlaque number={index + 1} pictogram={step.icon} title={step.title} tone={step.tone}>
              <p>{step.text}</p>
            </InfoPlaque>
          </li>
        ))}
      </ol>
    </div>
  );
}
