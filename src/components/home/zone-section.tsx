import type { PublicSiteInfo } from "@/server/site/public-info";


/** Version provisoire : remplie par le lot L1b de la refonte. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ZoneSection({ info }: { info: PublicSiteInfo }) {
  return <section id="zone" data-sky="bleue" />;
}
