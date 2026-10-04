"use client";

/**
 * Runtime du motion (docs/09, C.4), monté une fois dans le layout public. Sans GSAP (≤ 4 Ko
 * compressés) ; tout le reste est chargé en différé. À chaque changement de page, tout ce qui
 * a été créé pour la page précédente est nettoyé (observateurs, ScrollTrigger, SplitText,
 * Lenis, scènes), puis le cycle recommence. Il ne rend rien et n'accède jamais à `window`
 * pendant le rendu. Sans lui (JavaScript bloqué), toutes les pages restent à l'état final.
 */
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { CALM_MARKER, isCalmRoute, isNoHaloRoute } from "@/content/site-map";
import { MOTION_CHANGE_EVENT, applyMotionLevel, currentMotionLevel } from "./level";
import { startHalo } from "./runtime/halo";
import { observeInView, observePause, observeRetro, observeSky, onDomChange, trackScrollProgress } from "./runtime/observers";
import { installTransitionOrigin } from "./runtime/transition-origin";
import type { GsapKit, MotionLevel } from "./types";

type Cleanup = () => void;

const DESKTOP_QUERY = "(min-width: 1024px) and (pointer: fine)";
/**
 * Ce qui exige GSAP (chargé en différé) : montée des lignes, scènes collantes, tracés liés au
 * défilement. En `lite`, ni montée des lignes ni tracé lié au défilement : seules les scènes
 * collantes le justifient (et seulement sur ordinateur, où elles existent).
 */
const NEEDS_GSAP_FULL = "[data-split],[data-stage],[data-route-mode=scrub]";
const NEEDS_GSAP_LITE = "[data-stage]";

const run = (fn: () => Cleanup | void, cleanups: Cleanup[]) => {
  try {
    const cleanup = fn();
    if (cleanup) cleanups.push(cleanup);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.warn("[motion]", error);
  }
};

/**
 * Marqueur de page calme posé par la page elle-même (404, erreur : leur adresse est quelconque) :
 * `data-calm` ou `data-calm="full"` = ni Lenis ni halo ; `data-calm="halo"` = pas de halo.
 */
function readCalmMarker(): "full" | "halo" | null {
  const el = document.querySelector(`[${CALM_MARKER}]`);
  if (!el) return null;
  return el.getAttribute(CALM_MARKER) === "halo" ? "halo" : "full";
}

/** Premier moment calme : `requestIdleCallback` (1 500 ms au plus), premier défilement ou toucher. */
function whenIdle(callback: () => void): Cleanup {
  let done = false;
  let idle = 0;
  let timer = 0;
  const fire = () => {
    if (done) return;
    done = true;
    stop();
    callback();
  };
  const stop = () => {
    if (idle) window.cancelIdleCallback(idle);
    window.clearTimeout(timer);
    window.removeEventListener("scroll", fire);
    window.removeEventListener("pointerdown", fire);
    window.removeEventListener("keydown", fire);
  };
  // Safari n'a pas `requestIdleCallback` : simple délai de 1 200 ms.
  if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(fire, { timeout: 1500 });
  else timer = window.setTimeout(fire, 1200);
  window.addEventListener("scroll", fire, { passive: true, once: true });
  window.addEventListener("pointerdown", fire, { passive: true, once: true });
  window.addEventListener("keydown", fire, { once: true });
  return () => {
    done = true;
    stop();
  };
}

function startPage(pathname: string): Cleanup {
  const html = document.documentElement;
  const level: MotionLevel = currentMotionLevel() ?? applyMotionLevel();
  const desktop = window.matchMedia(DESKTOP_QUERY).matches;
  // Routes calmes : ni Lenis ni halo ; routes sans halo (/panne-autoroute) : Lenis seulement (C.6).
  const calmRoute = isCalmRoute(pathname);
  const haloRoute = !isNoHaloRoute(pathname);
  const cleanups: Cleanup[] = [];
  let disposed = false;
  let stopHalo: Cleanup | null = null;
  let stopLenis: Cleanup | null = null;
  const lenisAllowed = () => desktop && level === "full" && !calmRoute && readCalmMarker() !== "full";

  // 1. Observateurs ; les éléments déjà visibles sont marqués avant `.motion-ready`.
  run(() => observeInView(document), cleanups);
  run(() => observePause(document), cleanups);
  run(() => observeSky(document), cleanups);
  if (level === "off" || !CSS.supports("animation-timeline: scroll()")) run(trackScrollProgress, cleanups);

  // 2. Les états cachés n'existent qu'à partir d'ici, et jamais en `off`.
  html.classList.toggle("motion-ready", level !== "off");
  const dispose = () => {
    disposed = true;
    for (const cleanup of cleanups.reverse()) {
      try {
        cleanup();
      } catch {
        // Nettoyage suivant.
      }
    }
    cleanups.length = 0;
  };
  if (level === "off") return dispose;

  // 3. Reflet des plaques (P6) : une fois au milieu de l'écran.
  run(() => observeRetro(document), cleanups);

  // 4. Halo des phares : ordinateur, niveau `full`, hors routes calmes ou sans halo, hors page
  //    marquée calme. Un marqueur qui apparaît après coup (page d'erreur) coupe halo et Lenis.
  const haloAllowed = desktop && level === "full" && haloRoute;
  const startHaloOnce = () => {
    if (stopHalo || disposed) return;
    try {
      stopHalo = startHalo();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn("[motion]", error);
    }
  };
  if (haloAllowed && !readCalmMarker()) startHaloOnce();
  const calmWatch = () => {
    const marker = readCalmMarker();
    // Marqueur retiré (page d'erreur refermée par « Réessayer », sans changer d'adresse) : le
    // halo revient. Lenis, lui, attend la page suivante (il faudrait recharger ses modules).
    if (!marker) {
      if (haloAllowed) startHaloOnce();
      return;
    }
    stopHalo?.();
    stopHalo = null;
    if (marker === "full") {
      stopLenis?.();
      stopLenis = null;
    }
  };
  run(() => onDomChange(calmWatch), cleanups);
  cleanups.push(() => {
    stopHalo?.();
    stopLenis?.();
    stopHalo = stopLenis = null;
  });

  // 5. Chargement différé : aides, GSAP si la page en a besoin, scènes, Lenis.
  cleanups.push(
    whenIdle(() => {
      void (async () => {
        const helpers = await import("./runtime/helpers");
        if (disposed) return;
        const loadKit = () => import("./runtime/gsap-kit").then((m) => m.loadGsapKit());
        let kit: GsapKit | null = null;
        const needsGsap = level === "full" ? document.querySelector(NEEDS_GSAP_FULL) : desktop && document.querySelector(NEEDS_GSAP_LITE);
        if (needsGsap) {
          kit = await loadKit().catch(() => null);
          if (disposed) return;
        }
        const sceneHelpers = helpers.createSceneHelpers();
        const context = { level, desktop, helpers: sceneHelpers, loadKit };
        if (kit) {
          const gsapKit = kit;
          if (level === "full") run(() => helpers.initSplit(document, gsapKit), cleanups);
          run(() => helpers.initStages(document, gsapKit, desktop), cleanups);
        }
        run(() => helpers.initRoutes(document, kit, context), cleanups);
        run(() => helpers.initScenes(document, context), cleanups);
        if (lenisAllowed()) {
          const { startLenis } = await import("./runtime/lenis");
          if (disposed) return;
          // Le marqueur calme a pu apparaître pendant le chargement du module.
          if (lenisAllowed()) {
            try {
              stopLenis = startLenis(kit);
            } catch (error) {
              if (process.env.NODE_ENV !== "production") console.warn("[motion]", error);
            }
          }
        }
        if (kit) {
          const { ScrollTrigger } = kit;
          void document.fonts.ready.then(() => {
            if (!disposed) ScrollTrigger.refresh();
          });
        }
      })().catch((error: unknown) => {
        // Module bloqué ou réseau coupé : la page reste complète, rien n'est caché.
        if (process.env.NODE_ENV !== "production") console.warn("[motion] chargement différé impossible", error);
      });
    }),
  );

  return dispose;
}

export function MotionRuntime(): null {
  const pathname = usePathname();
  // Incrémenté quand le niveau change (bouton, préférence système) : le cycle recommence.
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const restart = () => setEpoch((value) => value + 1);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMedia = () => applyMotionLevel();
    window.addEventListener(MOTION_CHANGE_EVENT, restart);
    media.addEventListener("change", onMedia);
    const stopOrigin = installTransitionOrigin();
    return () => {
      window.removeEventListener(MOTION_CHANGE_EVENT, restart);
      media.removeEventListener("change", onMedia);
      stopOrigin();
    };
  }, []);

  // Avant l'affichage : la nouvelle page n'est jamais peinte avec des éléments visibles cachés.
  // `.motion-ready` n'est PAS retirée entre deux pages (startPage la pose ou la retire selon le
  // niveau) : la retirer forcerait un calcul de style sans elle, et les animations des éléments
  // du layout (pied de page…) repartiraient de zéro à chaque navigation.
  useLayoutEffect(() => startPage(pathname), [pathname, epoch]);
  useLayoutEffect(() => () => document.documentElement.classList.remove("motion-ready"), []);

  return null;
}
