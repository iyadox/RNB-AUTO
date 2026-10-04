"use client";

/**
 * Choix « Pause » du visiteur pour une scène ou un panneau qui tourne en boucle (P20, WCAG 2.2.2),
 * mémorisé dans le navigateur (`localStorage`, une clé par scène) : après un rechargement ou un
 * retour sur la page, la boucle reste arrêtée (critère I : boutons « fonctionnels et mémorisés »).
 * Stockage bloqué (navigation privée, réglages) : le choix vaut pour la visite en cours.
 * Rendu serveur et hydratation : « en marche », puis le choix mémorisé (aucune erreur d'hydratation).
 */
import { useCallback, useSyncExternalStore } from "react";

const STORAGE_PREFIX = "rnb-scene-pause:";
/** Choix de la visite en cours, quand le stockage du navigateur est indisponible. */
const memory = new Map<string, boolean>();
const listeners = new Set<() => void>();

function readPaused(key: string): boolean {
  const remembered = memory.get(key);
  if (remembered !== undefined) return remembered;
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function writePaused(key: string, paused: boolean): void {
  memory.set(key, paused);
  try {
    if (paused) window.localStorage.setItem(STORAGE_PREFIX + key, "1");
    else window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Stockage indisponible : le choix reste en mémoire pour la visite.
  }
  for (const listener of Array.from(listeners)) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Choix fait dans un autre onglet : la scène suit.
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(STORAGE_PREFIX)) {
      memory.clear();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** `[enPause, changer]` pour la clé donnée (identifiant de la scène, nom du panneau). */
export function usePauseChoice(key: string): [boolean, (paused: boolean) => void] {
  const paused = useSyncExternalStore(
    subscribe,
    () => readPaused(key),
    () => false,
  );
  const set = useCallback((next: boolean) => writePaused(key, next), [key]);
  return [paused, set];
}
