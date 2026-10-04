/**
 * Registre des scènes de lot (docs/09, P22). Chaque page enregistre ses propres scènes avec
 * `useScenes` : aucun registre partagé à modifier. Le runtime s'abonne et associe chaque
 * `<div data-scene="nom">` au chargeur du même nom.
 */
import type { SceneLoaders } from "../types";

type Loader = SceneLoaders[string];

const loaders = new Map<string, Loader>();
const listeners = new Set<() => void>();
let notifying = false;

function notify() {
  if (notifying) return;
  notifying = true;
  // Regroupe les enregistrements d'un même rendu en une seule notification.
  queueMicrotask(() => {
    notifying = false;
    for (const listener of Array.from(listeners)) listener();
  });
}

/** Enregistre des chargeurs de scènes. Retourne la fonction qui les retire. */
export function registerScenes(entries: SceneLoaders): () => void {
  const added = Object.entries(entries);
  for (const [name, loader] of added) loaders.set(name, loader);
  notify();
  return () => {
    for (const [name, loader] of added) if (loaders.get(name) === loader) loaders.delete(name);
  };
}

/** Prévient `listener` à chaque nouvel enregistrement. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getLoader(name: string): Loader | undefined {
  return loaders.get(name);
}
