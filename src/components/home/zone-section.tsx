/**
 * PK 05 · « Basés à Bobigny. Partout en Île-de-France. » (docs/09, E.7), `id="zone"`, ciel `bleue`.
 *
 * Texte existant (le dépôt vient des réglages : `info.depot`, `info.depotLabel`), puces des
 * départements, « Plan schématique. » et lien vers les zones. Le Plan RNB régional : le
 * gyrophare du dépôt balaie, chaque ville s'éclaire à son passage. Aucune distance affichée.
 * « Au cœur de la Seine-Saint-Denis… » n'est écrit que si le dépôt y est (`depotInSeineSaintDenis`).
 * Le plan est monté à l'approche (`LazyScene`) ; sans JavaScript, la figure est retirée (CSS).
 */
import Link from "next/link";
import type { CSSProperties } from "react";
import { Plate } from "@/components/public/page-blocks";
import { PlanIdf } from "@/components/scenes/kit/plan-idf/plan-idf";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { depotInSeineSaintDenis } from "./home-geo";
import { LazyScene } from "./lazy-scene";
import { NoBreakHyphens } from "./no-break-hyphens";
import styles from "./home-lower.module.css";

const DEPARTMENTS = ["93", "75", "92", "94", "95", "77", "78", "91"];

export function ZoneSection({ info }: { info: PublicSiteInfo }) {
  const city = info.depot.city;
  return (
    <section id="zone" data-sky="bleue" aria-labelledby="zone-titre" className={cn(styles.section, styles.zoneSection)}>
      <span className={styles.lane} aria-hidden="true" />
      {/* Grand nom en contour au bas de la section (décor, parallaxe douce). */}
      <span className={styles.zoneGhost} data-parallax="" style={{ "--depth": 0.3 } as CSSProperties} aria-hidden="true">
        Île-de-France
      </span>

      <div className={cn(styles.container, styles.zoneGrid)}>
        <div className={styles.zoneHead}>
          <div data-reveal="">
            <Plate pk="05">Zone d&apos;intervention</Plate>
          </div>
          <h2 id="zone-titre" data-split="" className={cn(styles.title, "mt-5")}>
            {city ? `Basés à ${city}. ` : null}
            <em>
              Partout en <span className="whitespace-nowrap">Île-de-France.</span>
            </em>
          </h2>
        </div>

        <p data-reveal="" className={cn(styles.lead, styles.zoneLead)}>
          Notre dépanneuse part de <NoBreakHyphens text={info.depotLabel} />.{" "}
          {depotInSeineSaintDenis(info.depot)
            ? <>
                Au cœur de la <span className="whitespace-nowrap">Seine-Saint-Denis</span>, à quelques minutes de
                Paris et des grands axes.{" "}
              </>
            : null}
          Votre distance exacte est calculée dès que vous indiquez votre position.
        </p>

        <figure className={styles.zonePlan}>
          {/* Monté à l'approche (budget du HTML, G.2) ; cadre carré réservé, aucun décalage. */}
          <LazyScene className={styles.zonePlanFrame}>
            <PlanIdf depot={info.depot} variant="region" sweep labels="major" className={styles.zonePlanSvg} />
          </LazyScene>
          <figcaption className={styles.zoneCaption}>Plan schématique.</figcaption>
        </figure>

        <ul className={styles.departments}>
          {DEPARTMENTS.map((code, index) => (
            <li
              key={code}
              data-reveal=""
              data-reveal-step={index < 3 ? undefined : index < 6 ? "2" : "3"}
              className={cn(styles.department, "font-figure")}
            >
              {code}
            </li>
          ))}
        </ul>
        <Link href="/zones-d-intervention" className={cn(styles.textLink, styles.zoneLink)}>
          Voir les zones desservies
          <Icon name="arrowRight" size={20} strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
}
