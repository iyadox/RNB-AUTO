"use client";
/**
 * Vrai quand la requête média correspond. Rendu serveur et hydratation : `false` (rien n'est
 * monté avant que le navigateur ait répondu). Suit les changements (rotation, fenêtre redimensionnée).
 * Réservé aux blocs purement décoratifs que le CSS n'affiche qu'à cette condition.
 */
import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
