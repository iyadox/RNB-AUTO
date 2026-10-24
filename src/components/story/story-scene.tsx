"use client";

/**
 * Dessins du décor « de la commande à l'arrivée » (monté après coup par `StoryBackdrop`).
 *
 * Plans, dans l'ordre du défilement. Chaque acte suit la progression de sa fenêtre (`StoryWindow`,
 * de 0 quand elle entre par le bas à 1 quand elle sort par le haut) ; l'aube suit la piste.
 * Acte 1 (fenêtre 1)
 *   0,15 → 0,37  le téléphone sort de l'écran, en zoom (la personne commande) ;
 *   0,38 → 0,57  son écran : position, « Demander un dépannage », « Demande reçue », prix estimé,
 *                trajet de la dépanneuse depuis Bobigny ;
 *   0,58 → 0,76  on plonge dans l'épingle et on traverse l'écran : la nuit, la route, la voiture
 *                en panne (feux de détresse) ;
 * Acte 2 (fenêtre 2)
 *   0,14 → 0,50  la dépanneuse arrive (phares, gyrophare), double la voiture et se range devant ;
 * Acte 3 (fenêtre 3)
 *   0,19 → 0,45  chargement : plateau incliné, treuil, la voiture monte, plateau à plat ;
 *   0,48 → 0,70  elle repart, chargée ; les lampadaires s'éteignent ;
 * Aube (piste) : de 0,72 à 1, elle se lève sur la route vide (puis « On arrive. » prend le relais).
 *
 * Tout est en `transform`, `opacity` et `stroke-dashoffset` (C.1-7). La chorégraphie est écrite
 * une seule fois, en images clés CSS (story.module.css) ; seule la source de la progression change.
 * Sans animation (niveaux `lite` et `off`), l'état de base est l'image fixe : la dépanneuse
 * arrivée devant la voiture, gyrophare allumé, de nuit.
 *
 * Aucun texte inventé : les libellés du téléphone sont ceux du site (aucun montant, aucun délai).
 * Les dessins de la dépanneuse et de la voiture sont ceux du kit : la même voiture partout.
 */
import type { ReactElement } from "react";
import { LogoMark } from "@/components/brand/logo";
import { TowTruck } from "@/components/brand/tow-truck";
import { CarSideBody } from "@/components/scenes/kit/car-side";
import { cn } from "@/components/ui/cn";
import styles from "./story.module.css";

/** Plan schématique de l'écran du téléphone (rues, Seine, périphérique). Repère 200 × 200. */
const MAP_STREETS =
  "M-5 40C40 52 80 46 120 60S180 92 205 88M-5 120C30 112 60 128 96 126S160 104 205 118M30-5C40 40 52 80 48 120S56 180 62 205M140-5C132 30 136 70 150 104S158 170 170 205M-5 168C50 160 100 176 205 160M90-5C96 40 88 70 100 100";
const MAP_RING = "M60 132C44 110 52 78 80 68S136 62 146 90 136 140 108 150 72 150 60 132Z";
const MAP_RIVER = "M-5 150C30 140 46 160 70 150S100 120 130 132 170 168 205 150";
/** Trajet de la dépanneuse : du dépôt (losange) à la position (épingle). */
const MAP_ROUTE = "M156 58C150 74 134 80 124 92S100 106 92 118 80 134 76 140";

function PhoneScreen(): ReactElement {
  return (
    <div className={styles.screen}>
      <div className={styles.notch} />
      <div className={styles.appBar}>
        <LogoMark className={styles.appLogo} />
        <span>RNB AUTO</span>
      </div>
      <p className={styles.appTitle}>Où êtes-vous ?</p>
      <svg className={styles.map} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
        <path d={MAP_RIVER} fill="none" stroke="#1d3a5a" strokeWidth="9" strokeLinecap="round" />
        <path d={MAP_STREETS} fill="none" stroke="#30425f" strokeWidth="2.2" />
        <path d={MAP_RING} fill="none" stroke="#46597a" strokeWidth="3.2" />
        <path
          className={cn(styles.a, styles.route)}
          d={MAP_ROUTE}
          pathLength={1}
          fill="none"
          stroke="#ffc400"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        {/* Dépôt : losange jaune */}
        <path d="M156 47l11 11-11 11-11-11z" fill="#ffc400" stroke="#08090b" strokeWidth="1.5" />
        <text x="156" y="84" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="1.2" fill="#ffc400">
          BOBIGNY
        </text>
        {/* Position : onde, puis épingle qui tombe */}
        <circle className={cn(styles.a, styles.ring)} cx="76" cy="146" r="16" fill="none" stroke="#ff9a3d" strokeWidth="2" />
        <g className={cn(styles.a, styles.pin)}>
          <ellipse cx="76" cy="146" rx="6" ry="2.4" fill="#000" opacity="0.5" />
          <path d="M76 146c-8-11-13-17-13-24a13 13 0 0 1 26 0c0 7-5 13-13 24z" fill="#ff7a1a" />
          <circle cx="76" cy="122" r="5" fill="#08090b" />
          <text x="76" y="164" textAnchor="middle" fontSize="10" fontWeight="800" fill="#f5f3ee">
            Vous
          </text>
        </g>
      </svg>

      <div className={cn(styles.a, styles.cta)}>
        <span>Demander un dépannage</span>
        <span aria-hidden="true">→</span>
        <i className={cn(styles.a, styles.tap)} />
      </div>

      <div className={cn(styles.a, styles.sheet)}>
        <div className={styles.sent}>
          <svg viewBox="0 0 24 24" className={styles.check}>
            <circle cx="12" cy="12" r="11" fill="#25d366" />
            <path className={cn(styles.a, styles.checkMark)} d="M6.5 12.4l3.6 3.6 7.4-7.6" pathLength={1} fill="none" stroke="#08090b" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Demande reçue</span>
        </div>
        <div className={cn(styles.a, styles.ticket)}>
          <span className={styles.ticketLabel}>Prix estimé</span>
          {/* Montant volontairement illisible : aucun prix n'est inventé dans le décor. */}
          <i className={cn(styles.a, styles.bar, styles.barBig)} />
          <i className={cn(styles.a, styles.bar)} />
          <i className={cn(styles.a, styles.bar, styles.barShort)} />
        </div>
        <div className={styles.depart}>
          <span>La dépanneuse part</span>
          <i className={styles.meter}>
            <i className={cn(styles.a, styles.fill)} />
          </i>
        </div>
      </div>

      <div className={styles.glare} />
      <div className={cn(styles.a, styles.flash)} />
    </div>
  );
}

/**
 * `step` : montage par tranches (temps de blocage). 1 : ciel, ville, lampadaires et route ;
 * 2 : la voiture et la dépanneuse ; 3 : le téléphone. Chaque tranche est rendue au moment calme
 * suivant, pour qu'aucune ne fasse une longue tâche (style, mise en page, peinture).
 */
export default function StoryScene({ step = 3 }: { step?: 1 | 2 | 3 }): ReactElement {
  return (
    <>
      <div className={cn(styles.a, styles.dim)}>
        <div className={cn(styles.a, styles.world)}>
          <div className={cn(styles.a, styles.dawn)} />
          {/* Le soleil se lève derrière la ville : il ne dépasse jamais l'horizon par le bas. */}
          <div className={styles.sunClip}>
            <div className={cn(styles.a, styles.sun)} />
          </div>
          <div className={cn(styles.a, styles.skyFar)} />
          <div className={cn(styles.a, styles.skyNear)} />
          <div className={cn(styles.a, styles.cones)} />
          <div className={cn(styles.a, styles.lamps)} />
          <div className={cn(styles.a, styles.road)}>
            <div className={cn(styles.a, styles.lane)} />
          </div>

          {step >= 2 ? (
            <>
              {/* La voiture du client : au bord de la route, puis sur le plateau. */}
              <div className={cn(styles.a, styles.car)}>
                <svg viewBox="0 0 240 110" className={styles.carSvg}>
                  <ellipse className={cn(styles.a, styles.carShadow)} cx="122" cy="92" rx="104" ry="4" fill="#000" opacity="0.6" />
                  <CarSideBody id="story-car" hazards ground={false} />
                </svg>
              </div>

              <div className={cn(styles.a, styles.truck)}>
                <div className={styles.pool} />
                <div className={styles.beaconWash} />
                <TowTruck id="story-truck" parts cable headlights beacon className={styles.truckSvg} />
              </div>
            </>
          ) : null}
        </div>
      </div>

      {step >= 3 ? (
        <>
          {/* Traversée de l'écran : traînées de lumière qui filent vers les bords. */}
          <div className={cn(styles.a, styles.warp)} />

          <div className={styles.phoneSlot}>
            <div className={cn(styles.a, styles.phone)}>
              <PhoneScreen />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
