"use client";

/**
 * P20 · Bouton global « Arrêter les animations » (pied de page). Choix mémorisé sous
 * `rnb-motion`, appliqué tout de suite à tout le site (événement `rnb:motion-change`).
 * C'est un <button aria-pressed>, jamais une case à cocher (docs/09, G.1).
 * Masqué sans JavaScript et quand la préférence système est déjà « réduire ».
 */
import { useSyncExternalStore } from "react";
import { cn } from "@/components/ui/cn";
import { currentMotionLevel, setMotionStopped, subscribeMotionLevel } from "./level";

const isStopped = () => currentMotionLevel() === "off";

export function MotionToggle({ className }: { className?: string }) {
  const stopped = useSyncExternalStore(subscribeMotionLevel, isStopped, () => false);
  return (
    <button
      type="button"
      data-motion-toggle
      aria-pressed={stopped}
      onClick={() => setMotionStopped(!stopped)}
      className={cn(
        "group inline-flex min-h-12 items-center gap-3 rounded-full px-4 text-small text-asphalt-200 transition-colors hover:text-chalk",
        "shadow-[inset_0_0_0_1px_rgb(255_253_246_/_0.14)] hover:shadow-[inset_0_0_0_1px_rgb(255_253_246_/_0.3)]",
        className,
      )}
    >
      {/* Interrupteur : allumé (jaune) quand les animations sont arrêtées. */}
      <span
        aria-hidden="true"
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          stopped ? "bg-signal-500" : "bg-asphalt-700",
        )}
      >
        <span
          className={cn(
            // Seul `transform` est animé (C.1-7 : jamais `left`).
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform",
            stopped ? "translate-x-4 bg-asphalt-950" : "translate-x-0 bg-asphalt-300",
          )}
        />
      </span>
      Arrêter les animations
    </button>
  );
}
