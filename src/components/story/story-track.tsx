/**
 * Fil conducteur de l'accueil, « de la commande à l'arrivée » : décor animé au défilement,
 * derrière les sections de l'accueil.
 *
 * `StoryTrack` enveloppe les sections qui portent l'histoire. Il sert de piste : le décor
 * (`StoryBackdrop`) y est collant (`position: sticky`, plein écran, sous le contenu) et sa
 * progression va de 0 (haut de la piste en haut de l'écran) à 1 (bas de la piste en bas de
 * l'écran). Le décor entre et sort donc avec la piste, sans couture ni épinglage GSAP.
 *
 * Rendu serveur : un simple `div` ; le décor n'est monté qu'au premier défilement (aucun coût
 * au premier affichage). Sans JavaScript : les sections, sans décor.
 */
import type { ReactElement, ReactNode } from "react";
import { StoryBackdrop } from "./story-backdrop";
import styles from "./story-frame.module.css";

export function StoryTrack({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className={styles.track} data-story-track="">
      <StoryBackdrop />
      {children}
    </div>
  );
}
