/**
 * Blocs communs des pages publiques (docs/09, D.8, F, H.2).
 *
 * - `OpeningShot` : l'ouverture de chaque page (plaque PK 00, titre principal, accroche, bouton,
 *   scène). Le titre, l'accroche et les actions sont visibles et immobiles dès la première image.
 * - `Section` : une section transparente sur le ciel, avec son heure (`data-sky`), sa plaque PK
 *   et son titre de niveau 2.
 * - `Plate` : la plaque « PK 03 · LE PRIX » (la partie « PK 03 · » est cachée aux lecteurs d'écran).
 * - `RelatedFaq`, `NextExit`, `DawnCta` : les fins de page (questions liées, prochaine sortie, aube).
 * - `Prose`, `ToComplete` : texte long et marqueur « À COMPLÉTER » (bordure de chantier).
 *
 * Titres (`OpeningShot`, `Section`, `RelatedFaq`, `DawnCta`, `NextExit`) : espace insécable avant
 * « ? ! : ; » et mots composés jamais coupés au trait d'union (« INTERVENONS-NOUS »), même quand
 * les lignes ne sont pas découpées (moins d'animations, niveau lite, sans JavaScript). Si un mot
 * composé est plus large que la colonne, la taille du titre s'ajuste pour qu'il tienne (`HeadingFit`).
 */
import Link from "next/link";
import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { faqItems } from "@/content/faq";
import { NEXT_EXIT } from "@/content/site-map";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { TowTruck } from "@/components/brand/tow-truck";
import { SharedMorph, type MorphName } from "@/components/motion/page-transition";
import type { SkyState } from "@/components/motion/types";
import { Skyline } from "@/components/scenes/base/skyline";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { ActionRow } from "./actions";
import { FaqAccordion } from "./faq-accordion";
import { GroundText } from "./ground-text";
import styles from "./blocks.module.css";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Typographie française : espace insécable avant « ? ! : ; » (le signe ne part jamais seul à la ligne). */
const frenchSpacing = (text: string) => text.replace(/\s+([?!:;»])/g, "\u00a0$1");

/** Un mot composé (lettres de part et d'autre d'un trait d'union) : « intervenons-nous », « Île-de-France ». */
const HYPHENATED = /([\p{L}\p{N}'’]+(?:-[\p{L}\p{N}]+)+)/u;

/**
 * Texte d'un titre : `frenchSpacing`, puis chaque mot composé dans un `<span>` insécable. Sans cela,
 * `text-wrap: balance` coupait « INTERVENONS- / NOUS ? » ou « ÎLE- / DE-FRANCE ? » quand les
 * lignes ne sont pas découpées par le runtime.
 */
function headingString(text: string): ReactNode {
  const spaced = frenchSpacing(text);
  const parts = spaced.split(HYPHENATED);
  if (parts.length === 1) return spaced;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={styles.keepWord}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Applique `headingString` aux textes d'un titre, y compris dans ses `<em>` (pas plus profond que nécessaire). */
function headingText(node: ReactNode): ReactNode {
  if (typeof node === "string") return headingString(node);
  if (Array.isArray(node)) return Children.map(node, headingText);
  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children !== undefined) {
    return cloneElement(node as ReactElement<{ children?: ReactNode }>, undefined, headingText(node.props.children));
  }
  return node;
}

/** Texte brut d'un titre (pour mesurer ses mots composés). */
function plainText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(plainText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return plainText(node.props.children);
  return "";
}

/**
 * Longueur, en caractères, du plus long bloc insécable qui contient un mot composé (ponctuation
 * collée par l'espace insécable comprise : « INTERVENONS-NOUS ? » = 18). 0 s'il n'y en a pas.
 */
function longestJoined(node: ReactNode): number {
  const units = frenchSpacing(plainText(node)).split(/[ \t\n]+/);
  return units.reduce((max, unit) => (HYPHENATED.test(unit) ? Math.max(max, unit.length) : max), 0);
}

/**
 * Enveloppe d'un titre qui contient un mot composé : une boîte de requête de conteneur, pour que
 * le titre réduise sa taille juste assez pour que son plus long bloc insécable tienne dans la
 * colonne (`--joined`, voir `.fit` dans blocks.module.css). Sans mot composé : le titre seul.
 */
function HeadingFit({ text, children }: { text: ReactNode; children: ReactElement }) {
  const joined = longestJoined(text);
  if (joined === 0) return children;
  return (
    <div className={styles.fit} style={{ "--joined": joined } as CSSProperties}>
      {children}
    </div>
  );
}

// ─── Plaque PK ────────────────────────────────────────────────────────────────

/**
 * Plaque « PK 03 · LE PRIX », avec sa petite borne à tête colorée (ou un pictogramme).
 *
 * « PK 03 · » ne se coupe jamais et ne reste jamais seul : si l'inscription ne tient pas sur une
 * ligne, elle passe à la ligne sous elle-même, en retrait (« PK 01 · LES SITUATIONS / COURANTES »).
 *
 * `pictogramStyle` : `solid` (carré plein de la couleur de la plaque), `outline` (au trait) ou
 * `auto` (par défaut) : au trait quand la section contient déjà le bouton principal jaune
 * (`PrimaryLink`, un seul aplat jaune par écran, B.1), plein sinon. Les plaques orange
 * (`beacon`, avertissement) restent pleines en `auto`.
 */
export function Plate({
  pk,
  children,
  tone = "signal",
  pictogram,
  pictogramStyle = "auto",
  className,
}: {
  pk?: string;
  children: ReactNode;
  tone?: "signal" | "beacon" | "chalk";
  /** Pictogramme devant la plaque (ouvertures). */
  pictogram?: IconName;
  pictogramStyle?: "auto" | "solid" | "outline";
  className?: string;
}) {
  return (
    <p className={cn(styles.plate, styles[`plate_${tone}`], className)}>
      {pictogram ? (
        <span className={styles.platePicto} data-picto={pictogramStyle} aria-hidden="true">
          <Icon name={pictogram} size={18} strokeWidth={2.4} />
        </span>
      ) : (
        <span className={styles.platePost} aria-hidden="true" />
      )}
      <span className={cn("font-plate text-plate", styles.plateText)}>
        {pk ? (
          <span className={styles.platePk} aria-hidden="true">
            PK {pk} ·{" "}
          </span>
        ) : null}
        <span className={styles.plateLabel}>{children}</span>
      </span>
    </p>
  );
}

// ─── Ouverture ────────────────────────────────────────────────────────────────

/**
 * L'ouverture de chaque page : plaque PK 00, titre principal, accroche, actions, scène.
 *
 * - `titleFit` : la taille du titre suit aussi la hauteur de l'écran sur ordinateur (12 vh) et la
 *   largeur de la colonne. Un titre de quatre lignes ne pousse plus le bouton hors du premier
 *   écran (1 024 × 768). Sous 1 024 px : 12,6 vw au plus (bouton au-dessus de 580 px à 390 × 664).
 * - `stage="tall"` : sous 1 024 px, scène haute de 60svh au plus (au lieu de 34svh).
 * - Sous 1 024 px, la scène peut déborder de 1,5rem de chaque côté : elle va jusqu'aux bords de
 *   l'écran avec une marge négative (`-mx-4`), sans être coupée à 16 px du bord.
 */
export function OpeningShot({
  pk = "00",
  eyebrow,
  pictogram,
  pictogramStyle = "auto",
  title,
  lead,
  actions,
  scene,
  sky = "minuit",
  layout = "split",
  titleFit = false,
  stage = "default",
  morphName,
  id = "ouverture",
}: {
  pk?: string;
  eyebrow: string;
  pictogram?: IconName;
  pictogramStyle?: "auto" | "solid" | "outline";
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  scene?: ReactNode;
  sky?: SkyState;
  layout?: "split" | "stacked" | "compact";
  titleFit?: boolean;
  stage?: "default" | "tall";
  morphName?: MorphName;
  id?: string;
}) {
  const plate = (
    <div className={styles.openingPlate}>
      <Plate pk={pk} pictogram={pictogram} pictogramStyle={pictogramStyle}>
        {eyebrow}
      </Plate>
    </div>
  );
  return (
    <section
      id={id}
      data-sky={sky}
      className={cn(styles.opening, styles[`opening_${layout}`], stage === "tall" && styles.opening_tallStage)}
    >
      <div className={cn(CONTAINER, styles.openingGrid)}>
        <div className={styles.openingText}>
          {morphName ? <SharedMorph name={morphName}>{plate}</SharedMorph> : plate}
          <HeadingFit text={title}>
            <h1 className={cn(styles.openingTitle, titleFit && styles.openingTitle_fit)}>{headingText(title)}</h1>
          </HeadingFit>
          {lead ? <p className={styles.openingLead}>{lead}</p> : null}
          {actions ? <div className={styles.openingActions}>{actions}</div> : null}
        </div>
        {scene && layout !== "compact" ? <div className={styles.openingScene}>{scene}</div> : null}
      </div>
      <div className={styles.edgeLine} aria-hidden="true" />
    </section>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

const WIDTHS = { default: CONTAINER, wide: "w-full px-4 sm:px-6 lg:px-8", reading: "mx-auto w-full max-w-3xl px-4 sm:px-6" };

export function Section({
  id,
  pk,
  label,
  sky = "nuit",
  title,
  split = false,
  intro,
  width = "default",
  children,
  className,
}: {
  id: string;
  /** Numéro de la plaque PK (« 03 »). */
  pk: string;
  /** Inscription de la plaque (« Le prix »). */
  label: string;
  sky?: SkyState;
  title?: ReactNode;
  /** Montée des lignes du titre (niveau `full` seulement). */
  split?: boolean;
  intro?: ReactNode;
  width?: "default" | "wide" | "reading";
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} data-sky={sky} className={cn("relative py-section", className)}>
      <div className={WIDTHS[width]}>
        <div data-reveal>
          <Plate pk={pk}>{label}</Plate>
        </div>
        {title ? (
          <HeadingFit text={title}>
            <h2 data-split={split ? "" : undefined} className={cn(styles.sectionTitle, "mt-4")}>
              {headingText(title)}
            </h2>
          </HeadingFit>
        ) : null}
        {intro ? (
          <p data-reveal className="text-lead mt-6 max-w-[60ch] text-pretty text-asphalt-200">
            {intro}
          </p>
        ) : null}
        <div className="mt-10 lg:mt-14">{children}</div>
      </div>
    </section>
  );
}

// ─── Questions liées ──────────────────────────────────────────────────────────

/**
 * Questions liées : le titre en tête, « Toutes les questions » à sa droite sur ordinateur, puis
 * les questions sur toute la largeur, numérotées comme des repères (décor). La mise en page ne
 * dépend pas du nombre de questions : avec une, deux ou trois, aucune colonne ne reste vide.
 */
export function RelatedFaq({ ids, title = "Vos questions, nos réponses." }: { ids: readonly string[]; title?: ReactNode }) {
  return (
    <section id="questions-liees" data-sky="nuit" className="relative py-section">
      <div className={cn(CONTAINER, styles.related)}>
        <div className={styles.relatedHead}>
          <div data-reveal>
            <Plate>Questions fréquentes</Plate>
          </div>
          <HeadingFit text={title}>
            <h2 className={cn(styles.relatedTitle, "mt-4")}>{headingText(title)}</h2>
          </HeadingFit>
        </div>
        <Link href="/questions-frequentes" className={cn(styles.textLink, styles.relatedLink)}>
          Toutes les questions
          <Icon name="arrowRight" size={18} strokeWidth={2.4} />
        </Link>
        <FaqAccordion items={faqItems(ids)} className={styles.relatedList} />
      </div>
    </section>
  );
}

// ─── Prochaine sortie ─────────────────────────────────────────────────────────

/** Marquage au sol de la bretelle de sortie : la voie se sépare, zébras entre les deux. */
function ExitGore() {
  return (
    <svg className={styles.exitGore} viewBox="0 0 1200 96" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <pattern id="exit-gore-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
          <rect width="5" height="14" fill="var(--color-chalk)" opacity="0.32" />
        </pattern>
        <clipPath id="exit-gore-clip">
          <path d="M760 96C900 96 1040 60 1200 6V96Z" />
        </clipPath>
      </defs>
      <path d="M0 95H1200" stroke="var(--color-chalk)" strokeOpacity="0.45" strokeWidth="2" />
      <path d="M0 52H1200" stroke="var(--color-chalk)" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="38 38" />
      <rect width="1200" height="96" fill="url(#exit-gore-hatch)" clipPath="url(#exit-gore-clip)" />
      <path d="M700 95C880 95 1030 56 1200 2" fill="none" stroke="var(--color-chalk)" strokeOpacity="0.55" strokeWidth="2.5" />
      <path d="M780 95C930 95 1060 62 1200 18" fill="none" stroke="var(--color-signal-500)" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="10 12" />
    </svg>
  );
}

/** « Prochaine sortie » : grand panneau de direction vers la page suivante (NEXT_EXIT). */
export function NextExit({ from }: { from: string }) {
  const exit = NEXT_EXIT[from];
  if (!exit) return null;
  return (
    <section
      data-sky="bleue"
      aria-label="Prochaine sortie"
      className="relative pb-[calc(var(--spacing-section)*0.5)] pt-[calc(var(--spacing-section)*0.6)]"
    >
      <div className={cn(CONTAINER, styles.exitMount)}>
        <span className={styles.exitPosts} aria-hidden="true" />
        <Link href={exit.href} data-retro className={cn(styles.exitSign, "group")}>
          <span className={styles.exitFrame} aria-hidden="true" />
          <span className={styles.exitBody}>
            <span className={styles.exitTab}>
              <Icon name="road" size={16} strokeWidth={2.4} aria-hidden="true" />
              Prochaine sortie
            </span>
            <span className="sr-only"> : </span>
            <span className={styles.exitTitle}>{headingText(exit.title)}</span>
            <span className={styles.exitHelp}>{exit.text}</span>
          </span>
          <svg className={styles.exitArrow} viewBox="0 0 64 64" aria-hidden="true">
            <path d="M16 48 46 18M22 16h26v26" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="square" />
          </svg>
        </Link>
        <ExitGore />
      </div>
    </section>
  );
}

// ─── Aube ─────────────────────────────────────────────────────────────────────

const DAWN_TEXT = "Votre estimation en moins d'une minute, confirmée avec vous avant l'intervention.";

/**
 * L'aube de fin de page : titre en jaune (faisceau au défilement), texte, actions visibles dès
 * l'entrée, et la scène — route en perspective vers l'aube, texte peint au sol (`ground`),
 * dépanneuse qui arrive et freine. `calm` : ni dépanneuse ni texte peint (/panne-autoroute).
 */
export function DawnCta({
  info,
  title,
  text = DAWN_TEXT,
  truck = "empty",
  ground = null,
  calm = false,
}: {
  info: PublicSiteInfo;
  title: string;
  text?: ReactNode;
  truck?: "loaded" | "empty" | "none";
  ground?: string | null;
  calm?: boolean;
}) {
  const showTruck = !calm && truck !== "none";
  return (
    <section data-sky="aube" className={styles.dawnCta}>
      <div className={cn(CONTAINER, "relative z-10")}>
        <HeadingFit text={title}>
          <h2 className={styles.dawnTitle}>
            <em data-beam="view" className="not-italic">
              {headingText(title)}
            </em>
          </h2>
        </HeadingFit>
        {text ? <p className={styles.dawnText}>{text}</p> : null}
        <ActionRow info={info} tone="dawn" className="mt-8 lg:mt-10" />
      </div>

      <div className={styles.dawnScene} aria-hidden="true" data-pause-offscreen>
        <div className={styles.dawnSky} />
        <div className={styles.dawnSun} />
        <Skyline layer="far" className={styles.dawnSkyline} />
        <div className={styles.dawnCrossRoad}>
          <span className={styles.dawnCrossDash} />
        </div>
        <GroundText text={calm ? null : ground} className={styles.dawnGround} />
        {showTruck ? (
          <div className={styles.dawnTruckLane} data-inview-once>
            <div className={styles.dawnTruckMover}>
              <div className={styles.dawnTruck}>
                <TowTruck loaded={truck === "loaded"} headlights id="dawn-truck" />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

// ─── Texte long et marqueur ───────────────────────────────────────────────────

/** Texte long (pages légales) : titres et paragraphes lisibles, 68 caractères au plus par ligne. */
export function Prose({ children }: { children: ReactNode }) {
  return <div className={styles.prose}>{children}</div>;
}

/**
 * Marqueur visible pour une information que RNB AUTO doit encore fournir : une zone de chantier,
 * bordure à chevrons orange et noirs (F.9), texte orange sur fond de nuit. Impossible à manquer,
 * jamais confondu avec une vraie donnée. Il laisse 0,5 em à la ponctuation qui le suit (le point
 * ne passe pas seul à la ligne).
 */
export function ToComplete({ label }: { label?: string }) {
  // Marqueur court (« À COMPLÉTER : email ») : jamais coupé. Dans un parent qui prend la largeur
  // de son contenu (élément flex, cellule), la place gardée pour la ponctuation le faisait passer
  // sur deux lignes (« À COMPLÉTER : / email »).
  const short = (label?.length ?? 0) <= 12;
  return (
    <span className={cn(styles.toComplete, short && styles.toComplete_short)}>
      <span className={styles.toCompleteFace}>À COMPLÉTER{label ? ` : ${label}` : ""}</span>
    </span>
  );
}
