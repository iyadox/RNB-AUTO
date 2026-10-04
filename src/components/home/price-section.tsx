/**
 * PK 03 · « Le prix avant le départ. » (docs/09, E.5), `id="prix"`, ciel de nuit.
 *
 * À gauche : texte existant, trois garanties en plaques compactes, « Calculer mon prix ».
 * À droite (dessous sur mobile) : la fenêtre de rue, le sélecteur « Quand ? » et LE ticket
 * d'estimation (exemple calculé par le moteur côté serveur, tampon « EXEMPLE », lignes sans
 * montant, compteur). Sans exemple : « Votre prix en moins d'une minute », sans sélecteur.
 */
import type { CSSProperties } from "react";
import { PrimaryLink } from "@/components/public/actions";
import { Plate } from "@/components/public/page-blocks";
import { EstimateTicket } from "@/components/scenes/kit/estimate-ticket";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import type { HomePriceExamples } from "@/server/site/price-examples";
import { HOME_EXAMPLE_DESCRIPTION, type PublicSiteInfo } from "@/server/site/public-info";
import { exampleFootnote } from "./lower/example-footnote";
import { StreetWindow } from "./lower/street-window";
import { PriceMomentPicker } from "./price-moment-picker";
import styles from "./home-lower.module.css";

const GUARANTEES: { icon: IconName; text: string }[] = [
  { icon: "clock", text: "Estimation en moins d'une minute, sur votre téléphone" },
  { icon: "shield", text: "Prix confirmé par téléphone avant l'intervention" },
  { icon: "route", text: "Distance réelle calculée sur les routes, pas à vol d'oiseau" },
];

export function PriceSection({ info, examples }: { info: PublicSiteInfo; examples: HomePriceExamples | null }) {
  const scene = <StreetWindow id="prix-rue" />;
  const vehicle = HOME_EXAMPLE_DESCRIPTION.vehicle.toLowerCase();
  // Repli : si les trois exemples ne sont pas disponibles, l'exemple des informations du site
  // (même calcul du moteur, même réglage d'affichage) reste montré, sans sélecteur.
  const fallback = info.examplePrice;
  return (
    <section id="prix" data-sky="nuit" aria-labelledby="prix-titre" className={cn(styles.section, styles.priceSection)}>
      <span className={styles.lane} aria-hidden="true" />
      <div className={cn(styles.container, styles.priceGrid)}>
        <div className={styles.priceText}>
          <div data-reveal="">
            <Plate pk="03">Prix transparent</Plate>
          </div>
          <h2 id="prix-titre" data-split="" className={cn(styles.title, "mt-5")}>
            Le prix avant <em>le départ.</em>
          </h2>
          <p data-reveal="" className={cn(styles.lead, "mt-7")}>
            Notre calculateur tient compte de votre position, de la destination, de votre véhicule, de la situation et de
            l&apos;horaire. Vous voyez une estimation claire, que nous confirmons avec vous avant d&apos;intervenir.
          </p>
          <ul className={styles.guarantees}>
            {GUARANTEES.map((item, index) => (
              <li
                key={item.text}
                data-reveal=""
                data-reveal-step={index ? String(index + 1) : undefined}
                data-retro=""
                className={styles.guarantee}
                style={{ "--i": index } as CSSProperties}
              >
                <span className={styles.guaranteePicto} aria-hidden="true">
                  <Icon name={item.icon} size={22} strokeWidth={2.2} />
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
          <PrimaryLink href="/demande" className="mt-9 w-full sm:w-auto">
            Calculer mon prix
          </PrimaryLink>
        </div>

        <div className={styles.priceVisual}>
          {examples ? (
            <PriceMomentPicker examples={examples} vehicle={vehicle} scene={scene} />
          ) : (
            <div className={styles.stage} data-moment="day">
              <div className={styles.window} data-inview-once="">
                {scene}
              </div>
              <div className={styles.ticketSlot}>
                {fallback ? (
                  <EstimateTicket
                    priceCents={fallback.priceTtcCents}
                    priceLabel="Total estimé TTC"
                    lines={fallback.includedLabels}
                    stamp="exemple"
                    footnote={exampleFootnote(HOME_EXAMPLE_DESCRIPTION, vehicle)}
                    className={styles.ticket}
                  />
                ) : (
                  <EstimateTicket
                    priceCents={null}
                    lines={[]}
                    footnote="Confirmé par téléphone avant le départ."
                    className={styles.ticket}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
