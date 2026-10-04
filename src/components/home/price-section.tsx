import type { PublicSiteInfo } from "@/server/site/public-info";
import type { HomePriceExamples } from "@/server/site/price-examples";

/** Version provisoire : remplie par le lot L1b de la refonte. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PriceSection({ info, examples }: { info: PublicSiteInfo; examples: HomePriceExamples | null }) {
  return <section id="prix" data-sky="nuit" />;
}
