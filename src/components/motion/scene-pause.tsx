"use client";

/**
 * P20 · Bouton « Pause » / « Lecture » dans le coin d'une scène qui tourne en boucle
 * (WCAG 2.2.2). Il pose `.scene-paused` et `data-user-paused` sur la cible : le runtime ne
 * relance pas une scène mise en pause par le visiteur quand elle revient dans l'écran.
 * Le choix est mémorisé dans le navigateur (`usePauseChoice`, une clé par scène) : après un
 * rechargement ou un retour sur la page, la scène reste en pause (critère I).
 * Masqué sans JavaScript et en niveau `off` (la scène est déjà immobile).
 */
import { useEffect } from "react";
import { cn } from "@/components/ui/cn";
import { usePauseChoice } from "./pause-choice";

export function ScenePause({ targetId, className }: { targetId: string; className?: string }) {
  const [paused, setPaused] = usePauseChoice(targetId);

  // Applique le choix à la scène (au montage aussi : pause mémorisée). La reprise ne retire la
  // pause que si elle venait du visiteur : la pause « hors de l'écran » du runtime est gardée.
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    if (paused) {
      target.classList.add("scene-paused");
      target.setAttribute("data-user-paused", "");
    } else if (target.hasAttribute("data-user-paused")) {
      target.classList.remove("scene-paused");
      target.removeAttribute("data-user-paused");
    }
  }, [paused, targetId]);

  return (
    <button
      type="button"
      data-scene-pause
      aria-controls={targetId}
      onClick={() => setPaused(!paused)}
      className={cn(
        "inline-flex min-h-12 items-center gap-2 rounded-full bg-night-950/70 px-3.5 text-small font-semibold text-asphalt-200 transition-colors hover:text-chalk",
        "shadow-[inset_0_0_0_1px_rgb(255_253_246_/_0.14)]",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true" fill="currentColor">
        {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />}
      </svg>
      {paused ? "Lecture" : "Pause"}
    </button>
  );
}
