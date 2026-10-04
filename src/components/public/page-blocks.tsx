/**
 * Blocs communs des pages publiques (docs/09, D.8, F, H.2).
 *
 * - `OpeningShot` : l'ouverture de chaque page (plaque PK 00, titre principal, accroche, bouton,
 *   scène). Le titre, l'accroche et les actions sont visibles et immobiles dès la première image.
 * - `Section` : une section transparente sur le ciel, avec son heure (`data-sky`), sa plaque PK
 *   et son titre de niveau 2.
 * - `Plate` : la plaque « PK 03 · LE PRIX » (la partie « PK 03 · » est cachée aux lecteurs d'écran).
 * - `RelatedFaq`, `NextExit`, `DawnCta` : les fins de page (questions liées, prochaine sortie, aube).
 * - `Prose`, `ToComplete` : texte long et marqueur « À COMPLÉTER ».
 *
 * `PageHero`, `FeatureGrid`, `Steps` et `CtaBand` (et l'ancienne forme de `Section`) restent
 * exportés pour les pages pas encore migrées, avec le nouveau style. Ils disparaissent en L9.
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
import { StreetLamps } from "@/components/scenes/base/street-lamps";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { ActionRow } from "./actions";
import { FaqAccordion } from "./faq-accordion";
import { GroundText } from "./ground-text";
import styles from "./blocks.module.css";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Typographie française : espace insécable avant « ? ! : ; » (le signe ne part jamais seul à la ligne). */
const frenchSpacing = (text: string) => text.replace(/\s+([?!:;»])/g, "\u00a0$1");

/** Applique `frenchSpacing` aux textes d'un titre, y compris dans ses `<em>` (pas plus profond que nécessaire). */
function withFrenchSpacing(node: ReactNode): ReactNode {
  if (typeof node === "string") return frenchSpacing(node);
  if (Array.isArray(node)) return Children.map(node, withFrenchSpacing);
  if (isValidElement<{ children?: ReactNode }>(node) && node.props.children !== undefined) {
    return cloneElement(node as ReactElement<{ children?: ReactNode }>, undefined, withFrenchSpacing(node.props.children));
  }
  return node;
}

// ─── Plaque PK ────────────────────────────────────────────────────────────────

/** Plaque « PK 03 · LE PRIX », avec sa petite borne à tête colorée. */
export function Plate({
  pk,
  children,
  tone = "signal",
  pictogram,
  className,
}: {
  pk?: string;
  children: ReactNode;
  tone?: "signal" | "beacon" | "chalk";
  /** Pictogramme dans un carré jaune, devant la plaque (ouvertures). */
  pictogram?: IconName;
  className?: string;
}) {
  return (
    <p className={cn(styles.plate, styles[`plate_${tone}`], className)}>
      {pictogram ? (
        <span className={styles.platePicto} aria-hidden="true">
          <Icon name={pictogram} size={18} strokeWidth={2.4} />
        </span>
      ) : (
        <span className={styles.platePost} aria-hidden="true" />
      )}
      <span className="font-plate text-plate">
        {pk ? <span aria-hidden="true">PK {pk} · </span> : null}
        {children}
      </span>
    </p>
  );
}

// ─── Ouverture ────────────────────────────────────────────────────────────────

export function OpeningShot({
  pk = "00",
  eyebrow,
  pictogram,
  title,
  lead,
  actions,
  scene,
  sky = "minuit",
  layout = "split",
  morphName,
  id = "ouverture",
}: {
  pk?: string;
  eyebrow: string;
  pictogram?: IconName;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  scene?: ReactNode;
  sky?: SkyState;
  layout?: "split" | "stacked" | "compact";
  morphName?: MorphName;
  id?: string;
}) {
  const plate = (
    <div className={styles.openingPlate}>
      <Plate pk={pk} pictogram={pictogram}>
        {eyebrow}
      </Plate>
    </div>
  );
  return (
    <section id={id} data-sky={sky} className={cn(styles.opening, styles[`opening_${layout}`])}>
      <div className={cn(CONTAINER, styles.openingGrid)}>
        <div className={styles.openingText}>
          {morphName ? <SharedMorph name={morphName}>{plate}</SharedMorph> : plate}
          <h1 className={styles.openingTitle}>{withFrenchSpacing(title)}</h1>
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

type SectionProps = {
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
};

/** @deprecated Ancienne forme (`eyebrow`, `tone`), gardée jusqu'à la migration des pages (L9). */
type LegacySectionProps = {
  eyebrow?: string;
  title?: ReactNode;
  tone?: "dark" | "darker" | "light";
  children: ReactNode;
  className?: string;
};

const WIDTHS = { default: CONTAINER, wide: "w-full px-4 sm:px-6 lg:px-8", reading: "mx-auto w-full max-w-3xl px-4 sm:px-6" };

export function Section(props: SectionProps | LegacySectionProps) {
  if (!("label" in props)) {
    const { eyebrow, title, children, className } = props;
    return (
      <section data-sky="nuit" className={cn("relative py-section", className)}>
        <div className={CONTAINER}>
          {eyebrow ? (
            <div data-reveal>
              <Plate>{eyebrow}</Plate>
            </div>
          ) : null}
          {title ? (
            <h2 className={cn(styles.sectionTitle, "mt-4")} data-reveal>
              {title}
            </h2>
          ) : null}
          <div className={title || eyebrow ? "mt-10 lg:mt-14" : undefined}>{children}</div>
        </div>
      </section>
    );
  }
  const { id, pk, label, sky = "nuit", title, split = false, intro, width = "default", children, className } = props;
  return (
    <section id={id} data-sky={sky} className={cn("relative py-section", className)}>
      <div className={WIDTHS[width]}>
        <div data-reveal>
          <Plate pk={pk}>{label}</Plate>
        </div>
        {title ? (
          <h2 data-split={split ? "" : undefined} className={cn(styles.sectionTitle, "mt-4")}>
            {withFrenchSpacing(title)}
          </h2>
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

export function RelatedFaq({ ids, title = "Vos questions, nos réponses." }: { ids: readonly string[]; title?: ReactNode }) {
  return (
    <section id="questions-liees" data-sky="nuit" className="relative py-section">
      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-12 lg:gap-8")}>
        <div className="lg:col-span-4">
          <div data-reveal>
            <Plate>Questions fréquentes</Plate>
          </div>
          <h2 className={cn(styles.relatedTitle, "mt-4")}>{withFrenchSpacing(title)}</h2>
          <Link href="/questions-frequentes" className={cn(styles.textLink, "mt-6")}>
            Toutes les questions
            <Icon name="arrowRight" size={18} strokeWidth={2.4} />
          </Link>
        </div>
        <FaqAccordion items={faqItems(ids)} className="lg:col-span-8" />
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
    <section data-sky="bleue" className="relative pb-[calc(var(--spacing-section)*0.5)] pt-[calc(var(--spacing-section)*0.6)]">
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
            <span className={styles.exitTitle}>{exit.title}</span>
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
  // Typographie française : le « ? » ne part jamais seul à la ligne.
  const dawnTitle = frenchSpacing(title);
  return (
    <section data-sky="aube" className={styles.dawnCta}>
      <div className={cn(CONTAINER, "relative z-10")}>
        <h2 className={styles.dawnTitle}>
          <em data-beam="view" className="not-italic">
            {dawnTitle}
          </em>
        </h2>
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

/** Marqueur visible, style chantier, pour une information que RNB AUTO doit encore fournir. */
export function ToComplete({ label }: { label?: string }) {
  return (
    <span className={styles.toComplete}>
      <span className={styles.toCompleteStripe} aria-hidden="true" />
      <span>À COMPLÉTER{label ? ` : ${label}` : ""}</span>
    </span>
  );
}

// ─── Anciens blocs (pages pas encore migrées) ─────────────────────────────────

/**
 * @deprecated Remplacé par `OpeningShot` (lots de pages). Gardé jusqu'à L9 avec le nouveau style :
 * une rue de nuit en fond, titre et bouton immobiles dès la première image.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  icon,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  icon?: IconName;
  children?: ReactNode;
}) {
  return (
    <section data-sky="minuit" className={cn(styles.opening, styles.opening_legacy)}>
      <div className={styles.legacyStreet} aria-hidden="true">
        <Skyline layer="far" className={styles.legacySkyline} />
        <StreetLamps count={3} className={styles.legacyLamps} />
      </div>
      <div className={cn(CONTAINER, "relative")}>
        <div className={styles.openingText}>
          <div className={styles.openingPlate}>
            <Plate pictogram={icon}>{eyebrow}</Plate>
          </div>
          <h1 className={styles.openingTitle}>{title}</h1>
          {lead ? <p className={styles.openingLead}>{lead}</p> : null}
          {children ? <div className={styles.openingActions}>{children}</div> : null}
        </div>
      </div>
      <div className={styles.edgeLine} aria-hidden="true" />
    </section>
  );
}

/** @deprecated Liste de plaques d'information, remplacée par les objets de chaque page (L9). */
export function FeatureGrid({
  items,
}: {
  items: { icon: IconName; title: string; text: ReactNode }[];
  tone?: "dark" | "light";
}) {
  return (
    <ul className={styles.legacyGrid}>
      {items.map((item, index) => (
        <li
          key={item.title}
          data-reveal
          data-reveal-step={String((index % 3) + 1)}
          data-retro
          className={styles.legacyPlaque}
        >
          <span className={styles.legacyIcon} aria-hidden="true">
            <Icon name={item.icon} size={22} strokeWidth={2.2} />
          </span>
          <h3 className="font-step mt-5 text-[1.375rem] leading-tight text-chalk">{item.title}</h3>
          <div className="text-body mt-2 text-asphalt-300">{item.text}</div>
        </li>
      ))}
    </ul>
  );
}

/** @deprecated Étapes sur des bornes, remplacées par les routes d'étapes des pages (L9). */
export function Steps({ steps }: { steps: { title: string; text: ReactNode }[] }) {
  return (
    <ol className={styles.legacySteps}>
      {steps.map((step, index) => (
        <li
          key={step.title}
          data-reveal
          data-reveal-step={String(Math.min(index + 1, 3))}
          className={styles.legacyStep}
          style={{ "--i": index } as CSSProperties}
        >
          <span className={styles.borne} aria-hidden="true">
            <span className="font-figure">{String(index + 1).padStart(2, "0")}</span>
          </span>
          <div>
            <h3 className="font-step text-[1.375rem] leading-tight text-chalk">{step.title}</h3>
            <div className="text-body mt-2 text-asphalt-300">{step.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** @deprecated Remplacé par `DawnCta` (l'aube propre à chaque page). */
export function CtaBand({ info, title = "Besoin d'une dépanneuse maintenant ?" }: { info: PublicSiteInfo; title?: string }) {
  return <DawnCta info={info} title={title} truck="empty" />;
}
