/**
 * PK 06 · « Vos questions, nos réponses. » (docs/09, E.8), `id="questions"`, ciel `bleue`.
 * Section calme : aucun décor animé. Les quatre questions marquées `home` dans la source unique
 * (`src/content/faq.ts`), et une borne kilométrique dessinée au bord de la route (statique).
 */
import Link from "next/link";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { Plate } from "@/components/public/page-blocks";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import { HOME_FAQ_IDS, faqItems } from "@/content/faq";
import styles from "./home-lower.module.css";

/** Borne kilométrique au tracé de la signalisation : tête jaune, fût clair, socle (décor). */
function Milestone() {
  return (
    <svg viewBox="0 0 120 200" className={styles.milestone} aria-hidden="true">
      <ellipse cx="60" cy="192" rx="54" ry="6" style={{ fill: "var(--color-night-950)" }} opacity="0.7" />
      <path d="M18 188V70a42 42 0 0 1 84 0v118Z" style={{ fill: "var(--color-asphalt-100)" }} />
      <path d="M18 70a42 42 0 0 1 84 0v12H18Z" style={{ fill: "var(--color-signal-500)" }} />
      <path d="M102 70v118h-10V76c0-20-10-34-26-40 20 2 36 16 36 34Z" style={{ fill: "var(--color-asphalt-300)" }} opacity="0.55" />
      <rect x="14" y="184" width="92" height="8" rx="2" style={{ fill: "var(--color-asphalt-600)" }} />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        style={{ fill: "var(--color-ink)", fontSize: 15, fontWeight: 800, letterSpacing: "0.12em" }}
      >
        PK
      </text>
      <text
        x="60"
        y="134"
        textAnchor="middle"
        className="font-figure"
        style={{ fill: "var(--color-ink)", fontSize: 46 }}
      >
        06
      </text>
      <path d="M32 152h56" style={{ stroke: "var(--color-ink)" }} strokeOpacity="0.25" strokeWidth="2" />
    </svg>
  );
}

export function FaqPreview() {
  return (
    <section id="questions" data-sky="bleue" aria-labelledby="questions-titre" className={cn(styles.section, styles.faqSection)}>
      <span className={styles.lane} aria-hidden="true" />
      <div className={cn(styles.container, styles.faqGrid)}>
        <div className={styles.faqHead}>
          <div data-reveal="">
            <Plate pk="06">Questions fréquentes</Plate>
          </div>
          <h2 id="questions-titre" data-split="" className={cn(styles.title, styles.faqTitle, "mt-5")}>
            Vos questions, <em>nos réponses.</em>
          </h2>
          <Link href="/questions-frequentes" className={cn(styles.textLink, "mt-6")}>
            Toutes les questions
            <Icon name="arrowRight" size={20} strokeWidth={2.4} />
          </Link>
        </div>
        <FaqAccordion items={faqItems(HOME_FAQ_IDS)} className={styles.faqList} />
      </div>

      {/* Bord de route : ligne de rive, balises et la borne PK 06 (décor statique). */}
      <div className={styles.roadside} aria-hidden="true">
        <svg className={styles.delineators} preserveAspectRatio="xMinYMax slice" viewBox="0 0 1600 80">
          <defs>
            <pattern id="faq-balises" width="200" height="80" patternUnits="userSpaceOnUse">
              <rect x="96" y="22" width="9" height="54" rx="2" style={{ fill: "var(--color-asphalt-200)" }} opacity="0.75" />
              <rect x="96" y="30" width="9" height="12" style={{ fill: "var(--color-night-950)" }} />
              <rect x="97.5" y="32" width="6" height="8" rx="1" style={{ fill: "var(--color-beacon-400)" }} opacity="0.85" />
            </pattern>
          </defs>
          <rect width="1600" height="80" fill="url(#faq-balises)" />
        </svg>
        <div className={cn(styles.container, styles.roadsideInner)}>
          <Milestone />
        </div>
      </div>
    </section>
  );
}
