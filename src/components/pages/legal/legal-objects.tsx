/**
 * Objets de la route des pages légales (docs/09, B.8, F.9). Les textes sont ceux des pages,
 * mot pour mot : ces composants ne font que les mettre en forme.
 *
 * - `LegalSection` : une section de l'article, avec sa borne (numéro décoratif) et son titre.
 * - `Chantier` : le marqueur « À COMPLÉTER » du socle (`ToComplete`, bordure de chantier).
 * - `TarePlate` : plaque rivetée « libellé / valeur » (éditeur du site).
 * - `SignList` : liste à pictogrammes de signalisation.
 * - `Durations` : panneau des durées de conservation, le chiffre à droite comme une distance.
 * - `Essentials` : panneau d'information à quatre lignes (« L'essentiel »). Pas de reflet
 *   balayé sur ce panneau : c'est un bloc de lecture (aucune lumière ne traverse le texte).
 *
 * Dans les lignes « libellé : valeur », le séparateur « : » reste dans le texte (lu par les
 * lecteurs d'écran, copié avec le texte) ; à l'écran, la mise en page le remplace.
 */
import type { ReactElement, ReactNode } from "react";
import { ToComplete } from "@/components/public/page-blocks";
import { Icon, type IconName } from "@/components/ui/icon";
import styles from "./legal.module.css";

const SEPARATOR = <span className="sr-only"> : </span>;

export function LegalSection({
  id,
  num,
  title,
  children,
}: {
  id: string;
  /** Numéro de la borne (décoratif). Sans numéro : le losange RNB AUTO. */
  num?: string;
  title: ReactNode;
  children: ReactNode;
}): ReactElement {
  return (
    <section id={id} data-sky="nuit" aria-labelledby={`${id}-titre`} className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.borne} aria-hidden="true">
          <span className={styles.borneCap} />
          <span className={styles.borneCapLit} />
          {num ? (
            <span className={styles.borneNum}>{num}</span>
          ) : (
            <Icon name="losange" size={16} strokeWidth={2.4} className={styles.borneIcon} />
          )}
        </span>
        <h2 id={`${id}-titre`} className={styles.sectionTitle}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

/**
 * « À COMPLÉTER » des pages légales : c'est désormais le `ToComplete` du socle, qui porte la
 * bordure de chantier à chevrons orange et noirs (F.9). Alias gardé pour les pages légales.
 */
export function Chantier({ label }: { label?: string }): ReactElement {
  return <ToComplete label={label} />;
}

export type TareRow = { key: string; label: string; value: ReactNode };

/** Plaque de tare : identité de l'éditeur, une ligne par information. */
export function TarePlate({ rows }: { rows: readonly TareRow[] }): ReactElement {
  return (
    <ul className={styles.tarePlate}>
      {rows.map((row) => (
        <li key={row.key} className={styles.tareRow}>
          <span className={styles.tareLabel}>{row.label}</span>
          {SEPARATOR}
          <span className={styles.tareValue}>{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

export type SignListItem = { key: string; icon: IconName; content: ReactNode };

/** Liste dont chaque ligne porte un petit panneau (pictogramme décoratif). */
export function SignList({ items }: { items: readonly SignListItem[] }): ReactElement {
  return (
    <ul className={styles.signList}>
      {items.map((item) => (
        <li key={item.key} className={styles.signListItem}>
          <span className={styles.signPicto} aria-hidden="true">
            <Icon name={item.icon} size={20} strokeWidth={2.2} />
          </span>
          <span className={styles.signListText}>{item.content}</span>
        </li>
      ))}
    </ul>
  );
}

export type DurationRow = {
  key: string;
  label: string;
  /** La fin de la phrase, après « : ». */
  text: ReactNode;
  /** Le chiffre affiché à droite (décor : la phrase le dit déjà). */
  figure: { value: number; unit: string };
};

/** Panneau des durées de conservation : chaque ligne est une phrase complète. */
export function Durations({ rows }: { rows: readonly DurationRow[] }): ReactElement {
  return (
    <ul className={styles.durations}>
      {rows.map((row) => (
        <li key={row.key} className={styles.durationRow}>
          <span className={styles.durationText}>
            <span className={styles.durationLabel}>{row.label}</span>
            {SEPARATOR}
            {row.text}
          </span>
          <span className={styles.durationFigure} aria-hidden="true">
            <span className={styles.durationNumber}>{row.figure.value}</span>
            <span className={styles.durationUnit}>{row.figure.unit}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export type EssentialItem = { key: string; icon: IconName; label: string; text: ReactNode };

/** « L'essentiel » : un panneau d'information à quatre lignes, sur ses poteaux. */
export function Essentials({ items }: { items: readonly EssentialItem[] }): ReactElement {
  return (
    <div>
      <div className={styles.essentials}>
        <ul className={styles.essentialsList}>
          {items.map((item) => (
            <li key={item.key} className={styles.essential}>
              <span className={styles.essentialPicto} aria-hidden="true">
                <Icon name={item.icon} size={22} strokeWidth={2.3} />
              </span>
              <div>
                <p className={styles.essentialLabel}>{item.label}</p>
                <p className={styles.essentialText}>{item.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.essentialsPosts} aria-hidden="true" />
    </div>
  );
}
