/**
 * /entreprise, PK 02 « Ce sur quoi vous pouvez compter » (docs/09, F.6) : les six engagements
 * existants, mot pour mot, en grandes lignes.
 *
 * Chaque ligne est un panneau de bord de route : un panneau rond (pictogramme jaune, orange pour
 * la sécurité) qui s'éclaire quand la ligne traverse le milieu de l'écran, le reflet
 * rétroréfléchissant (P6) qui passe sur le panneau, et un marquage en tirets qui se trace dessous.
 * Les lignes montent à l'entrée (P2). Sans JavaScript et en `off` : tout est allumé et en place.
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import styles from "./entreprise.module.css";

const PLEDGES: { icon: IconName; title: string; text: string; safety?: boolean }[] = [
  { icon: "euro", title: "Un prix clair", text: "Une estimation avant la demande, un prix confirmé avant l'intervention." },
  { icon: "phone", title: "Un interlocuteur direct", text: "Vous parlez à RNB AUTO, sans plateforme intermédiaire." },
  { icon: "route", title: "Le vrai trajet", text: "Les distances sont calculées sur les routes, pas à vol d'oiseau." },
  { icon: "shield", title: "Votre véhicule protégé", text: "Chargement soigné sur plateau, état du véhicule vérifié avec vous." },
  { icon: "clock", title: "Une réponse rapide", text: "Appel, WhatsApp ou demande en ligne : nous vous rappelons vite." },
  {
    icon: "alert",
    title: "La sécurité d'abord",
    text: "Sur l'autoroute, nous vous orientons vers le dépanneur agréé puis prenons le relais.",
    safety: true,
  },
];

/** Espace insécable avant « ? ! : ; » (le signe ne part jamais seul à la ligne). */
const frenchSpacing = (text: string) => text.replace(/\s+([?!:;])/g, "\u00a0$1");

export function Commitments(): ReactElement {
  return (
    <div className={styles.pledgesWrap}>
      <span className={styles.pledgesBeam} aria-hidden="true" />
      <ul className={styles.pledges}>
        {PLEDGES.map((pledge, index) => (
          <li
            key={pledge.title}
            data-reveal=""
            data-reveal-step={String((index % 2) + 1)}
            className={cn(styles.pledge, pledge.safety && styles.pledgeSafety)}
          >
            {/* Le reflet rétroréfléchissant (P6) passe sur le panneau rond, pas sur toute la ligne :
                c'est le panneau qui renvoie la lumière des phares, et le texte reste net. */}
            <span className={styles.pledgeSignWrap} aria-hidden="true">
              <span className={styles.pledgeGlow} />
              <span className={styles.pledgeSign} data-retro="">
                <Icon name={pledge.icon} size={28} strokeWidth={2.2} />
              </span>
            </span>
            <h3 className={styles.pledgeTitle}>{pledge.title}</h3>
            <p className={styles.pledgeText}>{frenchSpacing(pledge.text)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
