/**
 * Décor de /demande (docs/09, F.8) : une route de nuit en perspective, à 20 % d'opacité, qui file
 * vers l'horizon de la ville. Fixe derrière le parcours (le parcours la découpe : elle ne passe
 * jamais sous le pied de page), statique.
 *
 * - À chaque changement d'étape, les tirets de l'axe avancent d'un cran en 400 ms (`advance` :
 *   le compteur remonte l'élément, ce qui rejoue l'animation ; vers l'arrière au retour).
 * - Pendant le calcul seulement (`[data-computing]` sur la racine du parcours), ils défilent
 *   lentement.
 * - Sur ordinateur, son axe file dans l'allée entre le parcours et la feuille de route : les
 *   tirets ne passent jamais sous un champ ni sous un bouton.
 * - `off`, préférence « moins d'animations » et sans JavaScript : immobile.
 * Décor pur : `aria-hidden`, aucun clic.
 */
import { Skyline } from "@/components/scenes/base/skyline";
import styles from "./request.module.css";

type RequestBackdropProps = {
  /** Compteur de changements d'étape (0 au chargement : aucune avancée). */
  advance: number;
  dir: "forward" | "back";
  /** Ordinateur : la route file entre le parcours et la feuille de route (`gap`) ; centrée sur
   *  l'écran quand le parcours n'a qu'une colonne (« Demande reçue »). */
  align?: "gap" | "center";
};

export function RequestBackdrop({ advance, dir, align = "gap" }: RequestBackdropProps) {
  return (
    <div className={styles.backdrop} data-align={align} aria-hidden="true">
      <div className={styles.backdropGlow} />
      <Skyline layer="far" className={styles.backdropCity} />
      <div className={styles.roadFrame}>
        <div className={styles.roadPlane}>
          <span key={advance} className={styles.roadDashes} data-advance={advance > 0 ? dir : undefined} />
        </div>
      </div>
      <div className={styles.backdropVeil} />
    </div>
  );
}
