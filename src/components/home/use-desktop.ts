"use client";
/**
 * Largeur d'écran de l'accueil (1 024 px, `lg`) pour retirer après l'hydratation ce que le CSS
 * masque de toute façon (budget de nœuds, G.2) : mini-cartes du récit sur ordinateur, calques
 * de la grande carte sur téléphone. Rendu serveur et hydratation : `null` (tout est rendu, le
 * CSS choisit ; sans JavaScript rien ne change). Suit les changements de largeur.
 */
import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px)";

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const snapshot = () => window.matchMedia(QUERY).matches;
const serverSnapshot = () => null;

/** `true` sur ordinateur, `false` sur téléphone et tablette, `null` au rendu serveur. */
export function useDesktop(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, snapshot, serverSnapshot);
}
