/**
 * /contact, PK 00 (docs/09, F.7) : la façade de la borne d'appel, juste sous le titre.
 *
 * Trois grandes touches (88 px de haut au moins), rendues par le serveur, qui fonctionnent sans
 * JavaScript et ne reçoivent AUCUNE animation d'entrée (C.1-2, P2) :
 * - Téléphone : le numéro en chiffres fixes (jamais animé) ; seules des ondes radio CSS
 *   tournent autour de l'icône (P14, en pause hors de l'écran, absentes en `off`).
 *   Numéro absent : marqueur « À COMPLÉTER : numéro de téléphone » (premier de la page, visible :
 *   le test e2e le cherche).
 * - WhatsApp : « Écrire sur WhatsApp » ; absent : « À COMPLÉTER : numéro WhatsApp ».
 * - Demande en ligne : « Faire une demande ».
 * Textes repris mot pour mot de l'ancienne page.
 */
import Link from "next/link";
import type { ReactElement } from "react";
import { whatsappHref, whatsappRequestMessage } from "@/core/contact";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { ToComplete } from "@/components/public/page-blocks";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import styles from "./contact.module.css";

function Go() {
  return (
    <span className={styles.keyGo} aria-hidden="true">
      <Icon name="arrowRight" size={20} strokeWidth={2.4} />
    </span>
  );
}

export function Channels({ info }: { info: Pick<PublicSiteInfo, "phone" | "whatsapp" | "availability"> }): ReactElement {
  return (
    <div className={styles.panel}>
      <ul className={styles.keys}>
        <li className={styles.keyPhone}>
          {info.phone ? (
            <a href={info.phone.href} className={cn(styles.key, styles.keyPhone)} data-pause-offscreen="">
              <span className={cn(styles.well, styles.wellPhone)} aria-hidden="true">
                <span className={styles.wave} />
                <span className={styles.wave} />
                <Icon name="phone" size={26} strokeWidth={2.4} />
              </span>
              <span className={styles.keyBody}>
                <span className={styles.keyLabel}>Téléphone</span>
                <span className={styles.number}>{info.phone.display}</span>
              </span>
              <Go />
            </a>
          ) : (
            <div className={cn(styles.key, styles.keyPhone)}>
              <span className={cn(styles.well, styles.wellMissing)} aria-hidden="true">
                <Icon name="phone" size={26} strokeWidth={2.4} />
              </span>
              <span className={styles.keyBody}>
                <span className={styles.keyLabel}>Téléphone</span>
                <span>
                  <ToComplete label="numéro de téléphone" />
                </span>
              </span>
            </div>
          )}
        </li>

        <li>
          {info.whatsapp ? (
            <a
              href={whatsappHref(info.whatsapp.e164, whatsappRequestMessage({}))}
              className={cn(styles.key, styles.keyWhatsapp)}
            >
              <span className={cn(styles.well, styles.wellWhatsapp)} aria-hidden="true">
                <WhatsAppIcon size={28} />
              </span>
              <span className={styles.keyBody}>
                <span className={styles.keyLabel}>WhatsApp</span>
                <span className={styles.keyMain}>Écrire sur WhatsApp</span>
                <span className={styles.keyHelp}>Pratique pour nous envoyer des photos du véhicule.</span>
              </span>
              <Go />
            </a>
          ) : (
            <div className={cn(styles.key, styles.keyWhatsapp)}>
              <span className={cn(styles.well, styles.wellMissing)} aria-hidden="true">
                <WhatsAppIcon size={28} />
              </span>
              <span className={styles.keyBody}>
                <span className={styles.keyLabel}>WhatsApp</span>
                <span>
                  <ToComplete label="numéro WhatsApp" />
                </span>
                <span className={styles.keyHelp}>Pratique pour nous envoyer des photos du véhicule.</span>
              </span>
            </div>
          )}
        </li>

        <li>
          <Link href="/demande" className={styles.key}>
            <span className={cn(styles.well, styles.wellRequest)} aria-hidden="true">
              <Icon name="truck" size={26} strokeWidth={2.2} />
            </span>
            <span className={styles.keyBody}>
              <span className={styles.keyLabel}>Demande en ligne</span>
              <span className={styles.keyMain}>Faire une demande</span>
              <span className={styles.keyHelp}>Votre prix estimé en moins d&apos;une minute.</span>
            </span>
            <Go />
          </Link>
        </li>
      </ul>
    </div>
  );
}
