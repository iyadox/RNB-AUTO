"use client";

/**
 * Scènes de l'accueil (docs/09, P22) : freinage de l'ouverture et temps de la carte du récit.
 * Chargées à la demande par le runtime du socle (import dynamique, après l'affichage).
 */
import { useScenes } from "@/components/motion/use-scenes";
import type { SceneLoaders } from "@/components/motion/types";

const SCENES: SceneLoaders = {
  "hero-brake": () => import("./scenes/hero-brake.scene"),
  story: () => import("./scenes/story.scene"),
};

export function HomeScenes(): null {
  useScenes(SCENES);
  return null;
}
