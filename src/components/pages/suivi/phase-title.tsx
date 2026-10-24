"use client";

/**
 * Titre de l'étape du suivi (le seul h1 de la page). Quand l'étape change pendant que la page est
 * ouverte (mise à jour en direct), le titre s'allume une fois et la nouvelle étape est annoncée
 * aux lecteurs d'écran. Au premier affichage : aucune animation, aucune annonce.
 */
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./suivi.module.css";

export function PhaseTitle({ phase, title, text }: { phase: string; title: string; text: string }) {
  const [shown, setShown] = useState(phase);
  const [changes, setChanges] = useState(0);
  if (shown !== phase) {
    setShown(phase);
    setChanges((count) => count + 1);
  }
  const words = title.split(" ");
  const last = words.pop() ?? "";
  return (
    <>
      <div key={changes} className={cn(changes > 0 && styles.flash)}>
        <h1 className={cn(styles.title, "font-display")}>
          {words.join(" ")} <em className={cn("not-italic", phase === "cancelled" ? "text-beacon-400" : "text-signal-500")}>{last}</em>
        </h1>
        <p className={styles.lead}>{text}</p>
      </div>
      {/* Zone stable (jamais remontée) : seule son contenu change, il est donc bien annoncé. */}
      <p aria-live="polite" className="sr-only">
        {changes > 0 ? `Nouvelle étape : ${title}.` : ""}
      </p>
    </>
  );
}
