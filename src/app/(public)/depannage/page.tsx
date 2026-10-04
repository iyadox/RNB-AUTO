import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/page-transition";
import { CallLink, PrimaryLink } from "@/components/public/actions";
import { DawnCta, NextExit, OpeningShot, RelatedFaq, Section } from "@/components/public/page-blocks";
import { RoadLine } from "@/components/public/road-line";
import { Dashboard } from "@/components/pages/depannage/dashboard";
import { DepannageScenes } from "@/components/pages/depannage/depannage-scenes";
import { OpeningScene } from "@/components/pages/depannage/opening-scene";
import { StepsRoad } from "@/components/pages/depannage/steps-road";
import { TowFallback } from "@/components/pages/depannage/tow-fallback";
import styles from "@/components/pages/depannage/depannage.module.css";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Dépannage automobile sur place à Bobigny et en Île-de-France",
  description:
    "Batterie à plat, crevaison, petite panne : RNB AUTO intervient sur place quand c'est possible, sinon remorque votre véhicule. Prix estimé en ligne en moins d'une minute.",
  alternates: { canonical: "/depannage" },
};

/** Repères de la ligne de route (D.3), un par section. */
const MARKERS = [
  { id: "ouverture", pk: "00", label: "Dépannage sur place" },
  { id: "situations", pk: "01", label: "Les situations courantes" },
  { id: "etapes", pk: "02", label: "Comment ça se passe" },
  { id: "bon-a-savoir", pk: "03", label: "Bon à savoir" },
  { id: "questions-liees", pk: "04", label: "Questions" },
] as const;

/**
 * /depannage « Le bas-côté » (docs/09, F.1) : la voiture capot ouvert sous le lampadaire,
 * le tableau de bord des situations, la route aux quatre bornes, la séquence de chargement
 * quand la réparation n'est pas possible, puis questions liées, prochaine sortie et aube.
 */
export default async function DepannagePage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <RoadLine markers={MARKERS} />
      <PageTransition>
        <DepannageScenes />

        <OpeningShot
          eyebrow="Dépannage sur place"
          pictogram="wrench"
          morphName="vt-sign-depannage"
          title={
            <span className={styles.heroTitle}>
              On vous remet{" "}
              <em data-beam="load" className="not-italic">
                sur la route.
              </em>
            </span>
          }
          lead="Batterie à plat, crevaison, petite panne : quand le problème peut se régler sur place, nous intervenons directement. Sinon, votre véhicule est remorqué là où vous le souhaitez."
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryLink href="/demande">Estimer mon dépannage</PrimaryLink>
              <CallLink phone={info.phone} size="lg" className="max-sm:hidden" />
            </div>
          }
          scene={<OpeningScene />}
        />

        <Section id="situations" pk="01" label="Les situations courantes" title="Ce que nous réglons sur place" split>
          <Dashboard />
        </Section>

        <Section id="etapes" pk="02" label="Comment ça se passe" title="Quatre étapes, aucune surprise" split>
          <StepsRoad />
        </Section>

        <Section
          id="bon-a-savoir"
          pk="03"
          label="Bon à savoir"
          sky="bleue"
          title="Si la réparation n'est pas possible sur place"
          split
        >
          <TowFallback />
        </Section>

        <RelatedFaq ids={["prix-sur-place", "presence", "sans-le-site"]} />
        <NextExit from="/depannage" />
        <DawnCta info={info} title="Besoin d'une dépanneuse maintenant ?" truck="empty" />
      </PageTransition>
    </>
  );
}
