/**
 * Voyants de tableau de bord (docs/09, B.8 et P15) : « le problème ». Un témoin allumé en
 * ambre (ou en rouge pour l'accident) dans sa cellule de tableau de bord.
 *
 * - `VoyantGroup` pose `data-ignite` : à l'entrée dans l'écran, les voyants s'allument comme à
 *   la mise du contact (deux scintillements, cascade de 40 ms selon l'ordre des enfants
 *   directs). Chaque partie lumineuse porte `data-light`. Sans JavaScript et en `off` : allumés.
 * - `Voyant` : `lit={false}` montre le témoin éteint (lampe visible mais sombre) ; quand il
 *   passe à `lit`, il s'allume en 220 ms (choix d'un problème dans /demande).
 * - Le libellé est affiché sous la cellule (`showLabel`, par défaut). Si la page affiche déjà
 *   le titre à côté, `showLabel={false}` : le voyant devient purement décoratif.
 */
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./kit.module.css";

export type VoyantGlyph = "battery" | "tpms" | "engine" | "parking" | "access" | "question" | "accident" | "wheel-lock" | "hook";

/** Codes de problème de la base (catalogue `problem`) → voyant. */
export const PROBLEM_VOYANTS: Record<string, VoyantGlyph> = {
  battery: "battery",
  flat_tire: "tpms",
  breakdown: "engine",
  accident: "accident",
  locked_wheels: "wheel-lock",
  other: "question",
};

/** Témoins dessinés sur la grille de 24 (trait de 1,9 px, bouts arrondis). */
const GLYPHS: Record<VoyantGlyph, ReactElement> = {
  battery: (
    <>
      <rect x="3" y="7.5" width="18" height="11.5" rx="1.6" />
      <path d="M6.5 7.5V5.6h3.2v1.9M14.3 7.5V5.6h3.2v1.9M6.4 13.2h3.6M14.1 13.2h3.6M15.9 11.4V15" />
    </>
  ),
  tpms: (
    <>
      <path d="M6.6 5.6A8.4 8.4 0 0 0 4.4 17l1.1 2.6h13l1.1-2.6a8.4 8.4 0 0 0-2.2-11.4" />
      <path d="M5.4 21.2l.6-1.6M9.2 21.4v-1.8M12 21.4v-1.8M14.8 21.4v-1.8M18.6 21.2l-.6-1.6" />
      <path d="M12 8.2v5.2M12 16.2v.2" />
    </>
  ),
  engine: (
    <>
      <path d="M4.6 9.6h2.9l1.8-2.2h5.5v2.2h2l1.7 2.1H21v4.6h-2.4L17 18.5H8.3l-2-2.2H4.6Z" />
      <path d="M2.6 11.1v4.1M10.2 7.4V5.5h4.2" />
    </>
  ),
  parking: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 16.6V7.5h3.1a2.8 2.8 0 0 1 0 5.6H10" />
    </>
  ),
  access: (
    <>
      <path d="M3 4.6h18M6.2 4.6 4.4 7M10.2 4.6 8.4 7M14.2 4.6 12.4 7M18.2 4.6 16.4 7" />
      <path d="M3 19.5h5.6l6.2-6.2H21" />
      <path d="M9 14.6l1.1-2h4.1l1.2 2v2.2H9Z" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.4a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 3.9M12 16.8v.2" />
    </>
  ),
  accident: (
    <>
      <path d="M10.5 4.2 2.6 18.1A1.8 1.8 0 0 0 4.2 20.8h15.6a1.8 1.8 0 0 0 1.6-2.7L13.5 4.2a1.8 1.8 0 0 0-3 0Z" />
      <path d="M12 9.6v4.8M12 17.2v.2" />
    </>
  ),
  "wheel-lock": (
    <>
      <circle cx="10.5" cy="10.5" r="7.6" />
      <circle cx="10.5" cy="10.5" r="2.8" />
      <rect x="14.3" y="15" width="7" height="6" rx="1.2" />
      <path d="M15.9 15v-1.4a1.9 1.9 0 0 1 3.8 0V15" />
    </>
  ),
  hook: (
    <>
      <circle cx="12" cy="3.6" r="1.6" />
      <path d="M12 5.2v6.4" />
      <path d="M12 11.6a4.6 4.6 0 1 1-4.6 4.6" />
      <path d="M7.4 16.2 5.6 13.9M7.4 16.2l2.3-1" />
    </>
  ),
};

type VoyantProps = {
  glyph: VoyantGlyph;
  label: string;
  tone?: "amber" | "red";
  lit?: boolean;
  /**
   * Côté de la cellule, en px. Sans cette prop : 56 px, réglables par une classe de la page
   * (`--voyant-size`, sans `!important`), y compris selon la taille de l'écran.
   */
  size?: number;
  /** Libellé sous la cellule (par défaut). `false` : voyant décoratif, la page donne le texte. */
  showLabel?: boolean;
  className?: string;
};

export function Voyant({ glyph, label, tone = "amber", lit = true, size, showLabel = true, className }: VoyantProps): ReactElement {
  const shape = GLYPHS[glyph];
  return (
    <span
      className={cn(styles.voyant, tone === "red" && styles.voyantRed, className)}
      data-lit={lit ? "" : undefined}
      aria-hidden={showLabel ? undefined : true}
      style={size === undefined ? undefined : ({ "--voyant-size": `${size}px` } as CSSProperties)}
    >
      <span className={styles.voyantCell}>
        <span className={styles.voyantGlow} data-light={lit ? "" : undefined} />
        <svg viewBox="0 0 24 24" className={styles.voyantSvg} aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Lampe éteinte, toujours visible (comme sur un vrai tableau de bord). */}
          <g className={styles.voyantOff} strokeWidth="1.9">
            {shape}
          </g>
          {lit ? (
            <g data-light="" className={styles.voyantOn}>
              <g strokeWidth="4.6" className={styles.voyantBloom}>
                {shape}
              </g>
              <g strokeWidth="1.9">{shape}</g>
            </g>
          ) : null}
        </svg>
      </span>
      {showLabel ? <span className={styles.voyantLabel}>{label}</span> : null}
    </span>
  );
}

type VoyantGroupProps = {
  children: ReactNode;
  className?: string;
  /** `ul` si les enfants sont des `<li>` (par défaut : `div`). */
  as?: "div" | "ul";
};

export function VoyantGroup({ children, className, as = "div" }: VoyantGroupProps): ReactElement {
  const Tag = as;
  return (
    <Tag data-ignite="" className={className}>
      {children}
    </Tag>
  );
}
