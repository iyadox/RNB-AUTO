/**
 * P17 · Texte peint sur la chaussée (docs/09, C.5), avec la route qui le porte.
 *
 * Une vraie route en perspective (un plan 3D en CSS, aucune image) : bitume, lignes de rive,
 * tirets centraux et, si `text` est donné, des lettres peintes très étirées et usées. Au niveau
 * `full`, la caméra « roule » : les lettres et les tirets avancent avec le défilement
 * (`animation-timeline: view()`). Ailleurs : figé. Une seule couche, `aria-hidden` : le vrai
 * titre est ailleurs dans la page.
 *
 * Le conteneur donne la hauteur (classe `className`) ; la route remplit sa largeur et file vers
 * le haut du cadre, où se trouve l'horizon. Tailles en unités du conteneur : même cadrage à
 * toutes les largeurs.
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./blocks.module.css";

export function GroundText({ text = null, className }: { text?: string | null; className?: string }): ReactElement {
  return (
    <div className={cn(styles.groundWrap, className)} aria-hidden="true">
      <div className={cn("ground-frame", styles.groundFrame)}>
        <div className={styles.groundPlane}>
          <span className={styles.groundDash} />
          {text ? (
            <span data-ground className={styles.groundText}>
              {text}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
