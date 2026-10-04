"use client";
/**
 * Retire après l'hydratation un bloc que le CSS masque de toute façon à cette largeur (budget de
 * nœuds de l'accueil, G.2). Rendu serveur, hydratation et sans JavaScript : le bloc est rendu,
 * le CSS décide. Suit les changements de largeur. Jamais pour un contenu visible à la largeur
 * courante : la requête doit être exactement celle qui affiche le bloc en CSS (même unité : `rem`
 * pour une classe Tailwind `sm:`/`md:`/`lg:`, `px` pour une règle des modules de l'accueil).
 */
import { useMemo, useSyncExternalStore, type ReactNode } from "react";

export function MediaGate({ query, children }: { query: string; children: ReactNode }): ReactNode {
  const subscribe = useMemo(
    () => (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const matches = useSyncExternalStore<boolean | null>(
    subscribe,
    () => window.matchMedia(query).matches,
    () => null,
  );
  return matches === false ? null : children;
}
