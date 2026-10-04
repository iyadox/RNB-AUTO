/**
 * PK 02 · « Quel véhicule transportons-nous ? » (docs/09, F.2) : le portique de gabarit.
 *
 * Le catalogue complet, lu en base (`getPublicCatalog`), passe sous le portique : poutre,
 * montants balisés, barre de hauteur suspendue (aucune cote : jamais de chiffre inventé).
 * - Badge « Prix en ligne » : contour craie et coche ; « Sur demande » : contour jaune et
 *   téléphone. Jamais de vert (le vert est réservé à WhatsApp).
 * - Ordinateur : chaque file glisse sous le portique avec le défilement (`view()`, CSS seul,
 *   sans épinglage). Téléphone : grille compacte de deux colonnes (silhouette, puis nom), légende
 *   des pastilles une seule fois au-dessus, « Sur demande » en évidence ; les véhicules passent
 *   sous la barre en glissant avec le défilement (`view()`, niveau `full`), sinon de 24 px à
 *   leur entrée.
 * - Sans JavaScript et en `off` : tout est à sa place.
 */
import type { CSSProperties, ReactElement } from "react";
import { VehicleIcon } from "@/components/brand/vehicle-icon";
import { Icon } from "@/components/ui/icon";
import type { PublicCatalog } from "@/server/site/catalog";
import styles from "./remorquage.module.css";

type Vehicle = PublicCatalog["vehicles"][number];

/** Nombre de véhicules par file : au plus cinq, files équilibrées (9 → 5 + 4). */
function laneSize(count: number): number {
  const lanes = Math.max(1, Math.ceil(count / 5));
  return Math.max(1, Math.ceil(count / lanes));
}

export function VehiclesGauge({ vehicles }: { vehicles: Vehicle[] }): ReactElement {
  const lane = laneSize(vehicles.length);
  return (
    <div className={styles.gauge} data-inview-once="">
      <div className={styles.gaugeYard}>
        <div className={styles.gantry} aria-hidden="true">
          <span className={styles.gantryLamp} style={{ left: "18%" }} />
          <span className={styles.gantryLamp} style={{ left: "50%" }} />
          <span className={styles.gantryLamp} style={{ left: "82%" }} />
          <span className={`${styles.gantryPost} ${styles.gantryPostLeft}`} />
          <span className={`${styles.gantryPost} ${styles.gantryPostRight}`} />
          <span className={styles.gantryBeam} />
          <span className={styles.gantryChain} style={{ left: "12%" }} />
          <span className={styles.gantryChain} style={{ right: "12%" }} />
          <span className={styles.gantryBar} />
          <span className={styles.gantryPlaque}>
            <Icon name="heightBar" size={22} strokeWidth={2.2} />
          </span>
        </div>

        {/* Téléphone : la légende des pastilles, une seule fois (chaque véhicule garde son texte
            pour les lecteurs d'écran ; « Prix en ligne » n'y est plus qu'une coche). */}
        <p className={styles.gaugeKey} aria-hidden="true">
          <span className={`${styles.badge} ${styles.badgeOnline}`}>
            <Icon name="check" size={16} strokeWidth={3} />
            Prix en ligne
          </span>
          <span className={`${styles.badge} ${styles.badgeRequest}`}>
            <Icon name="phone" size={15} strokeWidth={2.4} />
            Sur demande
          </span>
        </p>

        <ul className={styles.convoy} style={{ "--lane": lane } as CSSProperties}>
          {vehicles.map((vehicle, index) => (
            <li
              key={vehicle.code}
              className={styles.vehicle}
              data-inview-once=""
              data-acceptance={vehicle.acceptance}
              style={{ "--col": index % lane } as CSSProperties}
            >
              <span className={styles.vehicleArt} aria-hidden="true">
                <VehicleIcon code={vehicle.icon} />
              </span>
              <span>
                <span className={styles.vehicleName}>{vehicle.label}</span>
                {vehicle.acceptance === "accepted" ? (
                  <span className={`${styles.badge} ${styles.badgeOnline}`}>
                    <Icon name="check" size={16} strokeWidth={3} aria-hidden="true" />
                    <span className={styles.badgeText}>Prix en ligne</span>
                  </span>
                ) : (
                  <span className={`${styles.badge} ${styles.badgeRequest}`}>
                    <Icon name="phone" size={15} strokeWidth={2.4} aria-hidden="true" />
                    Sur demande
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className={styles.gaugeRoad} aria-hidden="true" />
      </div>

      <p className={styles.gaugeNote} data-reveal="">
        Pour les véhicules « sur demande », envoyez votre demande ou appelez-nous&nbsp;: nous vérifions ensemble que le
        transport est possible et vous donnons un prix précis.
      </p>
    </div>
  );
}
