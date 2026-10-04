import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/page-transition";
import { DawnCta, NextExit, RelatedFaq } from "@/components/public/page-blocks";
import { RoadLine } from "@/components/public/road-line";
import { ExitSection } from "@/components/pages/autoroute/exit-section";
import { HighwayOpening } from "@/components/pages/autoroute/highway-opening";
import { RelaySection } from "@/components/pages/autoroute/relay-story";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Panne sur autoroute : que faire ?",
  description:
    "Panne sur l'autoroute ou une voie rapide : les bons réflexes de sécurité, qui peut intervenir, et comment RNB AUTO prend le relais une fois votre véhicule sorti de l'autoroute.",
  alternates: { canonical: "/panne-autoroute" },
};

/** Repères de la ligne de route (D.3), un par section. */
const MARKERS = [
  { id: "ouverture", pk: "00", label: "Les bons réflexes" },
  { id: "qui-intervient", pk: "01", label: "Qui intervient ?" },
  { id: "relais", pk: "02", label: "Le relais" },
  { id: "questions-liees", pk: "03", label: "Questions" },
] as const;

/**
 * /panne-autoroute « La bande d'arrêt d'urgence » (docs/09, F.4) : intensité minimale, sans GSAP.
 * Les réflexes de sécurité dès le premier écran, sans aucune animation ; le relais d'autoroute
 * tracé une fois ; la sortie ; questions liées, prochaine sortie et aube calme (ni dépanneuse,
 * ni texte peint). Aucune dépanneuse RNB AUTO sur une voie d'autoroute.
 */
export default async function HighwayPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <RoadLine markers={MARKERS} />
      <PageTransition>
        <HighwayOpening lead={info.regulatedRoads.message} />
        <RelaySection />
        <ExitSection />
        <RelatedFaq ids={["autoroute", "prix-definitif"]} />
        <NextExit from="/panne-autoroute" />
        <DawnCta info={info} title="Besoin d'un relais après l'autoroute ?" calm />
      </PageTransition>
    </>
  );
}
