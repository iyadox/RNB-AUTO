"use client";

/**
 * Scènes de /questions-frequentes (docs/09, P22) : la dépanneuse qui parcourt la route en « ? ».
 * Chargeurs déclarés au niveau du module (objet stable).
 */
import { useScenes } from "@/components/motion/use-scenes";
import type { SceneLoaders } from "@/components/motion/types";

const SCENES: SceneLoaders = {
  "question-road": () => import("./question-road.scene"),
};

export function FaqScenes(): null {
  useScenes(SCENES);
  return null;
}
