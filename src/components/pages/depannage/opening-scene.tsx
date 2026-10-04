/**
 * Ouverture de /depannage « Le bas-côté » (docs/09, F.1, PK 00).
 *
 * Sous le cône d'un lampadaire au sodium, la voiture du client est arrêtée sur le bas-côté,
 * capot ouvert, feux de détresse allumés. La dépanneuse RNB AUTO est garée nez à nez,
 * gyrophare allumé ; les câbles de démarrage (le jaune devant) relient les deux moteurs. Un petit
 * témoin de charge se remplit une fois (1,2 s) pendant qu'un courant parcourt le câble.
 *
 * Repère : un « monde » de 100 × 84 unités, ancré en bas (`xMidYMax slice`) ; une unité vaut
 * 1cqw (largeur du cadre). Les véhicules (HTML) sont placés en cqw dans le même repère :
 * la chaussée est à y = 70, soit 14cqw au-dessus du bas du cadre. Sur mobile, le cadre est moins
 * haut : le haut du monde (tête du lampadaire) est simplement rogné.
 *
 * Boucles visibles : feux de détresse et gyrophare (deux au plus, en pause hors de l'écran).
 * Sans JavaScript et en `off` : état final (câbles en place, charge pleine). Tout est décoratif
 * (`aria-hidden`) : le titre et l'accroche disent la même chose.
 */
import type { CSSProperties, ReactElement } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { Skyline } from "@/components/scenes/base/skyline";
import { CarSide } from "@/components/scenes/kit/car-side";
import styles from "./depannage.module.css";

/** Câble jaune : de l'avant de la dépanneuse à la baie moteur de la voiture, avec son mou. */
const CABLE_MAIN = "M53.3 63.1C55.4 70.6 64.6 71.2 68.4 62.3";
/** Second câble, plus sombre, légèrement décalé. */
const CABLE_BACK = "M53.9 64.1C56.6 71.8 63.6 72 67.2 63";

const CHARGE_SEGMENTS = 5;

export function OpeningScene(): ReactElement {
  return (
    <div className={styles.openFrame} aria-hidden="true">
      <div className={styles.openStage} data-inview-once="" data-pause-offscreen="">
        <div className={styles.openWorldBox}>
          {/* Lueur de la ville, puis l'horizon (parallaxe douce) */}
          <div className={styles.openCityGlow} />
          <div className={styles.openSkylineWrap} data-parallax="" style={{ "--depth": 0.3 } as CSSProperties}>
            <Skyline layer="far" className={styles.openSkyline} />
          </div>

          {/* Monde, plan arrière : lampadaire, cône, chaussée, reflets */}
          <svg className={styles.openWorld} viewBox="0 0 100 84" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="dp-open-cone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.34" />
                <stop offset="0.7" stopColor="var(--color-sodium)" stopOpacity="0.09" />
                <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0.04" />
              </linearGradient>
              <radialGradient id="dp-open-halo">
                <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.55" />
                <stop offset="0.3" stopColor="var(--color-sodium)" stopOpacity="0.16" />
                <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="dp-open-pool">
                <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.34" />
                <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="dp-open-road" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-asphalt-800)" />
                <stop offset="0.5" stopColor="var(--color-asphalt-900)" />
                <stop offset="1" stopColor="var(--color-night-950)" />
              </linearGradient>
              <linearGradient id="dp-open-wet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.32" />
                <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="dp-open-beacon-wet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-beacon-500)" stopOpacity="0.5" />
                <stop offset="1" stopColor="var(--color-beacon-500)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Talus du bas-côté, derrière les véhicules */}
            <path d="M0 66.4Q30 65.2 52 65.8T100 65.6V70H0Z" fill="var(--color-asphalt-900)" />
            <path
              d="M0 66.4Q30 65.2 52 65.8T100 65.6"
              fill="none"
              stroke="var(--color-sodium)"
              strokeOpacity="0.12"
              strokeWidth="0.25"
            />

            {/* Lampadaire au sodium : halo, cône, flaque */}
            <circle cx="73" cy="23" r="15" fill="url(#dp-open-halo)" />
            <polygon points="70.6,23.6 75.6,23.6 95,70 49,70" fill="url(#dp-open-cone)" />
            <rect x="90.5" y="26" width="1.1" height="44" fill="var(--color-asphalt-750)" />
            <rect x="90.5" y="26" width="0.3" height="44" fill="var(--color-sodium)" fillOpacity="0.18" />
            <path d="M91 27.4Q91 22.6 86.4 22.6H75.5" fill="none" stroke="var(--color-asphalt-700)" strokeWidth="0.9" />
            <path d="M76.6 21.4H69.6Q69 23.2 70.6 23.8H75.6Q77.2 23.2 76.6 21.4Z" fill="var(--color-asphalt-750)" />
            <rect x="70.6" y="23.4" width="5" height="0.7" rx="0.3" fill="var(--color-sodium)" />

            {/* Chaussée mouillée, ligne de rive en tirets, plots rétroréfléchissants */}
            <rect x="0" y="70" width="100" height="14" fill="url(#dp-open-road)" />
            <path d="M0 70H100" stroke="var(--color-chalk)" strokeOpacity="0.14" strokeWidth="0.25" />
            <path
              d="M-2 74.6H102"
              stroke="var(--color-chalk)"
              strokeOpacity="0.3"
              strokeWidth="0.55"
              strokeDasharray="6 6"
            />
            {[4, 22, 40, 58, 76, 94].map((x) => (
              <rect
                key={x}
                x={x}
                y="74.25"
                width="1"
                height="0.7"
                rx="0.2"
                fill="var(--color-reflect)"
                fillOpacity="0.45"
              />
            ))}
            <ellipse cx="72.6" cy="70.6" rx="22" ry="1.8" fill="url(#dp-open-pool)" />
            <ellipse cx="72.6" cy="77.6" rx="1.3" ry="6.4" fill="url(#dp-open-wet)" />
            {/* Reflet du gyrophare : il suit la pulsation du gyrophare */}
            <ellipse className="beacon-glow" cx="41.4" cy="76.4" rx="1.6" ry="5.6" fill="url(#dp-open-beacon-wet)" />
          </svg>

          {/* La dépanneuse, garée nez à nez, gyrophare allumé */}
          <div className={styles.openTruck}>
            <TowTruck id="dp-open-truck" />
          </div>

          {/* La voiture du client, capot ouvert, feux de détresse (tournée vers la dépanneuse) */}
          <div className={styles.openCar}>
            <CarSide id="dp-open-car" hoodOpen hazards className={styles.openCarSvg} />
          </div>

          {/* Monde, plan avant : câbles de démarrage, pinces, courant */}
          <svg className={styles.openWorld} viewBox="0 0 100 84" preserveAspectRatio="xMidYMax slice">
            <path
              d={CABLE_BACK}
              fill="none"
              stroke="var(--color-asphalt-500)"
              strokeWidth="0.55"
              strokeLinecap="round"
            />
            <path
              className={styles.openCable}
              pathLength={1}
              d={CABLE_MAIN}
              fill="none"
              stroke="var(--color-signal-500)"
              strokeWidth="0.62"
              strokeLinecap="round"
            />
            <path
              className={styles.openCurrent}
              pathLength={1}
              d={CABLE_MAIN}
              fill="none"
              stroke="var(--color-reflect)"
              strokeWidth="0.5"
              strokeLinecap="round"
            />
            {/* Pinces : rouge (+) et noire (−), éclairées par le lampadaire */}
            <g>
              <rect x="52.5" y="61.9" width="1.7" height="1.5" rx="0.3" fill="var(--color-brake)" />
              <rect
                x="53.3"
                y="62.9"
                width="1.4"
                height="1.3"
                rx="0.3"
                fill="var(--color-asphalt-950)"
                stroke="var(--color-asphalt-400)"
                strokeWidth="0.15"
              />
              <rect x="67.7" y="61.1" width="1.6" height="1.5" rx="0.3" fill="var(--color-brake)" />
              <rect
                x="66.5"
                y="61.9"
                width="1.4"
                height="1.3"
                rx="0.3"
                fill="var(--color-asphalt-950)"
                stroke="var(--color-asphalt-400)"
                strokeWidth="0.15"
              />
            </g>
            {/* Fil du témoin : de la pince au témoin de charge */}
            <path
              d="M68.5 60.6V46.8"
              stroke="var(--color-chalk)"
              strokeOpacity="0.32"
              strokeWidth="0.18"
              strokeDasharray="0.6 0.6"
            />
            <circle cx="68.5" cy="60.8" r="0.55" fill="var(--color-chalk)" fillOpacity="0.7" />
          </svg>

          {/* Témoin de charge : se remplit une fois, puis reste plein */}
          <div className={styles.openCharge}>
            <svg
              viewBox="0 0 24 24"
              className={styles.openChargeIcon}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="7.5" width="18" height="11.5" rx="1.6" strokeWidth="1.9" />
              <path
                d="M6.5 7.5V5.6h3.2v1.9M14.3 7.5V5.6h3.2v1.9M6.4 13.2h3.6M14.1 13.2h3.6M15.9 11.4V15"
                strokeWidth="1.9"
              />
            </svg>
            <span className={styles.openChargeBar}>
              {Array.from({ length: CHARGE_SEGMENTS }, (_, i) => (
                <span key={i} className={styles.openChargeSeg} style={{ "--seg": i } as CSSProperties} />
              ))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
