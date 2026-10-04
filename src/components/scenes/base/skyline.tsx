/**
 * Horizon de ville en deux couches (docs/09, B.7) : fichiers SVG statiques mis en cache
 * (`public/scenes/skyline-*.svg`, produits par scripts/generate-scene-assets.ts), répétés en
 * `repeat-x` et déplacés en `transform`. Le conteneur donne la hauteur (classe `className`) ;
 * la tuile garde ses proportions. `loop` : la ville défile (lent : loin, rapide : près).
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./base.module.css";

type SkylineProps = {
  layer: "far" | "near";
  loop?: "slow" | "fast" | null;
  className?: string;
};

export function Skyline({ layer, loop = null, className }: SkylineProps): ReactElement {
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
