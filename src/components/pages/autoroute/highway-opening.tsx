/**
 * /panne-autoroute, PK 00 · ouverture (docs/09, F.4).
 *
 * Plaque orange, titre principal et accroche (réglage) immobiles dès la première image (la plaque
 * et le titre sont l'arrivée du panneau orange du carrefour, `vt-sign-autoroute`) ; juste
 * dessous, les quatre réflexes (dans le premier écran mobile) ; puis le lien secondaire vers
 * la demande de relais. PAS de bouton RNB AUTO en tête : la sécurité d'abord.
 * Ordinateur : réflexes à gauche, la bande d'arrêt d'urgence à droite (scène collante, CSS
 * seul). Mobile : la scène vient après les réflexes, en pleine largeur.
 */
import Link from "next/link";
import type { ReactElement } from "react";
import { SharedMorph } from "@/components/motion/page-transition";
import { Plate } from "@/components/public/page-blocks";
import { Icon } from "@/components/ui/icon";
import { Reflexes } from "./reflexes";
import { ShoulderScene } from "./shoulder-scene";
import styles from "./autoroute.module.css";

export function HighwayOpening({ lead }: { lead: string }): ReactElement {
  return (
    <section id="ouverture" data-sky="bleue" className={styles.opening}>
      <div className={styles.openingGrid}>
        <div className={styles.openingText}>
          {/* Le panneau orange « Sur l'autoroute ? » du carrefour de l'accueil devient cet en-tête
              (plaque orange et titre principal, morph D.4). */}
          <SharedMorph name="vt-sign-autoroute">
            <div className={styles.openingHead}>
              <Plate pk="00" tone="beacon" pictogram="hazard">
                Panne sur autoroute
              </Plate>
              <h1 className={styles.title}>
                Votre sécurité <em>d&apos;abord.</em>
              </h1>
            </div>
          </SharedMorph>
          <p className={styles.lead}>{lead}</p>
          <Reflexes />
          <Link href="/demande?autoroute=1" className={styles.relayLink}>
            <span>Votre véhicule est déjà sorti&nbsp;?</span>{" "}
            <span className={styles.relayLinkAction}>
              Demander le relais
              <Icon name="arrowRight" size={18} strokeWidth={2.6} aria-hidden="true" />
            </span>
          </Link>
        </div>
        <div className={styles.openingScene} data-loops-nojs="">
          <ShoulderScene />
        </div>
      </div>
      <div className={styles.edgeLine} aria-hidden="true" />
    </section>
  );
}
