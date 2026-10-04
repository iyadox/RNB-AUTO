"use client";

/**
 * P13 · Pmv : panneau à messages variables, matrice de LED ambre. Un message à la fois,
 * remplacé colonne par colonne toutes les 3,5 s. Contenu FACTUEL uniquement.
 * - Le visuel est `aria-hidden` ; une liste `sr-only` statique donne tous les messages.
 * - Pause au survol, au focus, hors de l'écran, et avec le bouton « Pause » (WCAG 2.2.2).
 * - `off` et sans JavaScript : premier message affiché, fixe.
 * Mobile : deux lignes de 26 caractères au plus par message.
 * Taille des LED : celle qui fait tenir la plus longue ligne dans la largeur du panneau (20 px au
 * moins ; police plus étroite sur un panneau étroit). Le panneau prend la largeur de son conteneur.
 * `joinFrom="lg"` : à partir de 1 024 px, un message en deux parties s'affiche sur UNE ligne
 * (une seule instance pour le téléphone et l'ordinateur).
 */
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { cn } from "@/components/ui/cn";
import { currentMotionLevel, subscribeMotionLevel } from "./level";
import { longestLedEm } from "./pmv-fit";
import styles from "./pmv.module.css";

/**
 * Un message : une ligne, deux lignes, ou deux lignes avec le séparateur à placer entre elles
 * quand elles sont réunies sur une ligne (`joinFrom`) ; par défaut, une espace.
 * Ex. `{ lines: ["APPEL · WHATSAPP", "EN LIGNE"], joiner: " · " }`.
 */
export type PmvMessage =
  | string
  | readonly [string, string]
  | { readonly lines: readonly [string, string]; readonly joiner?: string };

type PmvProps = {
  messages: PmvMessage[];
  /** Nom accessible du panneau (ex. « Informations RNB AUTO »). */
  label: string;
  size?: "md" | "lg";
  /** Temps d'affichage d'un message, en ms (3 500 par défaut). */
  interval?: number;
  /** À partir de 1 024 px (`lg`), réunit les deux parties d'un message sur une seule ligne. */
  joinFrom?: "lg";
  className?: string;
};

const WIPE_MS = 280;
const lines = (message: PmvMessage): readonly string[] =>
  typeof message === "string" ? [message] : "lines" in message ? message.lines : (message as readonly string[]);
const joinerOf = (message: PmvMessage) => (typeof message === "object" && "lines" in message ? (message.joiner ?? " ") : " ");
/** Texte complet d'un message (liste lue par les lecteurs d'écran, version sur une ligne). */
const fullText = (message: PmvMessage) => lines(message).join(joinerOf(message));
const motionAllowed = () => currentMotionLevel() !== "off";

export function Pmv({ messages, label, size = "md", interval = 3500, joinFrom, className }: PmvProps) {
  const ref = useRef<HTMLDivElement>(null);
  const animated = useSyncExternalStore(subscribeMotionLevel, motionAllowed, () => false);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const count = messages.length;
  const running = animated && count > 1 && !paused && !hovered && !focused && onScreen;

  // Hors de l'écran : le panneau s'arrête (batterie).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => setOnScreen(entries.some((entry) => entry.isIntersecting)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Cycle : affichage, effacement (280 ms), écriture (280 ms). Une pause n'interrompt jamais un
  // effacement en cours : le message suivant s'écrit en entier.
  useEffect(() => {
    if (phase === "idle") {
      if (!running) return;
      const timer = window.setTimeout(() => setPhase("out"), interval);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      if (phase === "out") {
        setIndex((value) => (value + 1) % count);
        setPhase("in");
      } else {
        setPhase("idle");
      }
    }, WIPE_MS);
    return () => window.clearTimeout(timer);
  }, [phase, running, interval, count]);

  const shown = animated ? messages[index % count] : messages[0];
  if (!shown) return null;

  // Largeur du plus long message, en em, pour la taille des LED (pmv-fit.ts, pmv.module.css).
  const allLines = messages.flatMap((message) => lines(message));
  const fit = {
    "--pmv-em": longestLedEm(allLines, "wide"),
    "--pmv-em-narrow": longestLedEm(allLines, "narrow"),
    "--pmv-em-joined": longestLedEm(messages.map(fullText), "wide"),
  } as CSSProperties;
  const shownLines = lines(shown);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      style={fit}
      className={cn(styles.pmv, size === "lg" ? styles.lg : styles.md, joinFrom === "lg" && styles.joinLg, className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className={styles.housing} aria-hidden="true">
        <div className={cn(styles.matrix, "font-led")}>
          <div className={cn(styles.message, phase === "out" && styles.out, phase === "in" && styles.in)}>
            {shownLines.map((line, i) => (
              <span key={i} className={styles.part}>
                {i > 0 && joinFrom ? <span className={cn(styles.line, styles.joiner)}>{joinerOf(shown)}</span> : null}
                <span className={styles.line}>{line}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <ul className="sr-only">
        {messages.map((message, i) => (
          <li key={i}>{fullText(message)}</li>
        ))}
      </ul>
      {/* Rendu dès le serveur (aucun décalage de mise en page à l'hydratation) ; masqué en CSS
          sans JavaScript, en niveau `off` et avec la préférence « réduire » (motion.css, P20). */}
      {count > 1 ? (
        <button type="button" data-scene-pause className={styles.pause} onClick={() => setPaused((value) => !value)}>
          <svg viewBox="0 0 16 16" className={styles.pauseIcon} aria-hidden="true" fill="currentColor">
            {paused ? <path d="M4 2.5v11l9-5.5z" /> : <path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" />}
          </svg>
          {paused ? "Lecture" : "Pause"}
        </button>
      ) : null}
    </div>
  );
}
