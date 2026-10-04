/**
 * Défilement doux (Lenis) : ordinateur, niveau `full`, hors routes et pages calmes (docs/09, C.4).
 * Seul endroit du site qui crée un Lenis (une instance à la fois, recréée à chaque page).
 * Import dynamique ; branché sur ScrollTrigger quand GSAP est chargé. Il s'arrête quand le
 * menu est ouvert. Quand un champ a le focus, il cède la molette au défilement natif (au lieu de
 * s'arrêter : un Lenis arrêté bloque la molette et fige toute la page). Retourne la fonction
 * qui le détruit.
 */
import type { GsapKit } from "../types";

const FIELD = "input, textarea, select, [contenteditable='true']";

export function startLenis(kit: GsapKit | null): () => void {
  let disposed = false;
  let teardown = () => {};

  import("lenis")
    .then(({ default: Lenis }) => {
      if (disposed) return;
      const lenis = new Lenis({ anchors: true, lerp: 0.11, smoothWheel: true, autoRaf: !kit });

      let tick: ((time: number) => void) | null = null;
      if (kit) {
        lenis.on("scroll", kit.ScrollTrigger.update);
        tick = (time: number) => lenis.raf(time * 1000);
        kit.gsap.ticker.add(tick);
        kit.gsap.ticker.lagSmoothing(0);
      }

      let typing = false;
      const sync = () => {
        const menuOpen = document.querySelector("details[data-menu][open]") !== null;
        if (menuOpen) lenis.stop();
        else lenis.start();
        // Champ actif : défilement natif à la molette (saisie, listes de suggestions…).
        lenis.options.smoothWheel = !typing;
      };
      const onFocusIn = (event: FocusEvent) => {
        typing = event.target instanceof Element && event.target.matches(FIELD);
        sync();
      };
      const onFocusOut = () => {
        typing = false;
        sync();
      };
      // L'événement `toggle` des <details> ne remonte pas : on l'écoute en capture.
      document.addEventListener("toggle", sync, true);
      document.addEventListener("focusin", onFocusIn);
      document.addEventListener("focusout", onFocusOut);
      sync();

      teardown = () => {
        document.removeEventListener("toggle", sync, true);
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("focusout", onFocusOut);
        if (kit && tick) {
          kit.gsap.ticker.remove(tick);
          kit.gsap.ticker.lagSmoothing(500, 33);
        }
        lenis.destroy();
      };
    })
    .catch(() => {
      // Lenis indisponible : le défilement natif suffit.
    });

  return () => {
    disposed = true;
    teardown();
  };
}
