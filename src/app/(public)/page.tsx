import { HomeMotion } from "@/components/home/home-motion";
import { Hero } from "@/components/home/hero";
import {
  FaqPreview,
  FinalCta,
  HighwaySection,
  HowItWorks,
  MarqueeBand,
  PriceSection,
  Services,
  ZoneRadar,
} from "@/components/home/sections";
import { JsonLd, localBusinessJsonLd } from "@/components/public/json-ld";
import { getPublicSiteInfo } from "@/server/site/public-info";

export default async function HomePage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <JsonLd data={localBusinessJsonLd(info)} />
      <Hero info={info} />
      <MarqueeBand />
      <HowItWorks />
      <Services />
      <PriceSection info={info} />
      <HighwaySection />
      <ZoneRadar info={info} />
      <FaqPreview />
      <FinalCta info={info} />
      <HomeMotion />
    </>
  );
}
