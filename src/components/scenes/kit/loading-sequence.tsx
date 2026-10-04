/**
 * Séquence de chargement (docs/09, F.1 et F.2) : dépanneuse de profil, plateau incliné, voiture
 * au pied de la rampe ; le câble du treuil se tend, la voiture monte, le plateau revient à plat,
 * les phares s'allument.
 *
 * - `mode="scrub"` : liée au défilement (ordinateur, niveau `full`), 60 % de la hauteur de
 *   l'écran à partir de son entrée ; ailleurs, jouée une fois.
 * - `mode="once"` : jouée une fois (2,6 s), 400 ms après son arrivée dans l'écran.
 * - Module de scène : `loading-sequence.scene.ts`, à enregistrer par la page :
 *     const SCENES = { "loading-sequence": () => import("@/components/scenes/kit/loading-sequence.scene") };
 * - Sans JavaScript, en `off` et si la scène échoue : état final (voiture chargée, plateau à
 *   plat, câble court, phares allumés).
 * Décoratif (`aria-hidden`). La hauteur vient de la largeur (rapport 640 × 176).
 */
import type { ReactElement } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { cn } from "@/components/ui/cn";
import styles from "./kit.module.css";

type LoadingSequenceProps = {
  /** Identifiant unique dans la page (préfixe des identifiants SVG de la dépanneuse). */
  id: string;
  mode?: "scrub" | "once";
  /** Bornes ScrollTrigger du mode `scrub` (défaut : « clamp(top 85%) » → « +=60% »). */
  scrubStart?: string;
  scrubEnd?: string;
  className?: string;
};

export function LoadingSequence({ id, mode = "once", scrubStart, scrubEnd, className }: LoadingSequenceProps): ReactElement {
  return (
    <div
      id={id}
      aria-hidden="true"
      data-scene="loading-sequence"
      data-mode={mode}
      data-scrub-start={scrubStart}
      data-scrub-end={scrubEnd}
      data-pause-offscreen=""
      className={cn(styles.loading, className)}
    >
      {/* Chaussée mouillée et reflets des phares */}
      <div className={styles.loadingGround} />
      <div className={styles.loadingBeamPool} data-loading-pool="" />
      <div className={styles.loadingTruck}>
        <TowTruck id={`${id}-truck`} loaded cable parts headlights beacon />
      </div>
    </div>
  );
}
