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
import { MOTION_CHANGE_EVENT, applyMotionLevel, currentMotionLevel } from "./level";
import { ambientEffects, readCalmMarker } from "./runtime/calm";
import { startHalo } from "./runtime/halo";
import { observeInView, observePause, observeRetro, observeSky, onDomChange, trackScrollProgress } from "./runtime/observers";
import { installTransitionOrigin } from "./runtime/transition-origin";
import type { GsapKit, MotionLevel } from "./types";

type Cleanup = () => void;

const DESKTOP_QUERY = "(min-width: 1024px) and (pointer: fine)";
/**
 * Ce qui exige le kit GSAP complet au démarrage : scènes collantes et tracés liés au défilement,
 * qui n'existent que sur ordinateur. En `lite`, seules les scènes collantes. La montée des lignes
 * (`[data-split]`, niveau `full`) charge elle-même GSAP et SplitText, sans ScrollTrigger, à
 * l'approche du premier titre ; les scènes `needsGsap` chargent le kit à leur approche.
 * Sur téléphone, rien n'est donc chargé au démarrage.
 */
const NEEDS_GSAP_FULL = "[data-stage],[data-route-mode=scrub]";
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
 * Transitions de page (P19). Pendant qu'elle photographie l'ancienne page, une View Transition fige
 * l'écran : quelques dizaines de millisecondes avec un processeur graphique, 0,6 à 0,9 s mesurées
 * sans (accueil → /depannage), avant même que React ne valide la nouvelle page. Donc :
 * - niveau `off` (préférence « moins d'animations » ou bouton) : aucune transition, la page change
 *   tout de suite (même sans animation, la photographie figeait l'écran 0,8 à 1 s) ;
 * - ailleurs, chaque transition est chronométrée jusqu'au rappel de mise à jour : au-delà de
 *   `SLOW_CAPTURE_MS`, l'appareil est trop lent pour elles et elles sont coupées pour la visite.
 * React appelle `document.startViewTransition` dans un try/catch et, s'il échoue, valide la page
 * directement (comme sur un navigateur sans prise en charge) : une propriété propre du document
 * masque ou enveloppe la méthode du prototype ; la retirer la rend.
 */
const SLOW_CAPTURE_MS = 300;
let slowCapture = false;

type TransitionArg = (() => unknown) | { update?: () => unknown; types?: string[] } | undefined;

function watchedTransition(this: Document, arg?: TransitionArg): unknown {
  const started = performance.now();
  const update = typeof arg === "function" ? arg : arg?.update;
  const timed = () => {
    if (!slowCapture && performance.now() - started > SLOW_CAPTURE_MS) {
      slowCapture = true;
      setPageTransitions(false);
    }
    return update?.();
  };
  const options = typeof arg === "function" || arg === undefined ? timed : { ...arg, update: timed };
  // Lu à chaque appel : une enveloppe posée plus tard sur le prototype (tests) reste appelée.
  const original = Document.prototype.startViewTransition as unknown as (this: Document, arg: unknown) => unknown;
  return original.call(this, options);
}

function setPageTransitions(enabled: boolean): void {
  if (typeof Document.prototype.startViewTransition !== "function") return;
  const value = enabled && !slowCapture ? watchedTransition : undefined;
  Object.defineProperty(document, "startViewTransition", { value, configurable: true, writable: true });
}

function restorePageTransitions(): void {
  Reflect.deleteProperty(document, "startViewTransition");
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
  // Routes et pages calmes : ni Lenis ni halo ; routes sans halo (/panne-autoroute) : Lenis
  // seulement (C.6). Le marqueur de la page (404, erreur) est relu à chaque décision.
  const effects = (marker = readCalmMarker(document)) => ambientEffects({ desktop, level, pathname, marker });
  const cleanups: Cleanup[] = [];
  let disposed = false;
  let stopHalo: Cleanup | null = null;
  let stopLenis: Cleanup | null = null;
  const lenisAllowed = () => effects().lenis;

  // 1. Observateurs ; les éléments déjà visibles sont marqués avant `.motion-ready`.
  // 2. Les états cachés n'existent qu'à partir de là, et jamais en `off`.
  //    - Premier chargement (`.motion-ready` absente) : la page est déjà peinte à l'état final.
  //      Les positions viennent du premier rappel de l'observateur (aucune mise en page forcée
  //      pendant l'hydratation) et `.motion-ready` est posée dans ce rappel, juste après le
  //      marquage, avant l'image suivante : aucun élément visible n'est jamais peint caché.
  //    - Changement de page (`.motion-ready` déjà là) : marquage immédiat, avant l'affichage.
  const ready = () => {
    if (!disposed) html.classList.add("motion-ready");
  };
  if (level === "off") html.classList.remove("motion-ready");
  const deferReady = level !== "off" && !html.classList.contains("motion-ready");
  run(() => observeInView(document, deferReady ? ready : undefined), cleanups);
  run(() => observePause(document), cleanups);
  run(() => observeSky(document), cleanups);
  if (level === "off" || !CSS.supports("animation-timeline: scroll()")) run(trackScrollProgress, cleanups);
  setPageTransitions(level !== "off");
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
  const startHaloOnce = () => {
    if (stopHalo || disposed) return;
    try {
      stopHalo = startHalo();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn("[motion]", error);
    }
  };
  if (effects().halo) startHaloOnce();
  const calmWatch = () => {
    const marker = readCalmMarker(document);
    // Marqueur retiré (page d'erreur refermée par « Réessayer », sans changer d'adresse) : le
    // halo revient. Lenis, lui, attend la page suivante (il faudrait recharger ses modules).
    if (!marker) {
      if (effects(null).halo) startHaloOnce();
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

  // 5. Chargement différé : aides, GSAP si la page en a besoin, scènes, Lenis. Chaque étape
  //    rend la main au navigateur (aucune longue tâche au démarrage, TBT ≤ 150 ms, G.2).
  cleanups.push(
    whenIdle(() => {
      void (async () => {
        const helpers = await import("./runtime/helpers");
        // La mise en place ne s'ajoute pas à la tâche qui évalue le module.
        await helpers.yieldToMain();
        if (disposed) return;
        const kits = () => import("./runtime/gsap-kit");
        const loadKit = () => kits().then((m) => m.loadGsapKit());
        let kit: GsapKit | null = null;
        const needsGsap = desktop && document.querySelector(level === "full" ? NEEDS_GSAP_FULL : NEEDS_GSAP_LITE);
        if (needsGsap) {
          kit = await loadKit().catch(() => null);
          if (disposed) return;
          await helpers.yieldToMain();
          if (disposed) return;
        }
        const sceneHelpers = helpers.createSceneHelpers();
        const context = { level, desktop, helpers: sceneHelpers, loadKit };
        if (level === "full" && document.querySelector("[data-split]")) {
          run(() => helpers.initSplit(document, () => kits().then((m) => m.loadSplitKit())), cleanups);
        }
        if (kit) {
          const gsapKit = kit;
          run(() => helpers.initStages(document, gsapKit, desktop), cleanups);
          await helpers.yieldToMain();
          if (disposed) return;
        }
        run(() => helpers.initRoutes(document, kit, context), cleanups);
        await helpers.yieldToMain();
        if (disposed) return;
        run(() => helpers.initScenes(document, context), cleanups);
        if (lenisAllowed()) {
          await helpers.yieldToMain();
          if (disposed) return;
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
  useLayoutEffect(
    () => () => {
      document.documentElement.classList.remove("motion-ready");
      restorePageTransitions();
    },
    [],
  );

  return null;
}
