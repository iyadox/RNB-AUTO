import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/page-transition";
import { CallLink, PrimaryLink } from "@/components/public/actions";
import { DawnCta, NextExit, OpeningShot, RelatedFaq, Section } from "@/components/public/page-blocks";
import { RoadLine } from "@/components/public/road-line";
import { Blueprint } from "@/components/pages/entreprise/blueprint";
import { Commitments } from "@/components/pages/entreprise/commitments";
import { DepotOpening } from "@/components/pages/entreprise/depot-opening";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  // Titre absolu : le modèle « %s · RNB AUTO » aurait répété le nom de l'entreprise.
  title: { absolute: "L'entreprise RNB AUTO" },
  description:
    "RNB AUTO, entreprise de dépannage et de remorquage basée à Bobigny. Des prix clairs, un interlocuteur direct, une dépanneuse plateau au service de toute l'Île-de-France.",
  alternates: { canonical: "/entreprise" },
};

/** Repères de la ligne de route (D.3), un par section. */
const MARKERS = [
  { id: "ouverture", pk: "00", label: "L'entreprise" },
  { id: "depanneuse", pk: "01", label: "Notre dépanneuse" },
  { id: "engagements", pk: "02", label: "Notre façon de travailler" },
  { id: "questions-liees", pk: "03", label: "Questions" },
] as const;

/**
 * /entreprise « Le dépôt, avant le départ » (docs/09, F.6) : la façade du dépôt la nuit, le plan
 * technique de la dépanneuse (sans aucune dimension), les six engagements comme des panneaux de
 * bord de route, puis questions liées, prochaine sortie (Contact) et aube. Aucune personne,
 * aucun chiffre, aucune année.
 */
export default async function CompanyPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <RoadLine markers={MARKERS} />
      <PageTransition>
        <OpeningShot
          eyebrow="L'entreprise"
          pictogram="shield"
          titleFit
          title={
            <>
              RNB AUTO,{" "}
              <em data-beam="load" className="not-italic">
                dépannage à Bobigny.
              </em>
            </>
          }
          lead="Une entreprise de dépannage et de remorquage installée au cœur de la Seine-Saint-Denis, avec une conviction simple : quand on est en panne, on a besoin d'une réponse rapide et d'un prix clair."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {/* Sous 360 px, le bouton se resserre pour tenir dans l'écran (320 px). */}
              <PrimaryLink href="/demande" className="max-[359px]:px-5 max-[359px]:text-base">Demander un dépannage</PrimaryLink>
              <CallLink phone={info.phone} size="lg" className="max-sm:hidden" />
            </div>
          }
          scene={<DepotOpening />}
        />

        <Section
          id="depanneuse"
          pk="01"
          label="Notre dépanneuse"
          title={
            <>
              Un plateau <em>prêt à partir</em>
            </>
          }
          split
          // Marge basse réduite : 180 px (téléphone) à 300 px (ordinateur) de nuit vide séparaient
          // le plan de la section suivante, qui a déjà sa propre marge haute.
          className="pb-[calc(var(--spacing-section)*0.35)]"
        >
          <Blueprint depotLabel={info.depotLabel} />
        </Section>

        <Section
          id="engagements"
          pk="02"
          label="Notre façon de travailler"
          sky="bleue"
          className="overflow-x-clip"
          title={
            <>
              Ce sur quoi vous pouvez <em>compter</em>
            </>
          }
          split
        >
          <Commitments />
        </Section>

        <RelatedFaq ids={["calcul-du-prix", "vehicules", "sans-le-site"]} title="Vos questions sur RNB AUTO." />
        <NextExit from="/entreprise" />
        <DawnCta info={info} title="Besoin d'une dépanneuse maintenant ?" truck="empty" />
      </PageTransition>
    </>
  );
}
