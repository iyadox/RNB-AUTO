/**
 * /depannage, PK 03 « Si la réparation n'est pas possible sur place » (heure bleue, F.1).
 *
 * Le texte existant et le panneau vers le remorquage, puis la scène : au bout du bas-côté, sous
 * un lampadaire, la voiture monte sur le plateau (`LoadingSequence` : liée au défilement sur
 * ordinateur, jouée une fois ailleurs). Une balise à chevrons indique la suite de la route.
 * Sans JavaScript et en `off` : voiture chargée, plateau à plat, phares allumés.
 */
import type { ReactElement } from "react";
import { Skyline } from "@/components/scenes/base/skyline";
import { DirectionSign } from "@/components/scenes/kit/direction-sign";
import { LoadingSequence } from "@/components/scenes/kit/loading-sequence";
import styles from "./depannage.module.css";

function TowStage(): ReactElement {
  return (
    <div className={styles.towFrame} aria-hidden="true">
      <div className={styles.towStage}>
        <div className={styles.towGlow} />
        <Skyline layer="near" className={styles.towSkyline} />

        {/* Lampadaire au sodium (à gauche) et balise à chevrons (à droite) */}
        <svg className={styles.towWorld} viewBox="0 0 100 56" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="dp-tow-cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.3" />
              <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0.04" />
            </linearGradient>
            <radialGradient id="dp-tow-halo">
              <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.5" />
              <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="dp-tow-road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--color-asphalt-800)" />
              <stop offset="1" stopColor="var(--color-night-950)" stopOpacity="0" />
            </linearGradient>
            <pattern id="dp-tow-chevrons" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="1.5" height="3" fill="var(--color-signal-500)" />
              <rect x="1.5" width="1.5" height="3" fill="var(--color-asphalt-950)" />
            </pattern>
          </defs>

          <circle cx="14" cy="9" r="11" fill="url(#dp-tow-halo)" />
          <polygon points="12,9.6 16,9.6 34,47 -6,47" fill="url(#dp-tow-cone)" />
          <rect x="4.2" y="10.5" width="0.9" height="36.5" fill="var(--color-asphalt-700)" />
          <path d="M4.65 11.6Q4.65 8.4 7.8 8.4H12" fill="none" stroke="var(--color-asphalt-700)" strokeWidth="0.75" />
          <path d="M11.4 7.6H17.2Q17.6 9.2 16.2 9.6H12.2Q10.9 9.2 11.4 7.6Z" fill="var(--color-asphalt-750)" />
          <rect x="12.2" y="9.3" width="4" height="0.55" rx="0.25" fill="var(--color-sodium)" />

          {/* Chaussée et ligne de rive */}
          <rect x="0" y="47" width="100" height="9" fill="url(#dp-tow-road)" />
          <path d="M0 47H100" stroke="var(--color-chalk)" strokeOpacity="0.16" strokeWidth="0.25" />
          <path d="M-2 50.6H102" stroke="var(--color-chalk)" strokeOpacity="0.26" strokeWidth="0.45" strokeDasharray="5 5" />
          <ellipse cx="14" cy="47.4" rx="18" ry="1.4" fill="var(--color-sodium)" fillOpacity="0.14" />

          {/* Balise de virage à chevrons : la route continue */}
          <rect x="93.2" y="36" width="0.7" height="11" fill="var(--color-asphalt-600)" />
          <rect x="89.6" y="31.4" width="7.6" height="5.4" rx="0.5" fill="url(#dp-tow-chevrons)" />
          <rect x="89.6" y="31.4" width="7.6" height="5.4" rx="0.5" fill="none" stroke="var(--color-reflect)" strokeOpacity="0.4" strokeWidth="0.2" />
        </svg>

        <LoadingSequence id="dp-chargement" mode="scrub" className={styles.towLoading} />
      </div>
    </div>
  );
}

export function TowFallback(): ReactElement {
  return (
    <div className={styles.tow}>
      <div className={styles.towCopy}>
        <p className={styles.towText} data-reveal="">
          Certaines pannes ne se réparent pas au bord de la route. Dans ce cas, nous vous proposons de remorquer votre
          véhicule vers le garage de votre choix, votre domicile ou toute autre adresse. Le nouveau prix vous est
          annoncé avant de partir.
        </p>
        <DirectionSign
          href="/remorquage"
          title="Découvrir le remorquage"
          subtitle="Remorquage"
          arrow="right"
          pictogram="truck"
          className={styles.towSign}
        />
      </div>
      <TowStage />
    </div>
  );
}
