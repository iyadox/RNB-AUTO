import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/page-transition";
import { DawnCta, NextExit, RelatedFaq, Section } from "@/components/public/page-blocks";
import { RoadLine } from "@/components/public/road-line";
import { AreasStage } from "@/components/pages/zones/areas-stage";
import { CommuneSearch } from "@/components/pages/zones/commune-search";
import { Further } from "@/components/pages/zones/further";
import { OpeningMap } from "@/components/pages/zones/opening-map";
import styles from "@/components/pages/zones/zones.module.css";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Zones d'intervention : Bobigny, Seine-Saint-Denis, Paris, Île-de-France",
  description:
    "RNB AUTO intervient depuis Bobigny dans toute la Seine-Saint-Denis, à Paris et en Île-de-France. Votre distance et votre prix sont calculés en ligne.",
  alternates: { canonical: "/zones-d-intervention" },
};

/** Repères de la ligne de route (D.3), un par section. */
const MARKERS = [
  { id: "ouverture", pk: "00", label: "Zones d'intervention" },
  { id: "commune", pk: "01", label: "Votre commune" },
  { id: "secteurs", pk: "02", label: "Communes et secteurs" },
  { id: "plus-loin", pk: "03", label: "Plus loin" },
  { id: "questions-liees", pk: "04", label: "Questions" },
] as const;

/**
 * /zones-d-intervention « Vue du ciel » (docs/09, F.3) : le Plan RNB balayé par le gyrophare du
 * dépôt, la recherche de commune, les quatre secteurs qui s'allument un par un sur le plan
 * collant (ordinateur), le relais d'autoroute, puis questions liées, prochaine sortie et aube.
 */
export default async function ZonesPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <RoadLine markers={MARKERS} />
      <PageTransition>
        <OpeningMap info={info} />

        <Section
          id="commune"
          pk="01"
          label="Votre commune"
          title="Votre commune ?"
          split
          className={`${styles.searchSection} pb-[calc(var(--spacing-section)*0.45)]`}
        >
          <CommuneSearch />
        </Section>

        <Section id="secteurs" pk="02" label="Communes et secteurs" title={"Où\u00a0intervenons-nous ?"} split className="pb-[calc(var(--spacing-section)*0.5)]">
          <AreasStage depot={info.depot} />
        </Section>

        <Section
          id="plus-loin"
          pk="03"
          label="Plus loin"
          sky="bleue"
          title="Plus loin, ou sur un trajet long ?"
          split
          className="pb-[calc(var(--spacing-section)*0.6)]"
        >
          <Further />
        </Section>

        <RelatedFaq ids={["position", "autoroute"]} title="Vos questions sur nos zones d'intervention." />
        <NextExit from="/zones-d-intervention" />
        <DawnCta info={info} title="Une panne en Île-de-France ?" />
      </PageTransition>
    </>
  );
}
