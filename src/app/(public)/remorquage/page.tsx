import type { Metadata } from "next";
import { PageTransition, SharedMorph } from "@/components/motion/page-transition";
import { CallLink, PrimaryLink } from "@/components/public/actions";
import { DawnCta, NextExit, OpeningShot, RelatedFaq, Section } from "@/components/public/page-blocks";
import { RoadLine } from "@/components/public/road-line";
import { OpeningScene } from "@/components/pages/remorquage/opening-scene";
import { PriceLegs } from "@/components/pages/remorquage/price-legs";
import { RemorquageScenes } from "@/components/pages/remorquage/remorquage-scenes";
import { SituationsStage } from "@/components/pages/remorquage/situations-stage";
import { VehiclesGauge } from "@/components/pages/remorquage/vehicles-gauge";
import styles from "@/components/pages/remorquage/remorquage.module.css";
import { getPublicCatalog } from "@/server/site/catalog";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Remorquage de voiture et d'utilitaire en Île-de-France",
  description:
    "Remorquage sur plateau vers le garage, le domicile ou l'adresse de votre choix. Véhicule non roulant, accidenté, roues bloquées, parking. Prix estimé en ligne.",
  alternates: { canonical: "/remorquage" },
};

/** Repères de la ligne de route (D.3), un par section. */
const MARKERS = [
  { id: "ouverture", pk: "00", label: "Remorquage" },
  { id: "situations", pk: "01", label: "Toutes les situations" },
  { id: "vehicules", pk: "02", label: "Véhicules" },
  { id: "prix", pk: "03", label: "Le prix" },
  { id: "questions-liees", pk: "04", label: "Questions" },
] as const;

/**
 * /remorquage « Le chargement » (docs/09, F.2) : ouverture avec la séquence de chargement,
 * scène collante des situations, portique de gabarit du catalogue, trois trajets et ticket,
 * questions liées, prochaine sortie, aube.
 */
export default async function RemorquagePage() {
  const [info, catalog] = await Promise.all([getPublicSiteInfo(), getPublicCatalog()]);
  return (
    <>
      <RoadLine markers={MARKERS} />
      <PageTransition>
        <RemorquageScenes />

        <OpeningShot
          eyebrow="Remorquage"
          pictogram="truck"
          // Le panneau du carrefour de l'accueil devient le titre principal (morph D.4) : un
          // vrai en-tête lisible, pas la petite plaque PK 00.
          title={
            <SharedMorph name="vt-sign-remorquage">
              <span className={styles.heroTitle}>
                Votre véhicule,{" "}
                <em data-beam="load" className="not-italic">
                  où vous voulez.
                </em>
              </span>
            </SharedMorph>
          }
          lead="Votre véhicule est chargé sur notre dépanneuse plateau et emmené au garage de votre choix, chez vous ou à toute autre adresse. Le prix tient compte du trajet réel."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {/* Sous 360 px, le bouton se resserre pour tenir dans l'écran (320 px). */}
              <PrimaryLink href="/demande" className="max-[359px]:px-5 max-[359px]:text-base">Estimer mon remorquage</PrimaryLink>
              <CallLink phone={info.phone} size="lg" className="max-sm:hidden" />
            </div>
          }
          scene={<OpeningScene />}
        />

        <Section
          id="situations"
          pk="01"
          label="Toutes les situations"
          title="Roulant, non roulant, accidenté"
          split
          className="lg:pb-0"
        >
          <SituationsStage />
        </Section>

        <Section
          id="vehicules"
          pk="02"
          label="Véhicules"
          title="Quel véhicule transportons-nous ?"
          className="overflow-x-clip"
        >
          <VehiclesGauge vehicles={catalog.vehicles} />
        </Section>

        <Section id="prix" pk="03" label="Le prix" sky="bleue" title="Comment est calculé le prix ?" split>
          <PriceLegs />
        </Section>

        <RelatedFaq ids={["destination", "vehicules", "calcul-du-prix"]} title="Vos questions sur le remorquage." />
        <NextExit from="/remorquage" />
        <DawnCta info={info} title="Un véhicule à déplacer ?" truck="loaded" />
      </PageTransition>
    </>
  );
}
