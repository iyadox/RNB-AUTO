/**
 * E.3 · Le carrefour « Où en êtes-vous ? » (docs/09, PK 01), deuxième écran de l'accueil.
 *
 * Quatre panneaux de direction (des liens), dont UN seul jaune : « Mon prix maintenant ».
 * Derrière eux, la ligne médiane de la route descend du portique et se divise vers chaque
 * panneau (CSS, tracée une fois à l'entrée) ; une dépanneuse vue de dessus descend la route avec
 * le défilement (niveau `full`, CSS seul). Chaque panneau reçoit le reflet rétroréfléchissant
 * au passage (P6) et devient la plaque d'ouverture de la page d'arrivée (morph, D.4).
 * Sans JavaScript et en `off` : tout est tracé, la dépanneuse est arrivée à la jonction.
 */
import type { CSSProperties } from "react";
import { whatsappHref, whatsappRequestMessage } from "@/core/contact";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { CallLink } from "@/components/public/actions";
import { Plate } from "@/components/public/page-blocks";
import { DirectionSign } from "@/components/scenes/kit/direction-sign";
import { TruckTopGlyph } from "@/components/scenes/kit/glyphs";
import { WhatsAppIcon } from "@/components/ui/icon";
import { HydrateLater } from "@/components/ui/hydrate-later";
import styles from "./home.module.css";

const SIGNS = [
  {
    href: "/depannage",
    title: "Dépannage sur place",
    subtitle: "Batterie, crevaison, petite panne",
    arrow: "left",
    pictogram: "battery",
    tone: "night",
    morph: "vt-sign-depannage",
  },
  {
    href: "/remorquage",
    title: "Remorquage",
    subtitle: "Accident, véhicule non roulant, parking",
    arrow: "up",
    pictogram: "truck",
    tone: "night",
    morph: "vt-sign-remorquage",
  },
  {
    href: "/panne-autoroute",
    title: "Sur l'autoroute ?",
    subtitle: "Votre sécurité d'abord, puis le relais à la sortie",
    arrow: "up-right",
    pictogram: "hazard",
    tone: "beacon",
    morph: "vt-sign-autoroute",
  },
  {
    href: "/demande",
    title: "Mon prix maintenant",
    subtitle: "Estimation en moins d'une minute",
    arrow: "right",
    pictogram: "ticket",
    tone: "signal",
    morph: "vt-sign-demande",
  },
] as const;

export function Crossroads({ info }: { info: PublicSiteInfo }) {
  return (
    <section id="carrefour" data-sky="minuit" className={styles.crossroads}>
      <div className={styles.container}>
        <div data-reveal>
          <Plate pk="01">Votre situation</Plate>
        </div>
        <h2 data-split className={`${styles.sectionTitle} mt-4`}>
          Où en êtes-vous{" "}?
        </h2>

        {/* Le titre découpé reste dans le passage principal ; le carrefour est hydraté ensuite. */}
        <HydrateLater>
          <div className={styles.junction} data-inview-once="">
            <div className={styles.junctionTruck} aria-hidden="true">
              <div className={styles.junctionTruckCar}>
                <svg viewBox="-40 -40 80 80">
                  <g transform="rotate(90)">
                    <TruckTopGlyph headlights />
                  </g>
                </svg>
              </div>
            </div>
            <ul className={styles.signs}>
              {SIGNS.map((sign, index) => (
                <li
                  key={sign.href}
                  className={`${styles.slot} ${sign.tone === "signal" ? styles.slotSignal : ""}`}
                  style={{ "--i": index } as CSSProperties}
                >
                  <DirectionSign
                    href={sign.href}
                    title={sign.title}
                    subtitle={sign.subtitle}
                    arrow={sign.arrow}
                    pictogram={sign.pictogram}
                    tone={sign.tone}
                    morphName={sign.morph}
                    className={styles.signRail}
                  />
                </li>
              ))}
            </ul>
          </div>

          <CallAlternative info={info} />
        </HydrateLater>
      </div>
    </section>
  );
}

/** « Plus rapide : appelez-nous » et le numéro ; sinon WhatsApp ; sinon rien. */
function CallAlternative({ info }: { info: PublicSiteInfo }) {
  if (info.phone) {
    return (
      <div className={styles.callLine}>
        <p className={styles.callLineLabel}>
          Plus rapide{"\u00a0"}: <span className="whitespace-nowrap">appelez-nous</span>
        </p>
        <CallLink phone={info.phone} size="lg" />
      </div>
    );
  }
  if (info.whatsapp) {
    return (
      <div className={styles.callLine}>
        <a href={whatsappHref(info.whatsapp.e164, whatsappRequestMessage({}))} className={styles.waLink}>
          <WhatsAppIcon size={20} />
          Écrire sur WhatsApp
        </a>
      </div>
    );
  }
  return null;
}
