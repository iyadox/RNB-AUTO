import type { PublicSiteInfo } from "@/server/site/public-info";


/** Version provisoire : remplie par le lot L1b de la refonte. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function HighwaySection({ info }: { info: PublicSiteInfo }) {
  return <section id="autoroute" data-sky="bleue" />;
}
