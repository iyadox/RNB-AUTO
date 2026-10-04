/**
 * Marquages de transition de /depannage (docs/09, B.4 « séparateurs ») : jamais un filet gris,
 * toujours un objet de la route.
 * - `RoadStuds` : une ligne de tirets et ses plots rétroréfléchissants, qui s'allument de gauche
 *   à droite quand on les atteint (lumière des phares ; `view()` en niveau `full`).
 * - `ChevronRow` : une rangée de chevrons de balisage (la route dévie : voir « Si la réparation
 *   n'est pas possible sur place »), qui glisse doucement au défilement.
 * Décor (`aria-hidden`). Sans JavaScript et en `off` : plots allumés, chevrons immobiles.
 */
import type { ReactElement } from "react";
import styles from "./depannage.module.css";

export function RoadStuds(): ReactElement {
  return (
    <div className={styles.studs} aria-hidden="true">
      <span className={styles.studsOff} />
      <span className={styles.studsOn} />
    </div>
  );
}

export function ChevronRow(): ReactElement {
  return (
    <div className={styles.chevrons} aria-hidden="true">
      <span className={styles.chevronsTrack} />
    </div>
  );
}
