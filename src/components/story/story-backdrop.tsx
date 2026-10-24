"use client";

/**
 * Calque collant du décor « de la commande à l'arrivée » (voir story-track.tsx).
 *
 * - Le cadre (`.stage`) est rendu tout de suite, vide : aucun nœud de décor dans le HTML ni
 *   dans la charge RSC. Les dessins (`StoryScene`, morceau JavaScript à part) sont montés au
 *   premier signe d'intérêt (défilement, toucher, touche du clavier, cadre proche de l'écran),
 *   au moment calme suivant, en transition React (découpée). Jamais pendant le chargement : une
 *   personne qui ne fait que lire le premier écran ne paie rien.
 * - La scène `story-drive` (module de scène, P22) pilote la progression quand le navigateur ne
 *   le fait pas seul : GSAP ScrollTrigger (lissage `scrub`) sur ordinateur en niveau `full`,
 *   repli léger ailleurs. Sur téléphone récent, le CSS (`animation-timeline`) suffit.
 * - Niveaux `lite` et `off`, ou sans prise en charge : image fixe (la dépanneuse arrivée).
 * Décoratif : `aria-hidden`, sans pointeur, sous le contenu. Pause hors écran (boucles).
 */
import dynamic from "next/dynamic";
import { startTransition, useEffect, useRef, useState, type ReactElement } from "react";
import { useScenes } from "@/components/motion/use-scenes";
import type { SceneLoaders } from "@/components/motion/types";
import styles from "./story-frame.module.css";

const StoryScene = dynamic(() => import("./story-scene"), { ssr: false });

/** Prochain moment calme (Safari : délai court). Retourne l'annulation. */
function whenIdle(callback: () => void, timeout: number): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, 50);
  return () => window.clearTimeout(id);
}

const SCENES: SceneLoaders = {
  "story-drive": () => import("./story-drive.scene"),
};

export function StoryBackdrop(): ReactElement {
  useScenes(SCENES);
  const ref = useRef<HTMLDivElement>(null);
  // 0 : rien ; 1 à 3 : tranches de dessins montées (voir StoryScene).
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const mounted = step > 0;

  // Tranches suivantes, chacune au moment calme suivant.
  useEffect(() => {
    if (step === 0 || step === 3) return;
    return whenIdle(() => startTransition(() => setStep(step === 1 ? 2 : 3)), 600);
  }, [step]);

  useEffect(() => {
    const stage = ref.current;
    if (!stage || mounted) return;
    let done = false;
    let cancelIdle: (() => void) | null = null;
    // Rendu en transition : React le découpe en tranches de quelques millisecondes (aucune
    // longue tâche, même sur un téléphone lent).
    const mount = () => {
      if (done) return;
      done = true;
      stop();
      startTransition(() => setStep(1));
    };
    // Au premier défilement : au prochain moment calme (le décor est encore sous l'écran).
    const soon = () => {
      if (done || cancelIdle) return;
      cancelIdle = whenIdle(mount, 400);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) mount();
      },
      { rootMargin: "0px 0px 15% 0px" },
    );
    const stop = () => {
      io.disconnect();
      cancelIdle?.();
      window.removeEventListener("scroll", soon);
      window.removeEventListener("pointerdown", soon);
      window.removeEventListener("keydown", soon);
    };
    // Cadre déjà proche de l'écran au chargement (grand écran) : monté dès le premier rappel de
    // l'observateur, qui arrive après la première peinture.
    io.observe(stage);
    window.addEventListener("scroll", soon, { passive: true, once: true });
    window.addEventListener("pointerdown", soon, { passive: true, once: true });
    window.addEventListener("keydown", soon, { once: true });
    return stop;
  }, [mounted]);

  return (
    <div ref={ref} className={styles.stage} aria-hidden="true" data-story-stage="" data-scene="story-drive" data-pause-offscreen="">
      {step === 0 ? null : <StoryScene step={step} />}
    </div>
  );
}
