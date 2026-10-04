/**
 * PK 03 · « Comment est calculé le prix ? » (docs/09, F.2) : les trois trajets tracés
 * (`ThreeLegs mode="tow" draw="view"`), les facteurs du prix qui s'allument (P15), les trois
 * garanties imprimées sur le ticket qui sort de la borne (P12), puis « Calculer mon prix ».
 * Sur ordinateur, le plan reste à côté du texte (`position: sticky`, jamais d'épinglage).
 * Textes repris mot pour mot de l'ancienne page ; le ticket n'affiche aucun montant.
 */
import type { ReactElement } from "react";
import { PrimaryLink } from "@/components/public/actions";
import { EstimateTicket } from "@/components/scenes/kit/estimate-ticket";
import { ThreeLegs } from "@/components/scenes/kit/three-legs";
import styles from "./remorquage.module.css";

const GUARANTEES = [
  "Estimation affichée avant toute demande",
  "Prix confirmé avant l'intervention",
  "Supplément éventuel toujours expliqué avant",
];

const FACTORS = ["Véhicule", "Situation", "Horaire"];

export function PriceLegs(): ReactElement {
  return (
    <div className={styles.price}>
      <p className={styles.priceText} data-reveal="">
        Le prix dépend du <strong>trajet réel</strong> de la dépanneuse, calculé sur les routes&nbsp;: jusqu&apos;à vous,
        puis avec votre véhicule jusqu&apos;à la destination.
      </p>

      <div className={styles.priceMap}>
        <span className={styles.mapCorner} aria-hidden="true" />
        <span className={styles.mapCorner} aria-hidden="true" />
        <span className={styles.mapCorner} aria-hidden="true" />
        <span className={styles.mapCorner} aria-hidden="true" />
        <ThreeLegs mode="tow" draw="view" />
      </div>

      <p className={styles.priceText} data-reveal="">
        Le type de véhicule, la situation (non roulant, parking…) et l&apos;horaire (nuit, dimanche, jour férié) sont
        aussi pris en compte. Vous voyez une estimation avant d&apos;envoyer votre demande, puis nous la confirmons avec
        vous par téléphone.
      </p>

      <ul className={styles.factors} data-ignite="">
        {FACTORS.map((factor) => (
          <li key={factor} className={styles.factor}>
            <span className={styles.factorLamp} data-light="" aria-hidden="true" />
            {factor}
          </li>
        ))}
      </ul>

      <div className={styles.priceTicket}>
        <div className={styles.borne} aria-hidden="true">
          <span className={styles.borneScreen}>
            <i />
            <i />
            <i />
          </span>
          <span className={styles.borneSlot} />
        </div>
        <EstimateTicket priceCents={null} lines={GUARANTEES} print="view" odometer="none" className={styles.ticket} />
        <span className={styles.ticketShadow} aria-hidden="true" />
      </div>

      <div className={styles.priceAction}>
        <PrimaryLink href="/demande">Calculer mon prix</PrimaryLink>
      </div>
    </div>
  );
}
