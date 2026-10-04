import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/page-transition";
import { CallLink, PrimaryLink, WhatsAppLink } from "@/components/public/actions";
import { JsonLd } from "@/components/public/json-ld";
import { DawnCta, NextExit, OpeningShot } from "@/components/public/page-blocks";
import { RoadLine } from "@/components/public/road-line";
import { FaqHash } from "@/components/pages/faq/faq-hash";
import { FaqScenes } from "@/components/pages/faq/faq-scenes";
import { ThemeBar, ThemeSection, faqGroups, themeAnchor } from "@/components/pages/faq/faq-themes";
import { QuestionRoad } from "@/components/pages/faq/question-road";
import styles from "@/components/pages/faq/faq.module.css";
import { FAQ } from "@/content/faq";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: "Prix, délais, autoroute, véhicules acceptés, paiement : les réponses aux questions les plus fréquentes sur le dépannage RNB AUTO.",
  alternates: { canonical: "/questions-frequentes" },
};

const GROUPS = faqGroups();
const BAR_ID = "themes-questions";

/** Repères de la ligne de route (D.3) : l'ouverture, puis un par thème. */
const MARKERS = [
  { id: "ouverture", pk: "00", label: "Questions fréquentes" },
  ...GROUPS.map((group) => ({ id: themeAnchor(group.id), pk: String(group.index + 1).padStart(2, "0"), label: group.label })),
];

/**
 * /questions-frequentes « La route en point d'interrogation » (docs/09, F.5) : ouverture avec la
 * route en « ? » qui finit au dépôt, barre des thèmes collante, un groupe par thème (objet de la
 * route + bornes des questions), prochaine sortie, aube. Données structurées FAQPage générées
 * depuis la source unique (src/content/faq.ts).
 */
export default async function FaqPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <RoadLine markers={MARKERS} />
      <PageTransition>
        <FaqScenes />
        <FaqHash barId={BAR_ID} />

        <OpeningShot
          eyebrow="Questions fréquentes"
          pictogram="question"
          title={
            <span className={styles.openingTitle}>
              Vos questions,{" "}
              <em data-beam="load" className="not-italic">
                nos réponses.
              </em>
            </span>
          }
          lead="Une question qui n'est pas dans la liste ? Appelez-nous ou écrivez-nous sur WhatsApp."
          actions={
            <div className="flex flex-col items-start gap-3">
              <PrimaryLink href="/demande">Demander un dépannage</PrimaryLink>
              {/* Sur mobile, Appeler et WhatsApp sont déjà dans la barre d'action, juste en dessous. */}
              <div className="flex flex-wrap gap-3 max-sm:hidden">
                <CallLink phone={info.phone} size="md" />
                <WhatsAppLink whatsapp={info.whatsapp} size="md" />
              </div>
            </div>
          }
          scene={<QuestionRoad depotCity={info.depot.city} />}
        />

        <div className={styles.themesRoad}>
          <ThemeBar id={BAR_ID} />
          {GROUPS.map((group) => (
            <ThemeSection key={group.id} group={group} />
          ))}
        </div>

        <NextExit from="/questions-frequentes" />
        <DawnCta info={info} title="Une autre question ?" text="Appelez-nous ou écrivez-nous sur WhatsApp." />
      </PageTransition>
    </>
  );
}
