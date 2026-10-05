/**
 * Horizon de ville en deux couches (docs/09, B.7) : fichiers SVG statiques mis en cache
 * (`public/scenes/skyline-*.svg`, produits par scripts/generate-scene-assets.ts), répétés en
 * `repeat-x` et déplacés en `transform`. Le conteneur donne la hauteur (classe `className`) ;
 * la tuile garde ses proportions. `loop` : la ville défile (lent : loin, rapide : près).
 *
 * `preload` (vrai par défaut pour un horizon qui défile, réservé à la scène d'ouverture, au-dessus
 * de la ligne de flottaison) : la tuile est annoncée dès le `<head>` (`<link rel="preload">`) au lieu
 * d'être découverte après le CSS. Le calque d'horizon est le plus grand élément affiché de l'accueil
 * (LCP) : il ne doit pas arriver en retard. Priorité haute (3 Ko) : en priorité basse, elle attendait
 * derrière les scripts et n'arrivait qu'après 4 s (téléphone, 4G lente), LCP compris.
 */
import type { ReactElement } from "react";
import { preload as preloadResource } from "react-dom";
import { cn } from "@/components/ui/cn";
import styles from "./base.module.css";

type SkylineProps = {
  layer: "far" | "near";
  loop?: "slow" | "fast" | null;
  /** Annonce la tuile dès le `<head>` (défaut : seulement si l'horizon défile). */
  preload?: boolean;
  className?: string;
};

const TILE = { far: "/scenes/skyline-far.svg", near: "/scenes/skyline-near.svg" } as const;

export function Skyline({ layer, loop = null, preload = loop !== null, className }: SkylineProps): ReactElement {
  // Même adresse que le `background-image` de base.module.css : une seule requête.
  if (preload) preloadResource(TILE[layer], { as: "image", fetchPriority: "high" });
  return (
    <div
      aria-hidden="true"
      data-pause-offscreen={loop ? "" : undefined}
      className={cn(styles.skyline, layer === "far" ? styles.far : styles.near, className)}
    >
      <div className={cn(styles.skylineTrack, loop === "slow" && styles.loopSlow, loop === "fast" && styles.loopFast)} />
    </div>
  );
}
