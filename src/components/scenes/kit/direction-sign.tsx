/**
 * Panneau de direction (docs/09, B.8) : un grand lien en forme de plaque de signalisation.
 * Pictogramme dans un carré, inscription en `font-sign`, ligne d'aide, flèche orientée.
 *
 * - Tons : `night` (plaque sombre, liseré rétroréfléchissant), `signal` (LE seul panneau jaune
 *   de l'écran : l'action principale), `beacon` (sécurité, autoroute : accents orange).
 * - Zone de toucher ≥ 80 px de haut, focus visible, reflet rétroréfléchissant au milieu de
 *   l'écran (`data-retro`) et au survol ; la flèche avance de 8 px au survol.
 * - `morphName` : la plaque devient l'en-tête de la page d'arrivée (`SharedMorph`, D.4). Le
 *   lien lui-même n'est jamais nommé : seule sa face intérieure l'est.
 * - L'inscription ne déborde jamais (320 à 1 440 px, panneaux étroits, grilles) : sa taille est
 *   `--text-sign`, réduite si le mot le plus long ne tient pas dans la largeur de la colonne de
 *   texte (requête de conteneur, largeur du mot estimée au rendu). Le panneau occupe la largeur
 *   que lui donne son parent (bloc, grille, colonne flexible), jamais une largeur « au contenu ».
 * - `size="compact"` : inscription plus petite (taille d'étape), pictogramme et flèche réduits,
 *   pour les intitulés longs (« Que faire en cas de panne sur autoroute »).
 * Jamais d'apparition (`data-reveal`) sur ce composant : c'est une action.
 */
import Link from "next/link";
import type { CSSProperties, ReactElement } from "react";
import { SharedMorph, type MorphName } from "@/components/motion/page-transition";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import styles from "./kit.module.css";

type Arrow = "left" | "up" | "up-right" | "right" | "down";

type DirectionSignProps = {
  href: string;
  title: string;
  subtitle?: string;
  arrow: Arrow;
  pictogram: IconName;
  tone?: "night" | "signal" | "beacon";
  morphName?: MorphName;
  transitionTypes?: string[];
  /** `compact` : inscription plus petite, pour un intitulé long. */
  size?: "default" | "compact";
  className?: string;
};

/** Espace insécable avant « ? ! : ; » : le signe ne part jamais seul à la ligne. */
const frenchSpaces = (text: string) => text.replace(/ ([?!:;])/g, "\u00a0$1");

/**
 * Chasse des capitales `font-sign` (centièmes d'em, espacement de 0,02 em compris), mesurée
 * dans le navigateur. Lettres accentuées : la lettre de base ; inconnu : 0,95 em.
 */
const SIGN_ADVANCE: Record<string, number> = {
  A: 86, B: 85, C: 87, D: 86, E: 80, F: 74, G: 93, H: 90, I: 37, J: 70, K: 88, L: 71, M: 105,
  N: 90, O: 93, P: 80, Q: 93, R: 86, S: 80, T: 78, U: 90, V: 83, W: 111, X: 85, Y: 84, Z: 79,
  "0": 73, "1": 68, "2": 72, "3": 72, "4": 72, "5": 72, "6": 73, "7": 68, "8": 73, "9": 72,
  "'": 30, "’": 32, "?": 68, "!": 35, ":": 35, ";": 36, ".": 36, ",": 35, "\u00a0": 26,
};

/** Largeur (em) d'un groupe insécable, avec 4 % de marge. */
function chunkWidth(chunk: string): number {
  let advance = 0;
  for (const char of chunk.toUpperCase()) {
    const base = char.normalize("NFD")[0] ?? char;
    advance += SIGN_ADVANCE[char] ?? SIGN_ADVANCE[base] ?? 95;
  }
  return (advance / 100) * 1.04;
}

/** Largeur du plus long groupe insécable du titre (les coupures se font aux espaces et traits d'union). */
const longestChunk = (title: string) =>
  Math.max(1, ...title.split(/[ \-]/).map((chunk) => chunkWidth(chunk)));

const ARROW_ROTATION: Record<Arrow, number> = { right: 0, "up-right": -45, up: -90, left: 180, down: 90 };

/** Flèche de signalisation pleine (fût et pointe), grille de 24, orientée vers la droite. */
function SignArrow({ arrow }: { arrow: Arrow }) {
  return (
    <span className={styles.signArrow} data-arrow={arrow} aria-hidden="true">
      <svg viewBox="0 0 24 24" style={{ rotate: `${ARROW_ROTATION[arrow]}deg` }}>
        <path d="M2.5 10.4h11V5.2L22 12l-8.5 6.8v-5.2h-11Z" fill="currentColor" />
      </svg>
    </span>
  );
}

export function DirectionSign({
  href,
  title,
  subtitle,
  arrow,
  pictogram,
  tone = "night",
  morphName,
  transitionTypes,
  size = "default",
  className,
}: DirectionSignProps): ReactElement {
  const text = frenchSpaces(title);
  const face = (
    <span className={styles.signFace}>
      <span className={styles.signPicto} aria-hidden="true">
        <Icon name={pictogram} size={26} strokeWidth={2.2} />
      </span>
      <span className={styles.signText}>
        <span
          className={cn(styles.signTitle, "font-sign")}
          style={{ "--sign-fit": longestChunk(text).toFixed(2) } as CSSProperties}
        >
          {text}
        </span>
        {subtitle ? <span className={styles.signSubtitle}>{subtitle}</span> : null}
      </span>
    </span>
  );

  return (
    <Link
      href={href}
      transitionTypes={transitionTypes}
      data-retro=""
      data-tone={tone}
      className={cn(styles.sign, arrow === "left" && styles.signArrowFirst, size === "compact" && styles.signCompact, className)}
    >
      <span aria-hidden="true" className={styles.rivets} />
      {morphName ? <SharedMorph name={morphName}>{face}</SharedMorph> : face}
      <SignArrow arrow={arrow} />
    </Link>
  );
}
