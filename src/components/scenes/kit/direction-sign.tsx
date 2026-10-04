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
 * Jamais d'apparition (`data-reveal`) sur ce composant : c'est une action.
 */
import Link from "next/link";
import type { ReactElement } from "react";
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
  className?: string;
};

/** Espace insécable avant « ? ! : ; » : le signe ne part jamais seul à la ligne. */
const frenchSpaces = (text: string) => text.replace(/ ([?!:;])/g, "\u00a0$1");

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
  className,
}: DirectionSignProps): ReactElement {
  const face = (
    <span className={styles.signFace}>
      <span className={styles.signPicto} aria-hidden="true">
        <Icon name={pictogram} size={26} strokeWidth={2.2} />
      </span>
      <span className={styles.signText}>
        <span className={cn(styles.signTitle, "font-sign")}>{frenchSpaces(title)}</span>
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
      className={cn(styles.sign, arrow === "left" && styles.signArrowFirst, className)}
    >
      <span aria-hidden="true" className={styles.rivets} />
      {morphName ? <SharedMorph name={morphName}>{face}</SharedMorph> : face}
      <SignArrow arrow={arrow} />
    </Link>
  );
}
