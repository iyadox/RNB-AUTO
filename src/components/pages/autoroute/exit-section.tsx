/**
 * /panne-autoroute, PK 02 : l'encadré existant « Votre véhicule est sorti de l'autoroute ? »
 * (texte mot pour mot) et son bouton « Demander le relais », devant la bretelle de sortie.
 * Le bouton est le seul jaune plein de l'écran ; il est immobile et visible dès l'entrée.
 */
import type { ReactElement } from "react";
import { PrimaryLink } from "@/components/public/actions";
import { Plate } from "@/components/public/page-blocks";
import { ExitScene } from "./exit-scene";
import styles from "./autoroute.module.css";

export function ExitSection(): ReactElement {
  return (
    <section id="relais" data-sky="bleue" className={styles.exitSection}>
      <div className={styles.exitGrid}>
        <div className={styles.exitText}>
          <Plate pk="02">Le relais</Plate>
          <h2 className={styles.exitTitle}>
            Votre véhicule est <em>sorti de l&apos;autoroute&nbsp;?</em>
          </h2>
          <p className={styles.exitLead}>
            Faites votre demande en indiquant la sortie ou l&apos;adresse où se trouve votre véhicule&nbsp;: nous calculons le
            prix à partir de ce point.
          </p>
          <PrimaryLink href="/demande?autoroute=1" className="mt-8">
            Demander le relais
          </PrimaryLink>
        </div>
        <div className={styles.exitSceneCol}>
          <ExitScene />
        </div>
      </div>
    </section>
  );
}
