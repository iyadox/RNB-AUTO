/**
 * Pages calmes (docs/09, C.6) : qui a droit au halo des phares et au défilement doux (Lenis) ?
 * Logique pure, partagée par le runtime et ses tests. Deux sources :
 * - l'adresse (`CALM_ROUTES` : ni Lenis ni halo ; `NO_HALO_ROUTES` : Lenis seulement) ;
 * - le marqueur posé par la page elle-même (404, erreur : leur adresse est quelconque) :
 *   `data-calm` ou `data-calm="full"` = ni Lenis ni halo ; `data-calm="halo"` = pas de halo.
 */
import { CALM_MARKER, isCalmRoute, isNoHaloRoute } from "@/content/site-map";
import type { MotionLevel } from "../types";

export type CalmMarker = "full" | "halo" | null;

/** Lit le marqueur de page calme dans le document (ou dans `root`). */
export function readCalmMarker(root: Pick<ParentNode, "querySelector">): CalmMarker {
  const el = root.querySelector(`[${CALM_MARKER}]`);
  if (!el) return null;
  return el.getAttribute(CALM_MARKER) === "halo" ? "halo" : "full";
}

/** Effets d'ambiance permis : ordinateur à souris, niveau `full`, hors route ou page calme. */
export function ambientEffects(options: { desktop: boolean; level: MotionLevel; pathname: string; marker: CalmMarker }): {
  halo: boolean;
  lenis: boolean;
} {
  const { desktop, level, pathname, marker } = options;
  const allowed = desktop && level === "full";
  return {
    halo: allowed && !isNoHaloRoute(pathname) && marker === null,
    lenis: allowed && !isCalmRoute(pathname) && marker !== "full",
  };
}
