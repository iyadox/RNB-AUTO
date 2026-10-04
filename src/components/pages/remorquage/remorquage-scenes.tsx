"use client";

/**
 * Scènes de /remorquage (docs/09, P22) : la séquence de chargement de l'ouverture (module du kit).
 * Les chargeurs sont déclarés au niveau du module (objet stable).
 */
import { useScenes } from "@/components/motion/use-scenes";
import type { SceneLoaders } from "@/components/motion/types";

const SCENES: SceneLoaders = {
  "loading-sequence": () => import("@/components/scenes/kit/loading-sequence.scene"),
};

export function RemorquageScenes(): null {
  useScenes(SCENES);
  return null;
}
