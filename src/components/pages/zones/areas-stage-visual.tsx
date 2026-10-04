"use client";
/**
 * Emplacement du plan collant de /zones-d-intervention (P9) : monté seulement sur un ordinateur à
 * pointeur fin, la seule configuration où le CSS l'affiche ; son module n'est téléchargé qu'à ce
 * moment-là (`next/dynamic`, sans rendu serveur). Téléphone, tablette tactile et sans JavaScript :
 * rien dans le DOM, chaque secteur garde sa vignette d'anneau.
 * Le plan occupe sa propre colonne de grille : aucun décalage au montage.
 */
import dynamic from "next/dynamic";
import type { ReactElement } from "react";
import { useMediaQuery } from "@/components/pages/use-media-query";
import type { PublicSiteInfo } from "@/server/site/public-info";
import styles from "./zones.module.css";

const AreasStageArt = dynamic(() => import("./areas-stage-art").then((module) => module.AreasStageArt), { ssr: false });

/** Même requête que le CSS de `.stageVisual` (zones.module.css). */
const DESKTOP = "(min-width: 1024px) and (pointer: fine)";

export function AreasStageVisual({ depot }: { depot: PublicSiteInfo["depot"] }): ReactElement | null {
  if (!useMediaQuery(DESKTOP)) return null;
  return (
    <div data-stage-visual="" className={styles.stageVisual} aria-hidden="true">
      <AreasStageArt depot={depot} />
    </div>
  );
}
