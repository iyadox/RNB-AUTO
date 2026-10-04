/**
 * PK 05 · « Basés à Bobigny. Partout en Île-de-France. » (docs/09, E.7), `id="zone"`, ciel `bleue`.
 *
 * Texte existant (le dépôt vient des réglages : `info.depot`, `info.depotLabel`), puces des
 * départements, « Plan schématique. » et lien vers les zones. Le Plan RNB régional : le
 * gyrophare du dépôt balaie, chaque ville s'éclaire à son passage. Aucune distance affichée.
 */
import Link from "next/link";
import type { CSSProperties } from "react";
import { Plate } from "@/components/public/page-blocks";
import { PlanIdf } from "@/components/scenes/kit/plan-idf/plan-idf";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import type { PublicSiteInfo } from "@/server/site/public-info";
import styles from "./home-lower.module.css";

const DEPARTMENTS = ["93", "75", "92", "94", "95", "77", "78", "91"];

export function ZoneSection({ info }: { info: PublicSiteInfo }) {
  const city = info.depot.city;
  return (
    <section id="zone" data-sky="bleue" aria-labelledby="zone-titre" className={cn(styles.section, styles.zoneSection)}>
      <span className={styles.lane} aria-hidden="true" />
      {/* Grand nom en contour au bas de la section (décor, parallaxe douce). */}
      <div className={styles.zoneGhost} aria-hidden="true">
        <span data-parallax="" style={{ "--depth": 0.3 } as CSSProperties}>
          Île-de-France
        </span>
      </div>

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
          Notre dépanneuse part de {info.depotLabel}. Au cœur de la Seine-Saint-Denis, à quelques minutes de Paris et des
          grands axes. Votre distance exacte est calculée dès que vous indiquez votre position.
        </p>

        <figure className={styles.zonePlan}>
          <PlanIdf depot={info.depot} variant="region" sweep labels="major" className={styles.zonePlanSvg} />
          <figcaption className={styles.zoneCaption}>Plan schématique.</figcaption>
        </figure>

        <div className={styles.zoneRest}>
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
          <Link href="/zones-d-intervention" className={styles.textLink}>
            Voir les zones desservies
            <Icon name="arrowRight" size={20} strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </section>
  );
}
