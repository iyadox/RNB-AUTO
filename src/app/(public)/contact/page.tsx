import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/page-transition";
import { Plate } from "@/components/public/page-blocks";
import { RoadLine } from "@/components/public/road-line";
import { CallBox } from "@/components/pages/contact/call-box";
import { Channels } from "@/components/pages/contact/channels";
import { ContactDetails } from "@/components/pages/contact/contact-details";
import styles from "@/components/pages/contact/contact.module.css";
import { Icon } from "@/components/ui/icon";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Contact",
  description: "Appelez RNB AUTO, écrivez-nous sur WhatsApp ou faites une demande de dépannage en ligne.",
  alternates: { canonical: "/contact" },
};

/** Repères de la ligne de route (D.3), un par section. */
const MARKERS = [
  { id: "ouverture", pk: "00", label: "Contact" },
  { id: "adresse", pk: "01", label: "Adresse" },
  { id: "email", pk: "02", label: "Email" },
] as const;

/**
 * /contact « La borne d'appel » (docs/09, F.7), page calme et sans GSAP : le titre, puis tout de
 * suite les trois canaux (Téléphone, WhatsApp, Demande en ligne), sans animation d'entrée ; la
 * borne se dresse à droite sur ordinateur. Puis l'adresse sur un plan de quartier et l'email.
 * Ni « Prochaine sortie » ni aube. « À COMPLÉTER » partout où une information manque.
 */
export default async function ContactPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <RoadLine markers={MARKERS} />
      <PageTransition>
        <section id="ouverture" data-sky="minuit" className={styles.opening}>
          <div className={`${styles.container} ${styles.openingGrid}`}>
            <div>
              <Plate pk="00" pictogram="phone">
                Contact
              </Plate>
              <h1 className={styles.title}>
                On vous répond <em>tout de suite.</em>
              </h1>
              <p className={styles.lead}>
                Le plus rapide : appelez-nous ou écrivez sur WhatsApp. Vous pouvez aussi faire votre demande en ligne et
                obtenir une estimation immédiate.
              </p>
              <Channels info={info} />
              {info.availability ? (
                <p className={styles.availability}>
                  <Icon name="clock" size={20} strokeWidth={2.2} />
                  {info.availability}
                </p>
              ) : null}
            </div>
            <CallBox />
          </div>
        </section>

        <ContactDetails info={info} />
      </PageTransition>
    </>
  );
}
