/**
 * Niveau de motion (docs/09, C.3) : `full` par défaut, `lite` sur un appareil modeste ou en
 * économie de données, `off` si le visiteur préfère moins d'animations (système ou bouton).
 *
 * La même règle existe deux fois :
 * - `detectMotionLevel`, en TypeScript pur (testé) ;
 * - `MOTION_BOOT_SCRIPT`, script en ligne exécuté avant le premier affichage.
 * Le test `level.test.ts` vérifie qu'elles donnent toujours le même résultat.
 */
import type { MotionLevel } from "./types";

export const MOTION_STORAGE_KEY = "rnb-motion";
/** Événement envoyé sur `window` quand le niveau change (bouton, préférence système). */
export const MOTION_CHANGE_EVENT = "rnb:motion-change";

export type MotionEnv = {
  /** Valeur mémorisée sous `rnb-motion` (« off » quand le visiteur a arrêté les animations). */
  stored: string | null;
  reducedMotion: boolean;
  saveData: boolean;
  /** `navigator.deviceMemory` en Go, null si inconnu. */
  deviceMemory: number | null;
  /** `navigator.hardwareConcurrency`, null si inconnu. */
  cores: number | null;
};

const isLow = (value: number | null) => value !== null && value > 0 && value <= 2;

export function detectMotionLevel(env: MotionEnv): MotionLevel {
  if (env.reducedMotion || env.stored === "off") return "off";
  if (env.saveData || isLow(env.deviceMemory) || isLow(env.cores)) return "lite";
  return "full";
}

/**
 * Script d'en-tête (≈ 400 octets) : ajoute `html.js`, puis pose `data-motion`.
 * Il ne touche à rien d'autre et ne peut pas échouer (stockage lu dans un try/catch).
 */
export const MOTION_BOOT_SCRIPT =
  `(function(){var d=document.documentElement,n=navigator,c=n.connection,m=n.deviceMemory,h=n.hardwareConcurrency,s=null,l="full";` +
  `d.classList.add("js");try{s=localStorage.getItem("${MOTION_STORAGE_KEY}")}catch(e){}` +
  `if(s==="off"||window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)l="off";` +
  `else if(c&&c.saveData||m>0&&m<=2||h>0&&h<=2)l="lite";` +
  `d.setAttribute("data-motion",l)})()`;

type NavigatorExtras = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** Lit l'environnement du navigateur (à n'appeler que côté client). */
export function readMotionEnv(): MotionEnv {
  const nav = navigator as NavigatorExtras;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
  } catch {
    stored = null;
  }
  const number = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);
  return {
    stored,
    reducedMotion: typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: Boolean(nav.connection?.saveData),
    deviceMemory: number(nav.deviceMemory),
    cores: number(nav.hardwareConcurrency),
  };
}

/** Niveau actuellement posé sur <html> (null côté serveur ou si le script d'en-tête manque). */
export function currentMotionLevel(): MotionLevel | null {
  if (typeof document === "undefined") return null;
  const value = document.documentElement.getAttribute("data-motion");
  return value === "full" || value === "lite" || value === "off" ? value : null;
}

/** Recalcule le niveau, le pose sur <html> et prévient le runtime et les composants. */
export function applyMotionLevel(): MotionLevel {
  const level = detectMotionLevel(readMotionEnv());
  const html = document.documentElement;
  html.classList.add("js");
  if (html.getAttribute("data-motion") !== level) html.setAttribute("data-motion", level);
  window.dispatchEvent(new CustomEvent(MOTION_CHANGE_EVENT, { detail: { level } }));
  return level;
}

/** Bouton « Arrêter les animations » : mémorise le choix, puis applique le nouveau niveau. */
export function setMotionStopped(stopped: boolean): MotionLevel {
  try {
    if (stopped) window.localStorage.setItem(MOTION_STORAGE_KEY, "off");
    else window.localStorage.removeItem(MOTION_STORAGE_KEY);
  } catch {
    // Stockage indisponible (navigation privée) : le choix vaut pour cette visite seulement.
    if (stopped) {
      document.documentElement.setAttribute("data-motion", "off");
      window.dispatchEvent(new CustomEvent(MOTION_CHANGE_EVENT, { detail: { level: "off" } }));
      return "off";
    }
  }
  return applyMotionLevel();
}

/** Abonnement au niveau de motion (pour `useSyncExternalStore`). */
export function subscribeMotionLevel(onChange: () => void): () => void {
  window.addEventListener(MOTION_CHANGE_EVENT, onChange);
  return () => window.removeEventListener(MOTION_CHANGE_EVENT, onChange);
}
