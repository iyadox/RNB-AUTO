/**
 * Plaque d'information (docs/09, B.8) : plaque sombre, numéro ou pictogramme, titre en
 * `font-step`, texte. Réflexes, garanties, engagements, relais. Elle reçoit le reflet
 * rétroréfléchissant au milieu de l'écran (`data-retro`, CSS seul).
 *
 * Tons : `night` (par défaut) ; `beacon` (consignes de sécurité : numéro et liseré orange) ;
 * `motorway` (bleu autoroute, seulement dans les scènes d'autoroute, jamais pour RNB AUTO).
 * Aucune apparition n'est posée ici : la page décide (jamais sur une consigne de sécurité).
 *
 * `layout="inline"` : numéro et pictogramme à gauche, titre et texte à droite (réflexes en
 * liste). Sur téléphone (< 640 px), le numéro passe au-dessus du pictogramme.
 */
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import styles from "./kit.module.css";

type InfoPlaqueProps = {
  number?: number | string;
  pictogram?: IconName;
  title: ReactNode;
  children?: ReactNode;
  tone?: "night" | "beacon" | "motorway";
  /** Niveau du titre (h3 par défaut). */
  titleAs?: "h2" | "h3" | "h4" | "p";
  /** `stack` (par défaut) : en colonne ; `inline` : numéro et pictogramme à gauche du texte. */
  layout?: "stack" | "inline";
  className?: string;
};

export function InfoPlaque({
  number,
  pictogram,
  title,
  children,
  tone = "night",
  titleAs = "h3",
  layout = "stack",
  className,
}: InfoPlaqueProps): ReactElement {
  const Title = titleAs;
  const label = typeof number === "number" ? String(number).padStart(2, "0") : number;
  return (
    <div
      data-retro=""
      className={cn(
        styles.infoPlaque,
        tone === "beacon" && styles.infoBeacon,
        tone === "motorway" && styles.infoMotorway,
        layout === "inline" && styles.infoInline,
        className,
      )}
    >
      <span aria-hidden="true" className={styles.rivets} />
      {label !== undefined || pictogram ? (
        <div className={styles.infoHead}>
          {label !== undefined ? <span className={cn(styles.infoNumber, "font-figure")}>{label}</span> : null}
          {pictogram ? (
            <span className={styles.infoPicto} aria-hidden="true">
              <Icon name={pictogram} size={22} />
            </span>
          ) : null}
        </div>
      ) : null}
      {layout === "inline" ? (
        <div className={styles.infoBody}>
          <Title className={cn(styles.infoTitle, "font-step text-balance")}>{title}</Title>
          {children ? <div className={cn(styles.infoText, "text-body")}>{children}</div> : null}
        </div>
      ) : (
        <>
          <Title className={cn(styles.infoTitle, "font-step text-balance")}>{title}</Title>
          {children ? <div className={cn(styles.infoText, "text-body")}>{children}</div> : null}
        </>
      )}
    </div>
  );
}
