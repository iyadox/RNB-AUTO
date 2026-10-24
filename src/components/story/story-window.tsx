/**
 * Fenêtre du décor « de la commande à l'arrivée » : une respiration transparente entre deux
 * sections de la piste (`StoryTrack`), où un acte se joue en entier, sans texte par-dessus.
 * 1 · la demande (le téléphone) ; 2 · l'arrivée de la dépanneuse ; 3 · le chargement et le départ.
 * Elle porte la frise de son acte (`view-timeline: --w1|--w2|--w3`). Décorative (`aria-hidden`).
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./story-frame.module.css";

const ACT_CLASS = { 1: styles.w1, 2: styles.w2, 3: styles.w3 } as const;

export function StoryWindow({ act }: { act: 1 | 2 | 3 }): ReactElement {
  return <div aria-hidden="true" data-story-window={act} className={cn(styles.window, ACT_CLASS[act])} />;
}
