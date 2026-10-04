"use client";

/**
 * Enregistre les scènes d'une page (docs/09, P22). À appeler dans le composant client de la
 * page, avec des chargeurs déclarés au niveau du module (objet stable) :
 *
 *   const SCENES = { "hero-brake": () => import("./scenes/hero-brake.scene") };
 *   export function HomeScenes() { useScenes(SCENES); return null; }
 *
 * Le runtime associe chaque `<div data-scene="hero-brake">` à son chargeur, l'initialise quand
 * elle approche de l'écran et la nettoie à chaque changement de page.
 */
import { useEffect } from "react";
import { registerScenes } from "./runtime/scene-registry";
import type { SceneLoaders } from "./types";

export function useScenes(loaders: SceneLoaders): void {
  useEffect(() => registerScenes(loaders), [loaders]);
}
