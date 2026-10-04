/**
 * PK 06 · « Vos questions, nos réponses. » (docs/09, E.8), `id="questions"`, ciel `bleue`.
 * Section calme : aucun décor animé. Les quatre questions marquées `home` dans la source unique
 * (`src/content/faq.ts`), et une borne kilométrique dessinée au bord de la route (statique,
 * `lower/roadside.tsx`). Ordinateur : titre sur deux lignes, « Toutes les questions » à sa
 * droite, questions sur toute la largeur.
 */
import Link from "next/link";
import { FaqAccordion } from "@/components/public/faq-accordion";
import { Plate } from "@/components/public/page-blocks";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import { HOME_FAQ_IDS, faqItems } from "@/content/faq";
import styles from "./home-lower.module.css";
import { Roadside } from "./lower/roadside";

export function FaqPreview() {
  return (
    <section id="questions" data-sky="bleue" aria-labelledby="questions-titre" className={cn(styles.section, styles.faqSection)}>
      <span className={styles.lane} aria-hidden="true" />
      <div className={cn(styles.container, styles.faqGrid)}>
        <div data-reveal="" className={styles.faqPlate}>
          <Plate pk="06">Questions fréquentes</Plate>
        </div>
        <h2 id="questions-titre" data-split="" className={cn(styles.title, styles.faqTitle)}>
          Vos questions, <em>nos réponses.</em>
        </h2>
        <Link href="/questions-frequentes" className={cn(styles.textLink, styles.faqAll)}>
          Toutes les questions
          <Icon name="arrowRight" size={20} strokeWidth={2.4} />
        </Link>
        <FaqAccordion items={faqItems(HOME_FAQ_IDS)} className={styles.faqList} />
      </div>

      {/* Bord de route : ligne de rive, balises et la borne PK 06 (décor statique). */}
      <Roadside />
    </section>
  );
}
