"use client";
/**
 * Emplacement de la grande scène collante de /remorquage (P9) : elle n'est montée que sur un
 * ordinateur à pointeur fin, la seule configuration où le CSS l'affiche, et son module n'est
 * téléchargé qu'à ce moment-là (`next/dynamic`, sans rendu serveur). Téléphone, tablette tactile
 * et sans JavaScript : rien dans le DOM, chaque situation garde sa vignette.
 * La scène occupe sa propre colonne de grille (colonne 2, ligne 1) : aucun décalage au montage.
 */
import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import { useMediaQuery } from "@/components/pages/use-media-query";
import styles from "./remorquage.module.css";

const StageArt = dynamic(() => import("./stage-art").then((module) => module.StageArt), { ssr: false });

/** Même requête que le CSS de `.stageVisual` (remorquage.module.css). */
const DESKTOP = "(min-width: 1024px) and (pointer: fine)";

export function StageVisual(): ReactElement | null {
  if (!useMediaQuery(DESKTOP)) return null;
  return (
    <div data-stage-visual="" className={styles.stageVisual} aria-hidden="true">
      <StageArt />
    </div>
  );
}
