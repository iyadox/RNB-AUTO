"use client";

/**
 * Scènes de /depannage (docs/09, P22) : la route des étapes (module de la page) et la séquence
 * de chargement de « Si la réparation n'est pas possible sur place » (module du kit).
 * Les chargeurs sont déclarés au niveau du module (objet stable).
 */
import { useScenes } from "@/components/motion/use-scenes";
import type { SceneLoaders } from "@/components/motion/types";

const SCENES: SceneLoaders = {
  "steps-road": () => import("./steps-road.scene"),
  "loading-sequence": () => import("@/components/scenes/kit/loading-sequence.scene"),
};

export function DepannageScenes(): null {
  useScenes(SCENES);
  return null;
}
