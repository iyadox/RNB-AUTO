/**
 * Les questions de /questions-frequentes, groupées par thème (docs/09, F.5).
 *
 * - `ThemeBar` : barre collante sous l'en-tête, un portique au-dessus de cinq voies. Ce sont des
 *   liens d'ancre (sans JavaScript) ; la voie du thème en cours est soulignée (`data-follow-section`).
 *   Aucun filtre animé.
 * - `ThemeSection` : une section par thème, avec son heure, sa plaque PK, son titre (montée des
 *   lignes), son objet de la route et ses questions.
 * - `QuestionList` : `<details>` natifs, une borne numérotée par question ; chaque question porte
 *   son identifiant d'ancre (`#prix-definitif`) et `data-faq-question` (voir faq-hash.tsx).
 *
 * Source unique : src/content/faq.ts (11 questions mot pour mot).
 */
import type { CSSProperties, ReactElement } from "react";
import type { SkyState } from "@/components/motion/types";
import { Plate } from "@/components/public/page-blocks";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { FAQ, FAQ_THEMES, type FaqItem, type FaqTheme } from "@/content/faq";
import styles from "./faq.module.css";
import { THEME_ART } from "./theme-art";

/** Identifiant d'ancre d'un thème (distinct des identifiants des questions « autoroute »…). */
export const themeAnchor = (theme: FaqTheme) => `theme-${theme}`;

/** Mise en scène de chaque thème : pictogramme du panneau, heure du ciel, disposition. */
const THEME_STAGING: Record<FaqTheme, { pictogram: IconName; sky: SkyState; layout: "split" | "wide" }> = {
  prix: { pictogram: "euro", sky: "nuit", layout: "split" },
  intervention: { pictogram: "wrench", sky: "nuit", layout: "split" },
  autoroute: { pictogram: "road", sky: "bleue", layout: "wide" },
  vehicules: { pictogram: "truck", sky: "bleue", layout: "wide" },
  "photos-position": { pictogram: "camera", sky: "bleue", layout: "split" },
};

/** Thèmes, dans l'ordre de la page, avec leurs questions et le numéro de la première. */
export function faqGroups() {
  let next = 1;
  return FAQ_THEMES.map((theme, index) => {
    const items = FAQ.filter((item) => item.theme === theme.id);
    const group = { ...theme, index, items, first: next };
    next += items.length;
    return group;
  });
}

const pad = (n: number) => String(n).padStart(2, "0");

export function ThemeBar({ id }: { id: string }): ReactElement {
  return (
    <nav id={id} aria-label="Thèmes des questions" className={styles.bar}>
      <div className={cn("mx-auto w-full max-w-7xl px-0 sm:px-6 lg:px-8", styles.barInner)}>
        <p className={cn(styles.barTag, "font-plate text-plate")}>
          <Icon name="question" size={18} strokeWidth={2.4} aria-hidden="true" />
          {FAQ.length} questions
        </p>
        <ol className={styles.lanes} data-lanes>
          {FAQ_THEMES.map((theme, index) => (
            <li key={theme.id}>
              <a href={`#${themeAnchor(theme.id)}`} data-follow-section className={styles.lane}>
                <span className={styles.laneNum} aria-hidden="true">
                  {pad(index + 1)}
                </span>
                {theme.label}
                <svg className={styles.laneArrow} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

function QuestionList({ items, first }: { items: readonly FaqItem[]; first: number }): ReactElement {
  return (
    // Les catadioptres des bornes s'allument en cascade à l'entrée (P15, décor seulement).
    <div className={styles.list} data-ignite>
      {items.map((item, index) => (
        // Un thème d'une seule question l'affiche ouverte : la réponse est là, sans geste.
        <details key={item.id} id={item.id} data-faq-question="" open={items.length === 1} className={styles.q}>
          <summary className={styles.qSummary}>
            <span className={styles.borne} aria-hidden="true">
              <span className={styles.borneReflector} data-light />
              <span className={styles.borneNum}>{pad(first + index)}</span>
            </span>
            <span className={styles.qText}>{item.q}</span>
            <span className={styles.qToggle} aria-hidden="true" />
          </summary>
          <div className={styles.qAnswer}>
            <p>{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export function ThemeSection({ group }: { group: ReturnType<typeof faqGroups>[number] }): ReactElement {
  const staging = THEME_STAGING[group.id];
  const Art = THEME_ART[group.id];
  const flip = group.index % 2 === 1;
  const count = group.items.length;
  return (
    <section
      id={themeAnchor(group.id)}
      data-sky={staging.sky}
      data-theme={group.id}
      aria-labelledby={`${themeAnchor(group.id)}-titre`}
      className={cn(styles.theme, styles[staging.layout], flip && styles.theme_flip)}
    >
      <span className={styles.ghost} data-parallax style={{ "--depth": 0.35 } as CSSProperties} aria-hidden="true">
        {pad(group.index + 1)}
      </span>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div data-reveal>
          <Plate pk={pad(group.index + 1)}>{count > 1 ? `${count} questions` : "1 question"}</Plate>
        </div>
        <div className={cn(styles.themeHead, "mt-4")}>
          <span className={styles.themeSign} aria-hidden="true" data-retro>
            <Icon name={staging.pictogram} size={30} strokeWidth={2.2} />
          </span>
          <h2 id={`${themeAnchor(group.id)}-titre`} data-split className={styles.themeTitle}>
            {group.label}
          </h2>
        </div>
        <div className={styles.themeBody}>
          <div className={styles.art} data-reveal>
            <Art />
          </div>
          <QuestionList items={group.items} first={group.first} />
        </div>
      </div>
    </section>
  );
}
