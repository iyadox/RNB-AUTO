/**
 * /contact, PK 01 (docs/09, F.7) : l'adresse du dépôt sur un plan de quartier éclairé
 * (`PlanIdf variant="depot"`, statique, « Plan schématique »), avec le lien existant « Voir sur
 * la carte » ; puis l'email sur une plaque vissée (« À COMPLÉTER » s'il manque), « Pour les
 * demandes non urgentes. ». Deux sections côte à côte sur ordinateur, chacune avec son titre et
 * son heure (`data-sky`). Aucune animation d'entrée.
 */
import type { ReactElement } from "react";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { Plate, ToComplete } from "@/components/public/page-blocks";
import { PlanIdf } from "@/components/scenes/kit/plan-idf/plan-idf";
import { Icon } from "@/components/ui/icon";
import styles from "./contact.module.css";

export function ContactDetails({ info }: { info: Pick<PublicSiteInfo, "depot" | "depotLabel" | "email"> }): ReactElement {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.depotLabel)}`;
  return (
    <div className={styles.details}>
      <div className={`${styles.container} ${styles.detailsGrid}`}>
        <section id="adresse" data-sky="nuit" aria-labelledby="adresse-titre">
          <Plate pk="01">Adresse</Plate>
          <div className={styles.address}>
            <div>
              <h2 id="adresse-titre" className={styles.addressTitle}>
                {/* Navigation par titres : le titre seul doit dire de quoi il s'agit. */}
                <span className="sr-only">Adresse : </span>
                {info.depotLabel}
              </h2>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.mapLink}>
                Voir sur la carte
                <Icon name="external" size={18} strokeWidth={2.4} />
              </a>
            </div>

            <div className={styles.board} aria-hidden="true">
              <span className={styles.boardLight} />
              <span className={styles.boardLamp} />
              <div className={styles.boardFace}>
                <div className={styles.boardMap}>
                  <PlanIdf depot={info.depot} variant="depot" labels="major" />
                </div>
                <p className={styles.boardCaption}>
                  <span>Plan schématique</span>
                  <Icon name="pin" size={16} strokeWidth={2.4} />
                </p>
              </div>
              <span className={styles.boardLegs} />
            </div>
          </div>
        </section>

        <section id="email" data-sky="nuit" aria-labelledby="email-titre">
          <Plate pk="02">Email</Plate>
          <div className={styles.mailPlate}>
            <span className={styles.mailSlot} aria-hidden="true" />
            <div className={styles.mailRow}>
              <span className={styles.mailIcon} aria-hidden="true">
                <Icon name="mail" size={22} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <h2 id="email-titre" className={styles.mailTitle}>
                  <span className="sr-only">Email : </span>
                  {info.email ? (
                    <a href={`mailto:${info.email}`} className={styles.mailLink}>
                      {info.email}
                    </a>
                  ) : (
                    <span className={styles.mailMissing}>
                      <ToComplete label="email" />
                    </span>
                  )}
                </h2>
                <p className={styles.mailHelp}>Pour les demandes non urgentes.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
