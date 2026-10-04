/**
 * PK 03 · « Plus loin, ou sur un trajet long ? » (docs/09, F.3) : le paragraphe existant, mot
 * pour mot (la première phrase devient le titre de la section), et le relais d'autoroute du kit
 * (seule scène bleue de la page : l'autoroute n'est jamais RNB AUTO).
 */
import type { ReactElement } from "react";
import { DirectionSign } from "@/components/scenes/kit/direction-sign";
import { HighwayRelay } from "@/components/scenes/kit/highway-relay";
import styles from "./zones.module.css";

export function Further(): ReactElement {
  return (
    <div className={styles.further}>
      <div>
        <p className={styles.furtherText} data-reveal="">
          Envoyez quand même votre demande&nbsp;: nous vous rappelons pour vous donner un prix précis et un délai réaliste.
        </p>
        <p className={styles.furtherNote} data-reveal="" data-reveal-step="2">
          Sur les autoroutes et voies rapides, l&apos;intervention revient au dépanneur agréé du secteur&nbsp;; nous pouvons
          ensuite prendre le relais.
        </p>
        <DirectionSign
          href="/panne-autoroute"
          title="Panne sur autoroute"
          subtitle="Sécurité d'abord, puis relais à la sortie"
          arrow="up-right"
          pictogram="hazard"
          className={styles.furtherSign}
        />
      </div>
      {/* Même viseur que le plan de l'ouverture : la scène est vue du ciel, sans cadre de carte. */}
      <div className={styles.relayFrame} data-reveal="" data-reveal-step="2">
        <HighwayRelay draw="view" />
        <span className={styles.corner} aria-hidden="true" />
        <span className={styles.corner} aria-hidden="true" />
        <span className={styles.corner} aria-hidden="true" />
        <span className={styles.corner} aria-hidden="true" />
      </div>
    </div>
  );
}
