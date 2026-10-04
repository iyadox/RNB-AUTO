"use client";

/**
 * P20 · Bouton « Pause » / « Lecture » dans le coin d'une scène qui tourne en boucle
 * (WCAG 2.2.2). Il pose `.scene-paused` et `data-user-paused` sur la cible : le runtime ne
 * relance pas une scène mise en pause par le visiteur quand elle revient dans l'écran.
 * Masqué sans JavaScript et en niveau `off` (la scène est déjà immobile).
 */
import { useState } from "react";
import { cn } from "@/components/ui/cn";

export function ScenePause({ targetId, className }: { targetId: string; className?: string }) {
  const [paused, setPaused] = useState(false);
  const toggle = () => {
    const next = !paused;
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.toggle("scene-paused", next);
      target.toggleAttribute("data-user-paused", next);
    }
    setPaused(next);
  };
  return (
    <button
      type="button"
      data-scene-pause
      aria-controls={targetId}
      onClick={toggle}
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
