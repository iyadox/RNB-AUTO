/**
 * Pages légales « L'entrée d'agglomération » (docs/09, F.9).
 *
 * `LegalShell` met en scène les trois pages légales de la même façon :
 * - l'ouverture : la plaque d'entrée d'agglomération porte le titre principal (craie, liseré
 *   sombre, jamais le rouge réglementaire), sur ses poteaux au bord de la route, sous un
 *   lampadaire au sodium, la ville au loin ; un panonceau donne le pictogramme et le surtitre ;
 * - le corps : le sommaire en mât de jalonnement (collant sur ordinateur, `<details>` sur
 *   mobile) et l'article, dont chaque section porte sa borne au bord de la ligne de rive ;
 * - la fin : la plaque de fin d'agglomération, barrée (décor), et le lien « Retour à l'accueil ».
 *
 * Mouvement (C.6, pages légales) : aucune animation sur le texte, aucun GSAP. La progression de
 * lecture (`RoadLine` sans repères), le sommaire actif (`data-follow-section`) et quelques
 * lumières en CSS seul : reflet des phares sur la plaque au chargement, tête des bornes qui
 * s'allume quand leur section passe au milieu de l'écran (niveau `full`).
 * Sans JavaScript et en « moins d'animations » : tout est à l'état final.
 */
import Link from "next/link";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { PageTransition } from "@/components/motion/page-transition";
import { RoadLine } from "@/components/public/road-line";
import { Skyline } from "@/components/scenes/base/skyline";
import { StreetLamps } from "@/components/scenes/base/street-lamps";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import styles from "./legal.module.css";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Une entrée du sommaire : l'ancre de la section, son libellé et le numéro de sa borne. */
export type TocEntry = { id: string; label: string; num?: string };

type LegalShellProps = {
  /** Surtitre du panonceau (« Informations légales »). */
  eyebrow: string;
  /** Pictogramme du panonceau : document, cadenas ou contrat. */
  pictogram: IconName;
  /** Titre principal, écrit sur la plaque. */
  title: string;
  lead?: ReactNode;
  toc: readonly TocEntry[];
  children: ReactNode;
};

export function LegalShell({ eyebrow, pictogram, title, lead, toc, children }: LegalShellProps): ReactElement {
  // Largeur du mot le plus long : la taille du titre s'y adapte (jamais de mot coupé).
  const fit = { "--fit": titleFit(title) } as CSSProperties;
  return (
    <>
      <RoadLine />
      <PageTransition>
        <section id="ouverture" data-sky="minuit" className={styles.opening}>
          <div className={cn(CONTAINER, styles.openGrid, !lead && styles.openGrid_solo)}>
            <div className={styles.signMount}>
              <div className={styles.signColumn}>
                <span className={styles.posts} aria-hidden="true" />
                <div className={styles.sign}>
                  <h1 className={styles.signTitle} style={fit}>{title}</h1>
                </div>
                <p className={styles.panonceau}>
                  <span className={styles.panonceauPicto} aria-hidden="true">
                    <Icon name={pictogram} size={18} strokeWidth={2.4} />
                  </span>
                  <span className="font-plate text-plate">{eyebrow}</span>
                </p>
              </div>
              <div className={styles.lamp} aria-hidden="true">
                <span className={styles.lampHalo} />
                <span className={styles.lampCone} />
                <span className={styles.lampPost} />
                <span className={styles.lampArm} />
                <span className={styles.lampHead} />
              </div>
            </div>

            <Roadside lamps />

            {lead ? (
              <div className={styles.lead}>
                <p className={styles.leadText}>{lead}</p>
              </div>
            ) : null}
          </div>
        </section>

        <div className={styles.body}>
          <div className={cn(CONTAINER, styles.bodyGrid)}>
            <nav aria-label="Sommaire" className={styles.tocDesktop}>
              <p className={cn(styles.tocHead, "font-plate text-plate")}>
                <span className={styles.tocHeadCap} aria-hidden="true" />
                Sommaire
              </p>
              <TocList toc={toc} />
            </nav>

            <details className={styles.tocMobile}>
              <summary className={styles.tocSummary}>
                <Icon name="list" size={20} strokeWidth={2.4} className="text-signal-400" />
                Sommaire
                <Icon name="chevronDown" size={20} strokeWidth={2.4} className={styles.tocSummaryChevron} />
              </summary>
              <nav aria-label="Sommaire" className={styles.tocMobileBody}>
                <TocList toc={toc} />
              </nav>
            </details>

            <article className={styles.article}>{children}</article>
          </div>
        </div>

        <section id="fin" data-sky="bleue" aria-label="Fin de la page" className={styles.end}>
          <div className={cn(CONTAINER, styles.endGrid)}>
            <div className={styles.endSign} aria-hidden="true">
              <span className={styles.endPosts} />
              <div className={styles.endPlate}>
                <p className={styles.endPlateText} style={fit}>{title}</p>
              </div>
            </div>
            <Roadside />
            <div className={styles.endAside}>
              <Link href="/" className={styles.homeBlade}>
                <span className={styles.homeBladeFace}>
                  <Icon name="arrowLeft" size={22} strokeWidth={2.6} className={styles.homeBladeIcon} />
                  Retour à l&apos;accueil
                </span>
              </Link>
            </div>
          </div>
        </section>
      </PageTransition>
    </>
  );
}

/**
 * Largeur relative du mot le plus long du titre, en « unités de lettre » de la police d'affichage
 * (Archivo, largeur 62, graisse 900, capitales). Compter les caractères ne suffit pas : « MENTIONS »
 * (M et N larges) est plus large que « CONFIDENTIALITÉ » par lettre, et se coupait à 390 px.
 * Lettres larges (M, W) : 1,3 ; étroites (I, J, L, T, F, apostrophe) : 0,75 ; les autres : 1.
 * Mesuré : une unité vaut entre 0,47 et 0,50 em ; le CSS compte 0,53 em (marge de sécurité).
 */
function titleFit(title: string): number {
  const width = (word: string) =>
    [...word.toUpperCase()].reduce((sum, char) => sum + (/[MW]/.test(char) ? 1.3 : /[IJLTF'’]/.test(char) ? 0.75 : 1), 0);
  return Math.round(Math.max(...title.split(/\s+/).map(width)) * 100) / 100;
}

/** Le bord de la route : la ville au loin, des lampadaires lointains, la chaussée mouillée. */
function Roadside({ lamps = false }: { lamps?: boolean }) {
  return (
    <div className={styles.road} aria-hidden="true">
      <div className={styles.backdrop}>
        <div className={styles.backdropGlow} />
        <Skyline layer="far" className={styles.backdropSkyline} />
        {lamps ? <StreetLamps count={4} reflection={false} className={styles.backdropLamps} /> : null}
      </div>
      <div className={styles.roadSurface} />
    </div>
  );
}

/** Les lames du mât : de vrais liens d'ancre, la section en cours reçoit `aria-current`. */
function TocList({ toc }: { toc: readonly TocEntry[] }) {
  return (
    <div className={styles.tocMast}>
      <ol className={styles.tocList}>
        {toc.map((entry) => (
          <li key={entry.id} className={styles.tocItem}>
            <a href={`#${entry.id}`} data-follow-section className={styles.blade}>
              <span className={styles.bladeFace}>
                <span className={styles.bladeNum} aria-hidden="true">
                  {entry.num ?? <Icon name="losange" size={14} strokeWidth={2.4} />}
                </span>
                <span>{entry.label}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
