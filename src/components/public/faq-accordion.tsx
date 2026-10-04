/**
 * P18 · Les questions (docs/09, C.5). `<details>` natif : fonctionne sans JavaScript.
 *
 * - Ouverture animée (260 ms) avec `interpolate-size` et `::details-content` quand le navigateur
 *   le permet, ouverture sèche sinon ; instantanée en « moins d'animations ».
 * - Le « + » tourne en « × » ; un trait jaune s'allume à gauche de la réponse ouverte.
 * - Zones de toucher de 56 px au moins.
 * - `anchors` : chaque question porte son identifiant (`/questions-frequentes#prix-definitif`).
 */
import type { FaqItem } from "@/content/faq";
import { cn } from "@/components/ui/cn";
import styles from "./blocks.module.css";

export function FaqAccordion({
  items,
  anchors = false,
  className,
}: {
  items: readonly FaqItem[];
  anchors?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(styles.faq, className)}>
      {items.map((item) => (
        <details key={item.id} id={anchors ? item.id : undefined} className={styles.faqItem}>
          <summary className={styles.faqQuestion}>
            <span className="text-pretty">{item.q}</span>
            <span className={styles.faqToggle} aria-hidden="true" />
          </summary>
          <div className={styles.faqAnswer}>
            <p>{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
