/**
 * Ouverture de /remorquage (docs/09, F.2, PK 00) : l'aire de chargement, de nuit.
 *
 * Sous le cône d'un lampadaire au sodium, la dépanneuse attend au bord de la chaussée mouillée,
 * plateau incliné, la voiture au pied de la rampe : le câble se tend, la voiture monte, le
 * plateau revient à plat, les phares s'allument (`LoadingSequence`). Ordinateur : lié au
 * défilement, jusqu'à ce que la scène atteigne le haut de l'écran (environ 40 vh) ; mobile : joué
 * une fois. Sans JavaScript et en `off` : voiture
 * chargée. À droite (≥ 640 px), un panneau de direction sans texte (garage, domicile, adresse).
 *
 * Repère : un « monde » de 100 × 70 unités ancré en bas (`xMidYMax slice`) ; une unité vaut
 * 1cqw (largeur du cadre). La chaussée commence à y = 56, soit 14cqw au-dessus du bas du cadre ;
 * les éléments HTML (séquence, panneau) sont placés en cqw dans le même repère. Quand le cadre
 * est moins haut (mobile), c'est le haut du monde (tête du lampadaire) qui est rogné.
 * Tout est décoratif (`aria-hidden`) : le titre et l'accroche disent la même chose.
 */
import type { CSSProperties, ReactElement } from "react";
import { Skyline } from "@/components/scenes/base/skyline";
import { LoadingSequence } from "@/components/scenes/kit/loading-sequence";
import { Icon, type IconName } from "@/components/ui/icon";
import styles from "./remorquage.module.css";

const SIGN_ROWS: { icon: IconName; arrow: string }[] = [
  { icon: "garage", arrow: "M4 12h14M12 6l6 6-6 6" },
  { icon: "home", arrow: "M6 18 18 6M9 6h9v9" },
  { icon: "pin", arrow: "M12 20V5M6 11l6-6 6 6" },
];

/**
 * Fin du chargement lié au défilement : quand le bas de la scène passe à 22 % du haut de l'écran
 * (un peu plus d'un tiers d'écran de défilement), la scène est encore visible sous l'en-tête.
 * Le « +=60% » par défaut se compte depuis un début non borné : la scène étant déjà dans l'écran
 * au chargement, le chargement se terminait en 150 px.
 */
const SCRUB_END = "bottom 22%";

/** Plots rétroréfléchissants de la ligne de rive (abscisses du monde). */
const STUDS = [6, 18, 30, 42, 54, 66, 78, 90];

export function OpeningScene(): ReactElement {
  return (
    <div className={styles.openFrame} data-loops-nojs="" aria-hidden="true">
      <div className={styles.openStage}>
        <div className={styles.openWorldBox}>
          <div className={styles.openGlow} />
          <div className={styles.openSkylineWrap} data-parallax="" style={{ "--depth": 0.3 } as CSSProperties}>
            <Skyline layer="far" className={styles.openSkyline} />
          </div>

          {/* Monde, plan arrière : lampadaire, cône, chaussée mouillée, reflets */}
          <svg className={styles.openWorld} viewBox="0 0 100 70" preserveAspectRatio="xMidYMax slice">
            <defs>
              <linearGradient id="rq-open-cone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.36" />
                <stop offset="0.7" stopColor="var(--color-sodium)" stopOpacity="0.09" />
                <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0.04" />
              </linearGradient>
              <radialGradient id="rq-open-halo">
                <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.55" />
                <stop offset="0.3" stopColor="var(--color-sodium)" stopOpacity="0.15" />
                <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="rq-open-pool">
                <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.36" />
                <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="rq-open-road" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-asphalt-800)" />
                <stop offset="0.55" stopColor="var(--color-asphalt-900)" />
                <stop offset="1" stopColor="var(--color-night-950)" />
              </linearGradient>
              <linearGradient id="rq-open-wet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0.34" />
                <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="rq-open-beacon-wet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-beacon-500)" stopOpacity="0.5" />
                <stop offset="1" stopColor="var(--color-beacon-500)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Trottoir de l'aire de chargement, derrière les véhicules */}
            <path d="M0 52.6Q40 51.8 100 52.4V56H0Z" fill="var(--color-asphalt-900)" />
            <path
              d="M0 52.6Q40 51.8 100 52.4"
              fill="none"
              stroke="var(--color-sodium)"
              strokeOpacity="0.14"
              strokeWidth="0.22"
            />

            {/* Lampadaire au sodium au-dessus de la rampe : halo, cône, mât, crosse */}
            <circle cx="29" cy="15.4" r="13" fill="url(#rq-open-halo)" />
            <polygon points="26.4,16 31.6,16 50,56 8,56" fill="url(#rq-open-cone)" />
            <rect x="8.4" y="17.6" width="1" height="38.4" fill="var(--color-asphalt-750)" />
            <rect x="8.4" y="17.6" width="0.28" height="38.4" fill="var(--color-sodium)" fillOpacity="0.2" />
            <path d="M8.9 19Q8.9 14.6 13.3 14.6H26" fill="none" stroke="var(--color-asphalt-700)" strokeWidth="0.85" />
            <path
              d="M8.9 19Q8.9 14.75 13.3 14.75H26"
              fill="none"
              stroke="var(--color-sodium)"
              strokeOpacity="0.25"
              strokeWidth="0.15"
            />
            <path d="M25 13.6H33Q33.5 15.4 31.8 16H26.2Q24.5 15.4 25 13.6Z" fill="var(--color-asphalt-750)" />
            <rect x="26.4" y="15.6" width="5.2" height="0.6" rx="0.3" fill="var(--color-sodium)" />

            {/* Chaussée mouillée : bord, tirets, plots rétroréfléchissants */}
            <rect x="0" y="56" width="100" height="14" fill="url(#rq-open-road)" />
            <path d="M0 56H100" stroke="var(--color-chalk)" strokeOpacity="0.16" strokeWidth="0.22" />
            <path
              d="M-3 62.6H103"
              stroke="var(--color-chalk)"
              strokeOpacity="0.28"
              strokeWidth="0.5"
              strokeDasharray="6 6"
            />
            {STUDS.map((x) => (
              <rect
                key={x}
                x={x}
                y="62.3"
                width="0.9"
                height="0.6"
                rx="0.2"
                fill="var(--color-reflect)"
                fillOpacity="0.45"
              />
            ))}

            {/* Reflets sur la chaussée : flaque du lampadaire, gyrophare (suit sa pulsation) */}
            <ellipse cx="29" cy="56.6" rx="21" ry="1.7" fill="url(#rq-open-pool)" />
            <ellipse cx="29" cy="62.4" rx="1.2" ry="6.2" fill="url(#rq-open-wet)" />
            <ellipse className="beacon-glow" cx="59.3" cy="61.6" rx="1.3" ry="5.2" fill="url(#rq-open-beacon-wet)" />
          </svg>

          {/* La séquence de chargement, posée sur la chaussée (sol de la séquence à 90,9 %) */}
          <LoadingSequence
            id="remorquage-chargement"
            mode="scrub"
            scrubEnd={SCRUB_END}
            className={styles.openLoading}
          />

          {/* Panneau de direction sans texte : garage, domicile, toute adresse */}
          <div className={styles.openSign}>
            <div className={styles.openSignPlate}>
              {SIGN_ROWS.map((row) => (
                <span key={row.icon} className={styles.openSignRow}>
                  <Icon name={row.icon} size={18} strokeWidth={2.2} />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={row.arrow} />
                  </svg>
                </span>
              ))}
            </div>
            <span className={styles.openSignPost} />
          </div>
        </div>
      </div>
    </div>
  );
}
