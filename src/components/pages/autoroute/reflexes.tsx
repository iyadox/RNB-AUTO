/**
 * Les quatre bons réflexes sur l'autoroute (textes existants, mot pour mot).
 *
 * Contenu de sécurité : AUCUNE animation, aucune apparition, aucun reflet (docs/09, F.4). Les
 * numéros sont grands et immobiles ; ils sont posés sur une glissière (le fil de la liste), et
 * chaque catadioptre de la glissière marque un réflexe. Le réflexe 4 contient le lien d'appel
 * du 112, numéro d'urgence européen (recommandation officielle générale, à faire valider : G.4).
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import styles from "./autoroute.module.css";

const SAFETY: { title: string; text: string; icon: IconName }[] = [
  {
    title: "Feux de détresse",
    text: "Allumez-les immédiatement et garez-vous le plus à droite possible, sur la bande d'arrêt d'urgence.",
    icon: "hazard",
  },
  {
    title: "Gilet avant de sortir",
    text: "Enfilez votre gilet jaune dans le véhicule, puis sortez du côté opposé à la circulation.",
    icon: "vest",
  },
  {
    title: "Derrière la glissière",
    text: "Faites passer tous les passagers derrière la glissière de sécurité. Ne restez jamais dans le véhicule ni devant.",
    icon: "guardrail",
  },
  {
    title: "Appelez les secours",
    text: "Utilisez une borne orange d'appel d'urgence (tous les 2 km) ou composez le 112. Ils envoient le dépanneur agréé.",
    icon: "callbox",
  },
];

export function Reflexes({ className }: { className?: string }): ReactElement {
  return (
    <div className={cn(styles.reflexes, className)}>
      <h2 className={styles.reflexesTitle}>
        <span className={styles.reflexesKicker}>Les bons réflexes</span>
        <span className="sr-only"> : </span>
        <span>Que faire tout de suite&nbsp;?</span>
      </h2>
      <ol className={styles.reflexList}>
        {SAFETY.map((item, index) => (
          <li key={item.title} className={styles.reflex}>
            <span className={cn(styles.reflexNumber, "font-figure")} aria-hidden="true">
              {index + 1}
            </span>
            <div className={styles.reflexBody}>
              <h3 className={styles.reflexTitle}>
                <span className={styles.reflexIcon} aria-hidden="true">
                  <Icon name={item.icon} size={20} strokeWidth={2.2} />
                </span>
                {item.title}
              </h3>
              <p className={styles.reflexText}>{item.text}</p>
              {index === 3 ? (
                <a href="tel:112" className={styles.call112}>
                  <Icon name="phone" size={20} strokeWidth={2.4} aria-hidden="true" />
                  <span>Appeler le 112</span>
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
