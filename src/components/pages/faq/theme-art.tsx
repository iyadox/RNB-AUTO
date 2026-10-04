/**
 * Les objets de la route de chaque thème (docs/09, B.8 et F.5). Décor seulement (`aria-hidden`),
 * sauf les légendes du kit (`ThreeLegs`, `HighwayRelay`) qui sont du vrai texte.
 *
 * - Prix et paiement : les trois trajets de la dépanneuse (le calcul du prix).
 * - L'intervention : le bas-côté de nuit, la voiture en warnings, la dépanneuse qui arrive et freine.
 * - Autoroute : le relais à la sortie (le bleu n'apparaît que pour le panneau d'autoroute).
 * - Véhicules : la file des silhouettes transportées ; les plus grands véhicules marqués d'un « ? ».
 * - Photos et position : le viseur du téléphone sur un plan de nuit, l'épingle « Vous » qui tombe.
 *
 * Sans JavaScript et en `off` : états finaux (tracés complets, dépanneuse arrêtée, file complète,
 * épingle posée). Les états cachés n'existent que sous `html.motion-ready` (faq.module.css).
 */
import type { CSSProperties, ReactElement } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { VehicleIcon } from "@/components/brand/vehicle-icon";
import { Skyline } from "@/components/scenes/base/skyline";
import { StreetLamps } from "@/components/scenes/base/street-lamps";
import { CarSide } from "@/components/scenes/kit/car-side";
import { PinGlyph } from "@/components/scenes/kit/glyphs";
import { HighwayRelay } from "@/components/scenes/kit/highway-relay";
import { ThreeLegs } from "@/components/scenes/kit/three-legs";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import type { FaqTheme } from "@/content/faq";
import styles from "./faq.module.css";

function PriceArt(): ReactElement {
  return (
    <div className={styles.priceArt}>
      <ThreeLegs draw="view" />
    </div>
  );
}

function InterventionArt(): ReactElement {
  return (
    <div className={styles.street} aria-hidden="true" data-pause-offscreen>
      <Skyline layer="far" className={styles.streetSkyline} />
      <StreetLamps count={2} className={styles.streetLamps} />
      <div className={styles.streetRoad} />
      <div className={styles.streetCar}>
        <CarSide id="faq-street-car" hazards hoodOpen />
      </div>
      {/* Couloir immobile observé par le runtime ; la dépanneuse à l'intérieur arrive (P16). */}
      <div className={styles.streetLane} data-inview-once>
        <div className={styles.streetMover}>
          <div className={styles.streetTruck}>
            <TowTruck id="faq-street-truck" headlights />
          </div>
        </div>
      </div>
    </div>
  );
}

function RelayArt(): ReactElement {
  return (
    <div className={styles.relayArt}>
      <HighwayRelay draw="view" />
    </div>
  );
}

/** Silhouettes dans l'ordre de la réponse ; le grand fourgon ferme la file, avec un « ? ». */
const CONVOY = ["citadine", "berline", "break", "suv", "4x4", "utilitaire", "petit_fourgon"] as const;

function VehiclesArt(): ReactElement {
  return (
    <div className={styles.convoy} data-inview-once aria-hidden="true">
      <div className={styles.convoyRow}>
        {CONVOY.map((code, index) => (
          <div key={code} className={styles.vehicle} style={{ "--i": index } as CSSProperties}>
            <span className={styles.vehicleBeam} />
            <span className={styles.vehicleTail} />
            <VehicleIcon code={code} className={styles.vehicleIcon} />
          </div>
        ))}
        <div className={cn(styles.vehicle, styles.vehicleBig)} style={{ "--i": CONVOY.length } as CSSProperties}>
          <span className={styles.bigMark}>
            <Icon name="question" size={18} strokeWidth={2.4} />
          </span>
          <VehicleIcon code="grand_fourgon" className={styles.vehicleIcon} />
        </div>
      </div>
    </div>
  );
}

/** Rues du plan de nuit (repère 400 × 340), autour de l'épingle « Vous ». */
const STREETS_H = [42, 108, 236, 300];
const STREETS_V = [36, 120, 284, 360];

function PhotosArt(): ReactElement {
  return (
    <div className={styles.finder} data-inview-once data-pause-offscreen aria-hidden="true">
      <svg className={styles.finderMap} viewBox="0 0 400 340" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="faq-finder-lamp">
            <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="340" fill="var(--color-night-950)" fillOpacity="0.55" />
        {/* Petites rues */}
        {STREETS_H.map((y) => (
          <path key={`h${y}`} d={`M0 ${y}H400`} stroke="var(--color-asphalt-800)" strokeWidth="14" />
        ))}
        {STREETS_V.map((x) => (
          <path key={`v${x}`} d={`M${x} 0V340`} stroke="var(--color-asphalt-800)" strokeWidth="14" />
        ))}
        {/* Avenue principale, en biais, avec son axe */}
        <path d="M-20 250C90 222 160 182 200 170S330 110 420 96" fill="none" stroke="var(--color-asphalt-700)" strokeWidth="28" />
        <path d="M-20 250C90 222 160 182 200 170S330 110 420 96" fill="none" stroke="var(--color-chalk)" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="10 12" />
        {/* Lampadaires de l'avenue */}
        {[
          [70, 214],
          [200, 156],
          [330, 108],
        ].map(([x, y]) => (
          <g key={x}>
            <circle cx={x} cy={y} r="46" fill="url(#faq-finder-lamp)" />
            <circle cx={x} cy={y! - 18} r="3" fill="var(--color-sodium)" />
          </g>
        ))}
        {/* Onde de localisation autour de l'épingle : boucle douce, seulement une fois le runtime
            prêt (sans JavaScript, seules les boucles de l'ouverture tournent), pause hors écran. */}
        <circle className={styles.finderRing} cx="200" cy="172" r="20" fill="none" stroke="var(--color-beacon-400)" strokeWidth="1.6" />
        <rect className={styles.focus} x="160" y="120" width="80" height="84" rx="4" />
        <g transform="translate(200 172)">
          <g className={styles.finderPin}>
            <PinGlyph label="Vous" />
          </g>
        </g>
      </svg>
      <div className={styles.finderFrame}>
        <span className={styles.corner} />
        <span className={styles.corner} />
        <span className={styles.corner} />
        <span className={styles.corner} />
      </div>
      <span className={cn(styles.finderChip, styles.finderChip_camera)}>
        <Icon name="camera" size={20} strokeWidth={2.2} />
      </span>
      <span className={cn(styles.finderChip, styles.finderChip_locate)}>
        <Icon name="locate" size={20} strokeWidth={2.2} />
      </span>
    </div>
  );
}

export const THEME_ART: Record<FaqTheme, () => ReactElement> = {
  prix: PriceArt,
  intervention: InterventionArt,
  autoroute: RelayArt,
  vehicules: VehiclesArt,
  "photos-position": PhotosArt,
};
