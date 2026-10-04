/**
 * /depannage, PK 01 « Ce que nous réglons sur place » : le tableau de bord (docs/09, F.1, P15).
 *
 * Un combiné d'instruments : un compte-tours décoratif dont l'aiguille fait le balayage de mise
 * du contact (une fois, à l'entrée), et six voyants allumés, chacun avec son titre et son texte
 * existants, toujours visibles (le texte n'est jamais caché ni retardé).
 * - Ordinateur : voyants en 3 × 2, séparés par des tirets de marquage.
 * - Mobile : une colonne (voyant de 56 px, titre, texte).
 * La mise du contact (`VoyantGroup`, `data-ignite`) allume les voyants en cascade.
 * Sans JavaScript et en `off` : tous allumés, aiguille au repos.
 */
import type { ReactElement } from "react";
import { Voyant, VoyantGroup, type VoyantGlyph } from "@/components/scenes/kit/voyant";
import { RoadStuds } from "./road-marks";
import styles from "./depannage.module.css";

type Situation = { glyph: VoyantGlyph; title: string; text: string };

/** Textes existants de la page, mot pour mot. */
const SITUATIONS: readonly Situation[] = [
  {
    glyph: "battery",
    title: "Batterie à plat",
    text: "Démarrage avec un booster professionnel. Si la batterie est hors d'usage, nous vous conseillons pour la suite.",
  },
  {
    glyph: "tpms",
    title: "Crevaison",
    text: "Montage de votre roue de secours. Sans roue de secours, ou si la jante est abîmée, nous emmenons le véhicule.",
  },
  {
    glyph: "engine",
    title: "Petite panne",
    text: "Nous évaluons la situation sur place. Si la réparation n'est pas possible au bord de la route, nous remorquons.",
  },
  {
    glyph: "parking",
    title: "Véhicule en parking",
    text: "Parking souterrain, résidence, centre commercial : indiquez-le, nous venons préparés à l'accès.",
  },
  {
    glyph: "access",
    title: "Accès difficile",
    text: "Ruelle, pente, véhicule mal placé : décrivez la situation pour que nous arrivions avec le bon matériel.",
  },
  {
    glyph: "question",
    title: "Autre problème",
    text: "Vous ne savez pas ce qui se passe ? Décrivez ce que vous voyez, nous vous rappelons pour en parler.",
  },
];

/* Compte-tours : arc de 240° (de 150° à 390°, sens horaire, 0° = vers la droite). */
const GAUGE = { cx: 120, cy: 120, r: 96 };
const START = 150;
const SWEEP = 240;

const polar = (angle: number, radius: number) => {
  const a = (angle * Math.PI) / 180;
  return {
    x: GAUGE.cx + radius * Math.cos(a),
    y: GAUGE.cy + radius * Math.sin(a),
  };
};
const fmt = (v: number) => (Math.round(v * 100) / 100).toString();

function arcPath(from: number, to: number, radius: number): string {
  const a = polar(from, radius);
  const b = polar(to, radius);
  const large = to - from > 180 ? 1 : 0;
  return `M${fmt(a.x)} ${fmt(a.y)}A${radius} ${radius} 0 ${large} 1 ${fmt(b.x)} ${fmt(b.y)}`;
}

/** Graduations : une grande tous les 30°, une petite tous les 6°. */
const TICKS = Array.from({ length: SWEEP / 6 + 1 }, (_, i) => {
  const angle = START + i * 6;
  const major = i % 5 === 0;
  const outer = polar(angle, GAUGE.r - 2);
  const inner = polar(angle, GAUGE.r - (major ? 15 : 8));
  return {
    key: i,
    major,
    red: angle >= 360,
    d: `M${fmt(outer.x)} ${fmt(outer.y)}L${fmt(inner.x)} ${fmt(inner.y)}`,
  };
});

function Tachometer(): ReactElement {
  return (
    <svg viewBox="0 0 240 200" className={styles.dashGauge} aria-hidden="true">
      <defs>
        <radialGradient id="dp-gauge-face" cx="50%" cy="60%" r="60%">
          <stop offset="0" stopColor="var(--color-night-800)" />
          <stop offset="1" stopColor="var(--color-night-950)" />
        </radialGradient>
        <radialGradient id="dp-gauge-glow">
          <stop offset="0" stopColor="var(--color-led)" stopOpacity="0.22" />
          <stop offset="1" stopColor="var(--color-led)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Cadran et lunette */}
      <circle cx={GAUGE.cx} cy={GAUGE.cy} r={GAUGE.r + 12} fill="url(#dp-gauge-face)" />
      <circle
        cx={GAUGE.cx}
        cy={GAUGE.cy}
        r={GAUGE.r + 12}
        fill="none"
        stroke="var(--color-reflect)"
        strokeOpacity="0.12"
        strokeWidth="1.5"
      />
      <circle
        cx={GAUGE.cx}
        cy={GAUGE.cy}
        r={GAUGE.r + 5}
        fill="none"
        stroke="var(--color-asphalt-700)"
        strokeWidth="1"
      />
      <circle cx={GAUGE.cx} cy={GAUGE.cy} r={GAUGE.r * 0.7} fill="url(#dp-gauge-glow)" />
      {/* Arc éclairé et zone rouge */}
      <path
        d={arcPath(START, START + SWEEP, GAUGE.r)}
        fill="none"
        stroke="var(--color-led)"
        strokeOpacity="0.32"
        strokeWidth="2"
      />
      <path
        d={arcPath(360, START + SWEEP, GAUGE.r - 4)}
        fill="none"
        stroke="var(--color-brake)"
        strokeOpacity="0.75"
        strokeWidth="6"
      />
      {TICKS.map((tick) => (
        <path
          key={tick.key}
          d={tick.d}
          stroke={tick.red ? "var(--color-brake)" : "var(--color-chalk)"}
          strokeOpacity={tick.major ? 0.85 : 0.4}
          strokeWidth={tick.major ? 2.4 : 1.1}
          strokeLinecap="round"
        />
      ))}
      {/* Aiguille : au repos sur la première graduation ; balayage de mise du contact */}
      <g className={styles.dashNeedle} style={{ transformOrigin: `${GAUGE.cx}px ${GAUGE.cy}px` }}>
        <g transform={`rotate(${START} ${GAUGE.cx} ${GAUGE.cy})`}>
          <path
            d={`M${GAUGE.cx - 14} ${GAUGE.cy - 1.6}L${GAUGE.cx + GAUGE.r - 10} ${GAUGE.cy - 0.6}L${GAUGE.cx + GAUGE.r - 10} ${GAUGE.cy + 0.6}L${GAUGE.cx - 14} ${GAUGE.cy + 1.6}Z`}
            fill="var(--color-beacon-500)"
          />
        </g>
      </g>
      <circle
        cx={GAUGE.cx}
        cy={GAUGE.cy}
        r="9"
        fill="var(--color-asphalt-800)"
        stroke="var(--color-asphalt-600)"
        strokeWidth="1.5"
      />
      <circle cx={GAUGE.cx} cy={GAUGE.cy} r="3" fill="var(--color-asphalt-500)" />
    </svg>
  );
}

/** Le haut de la planche de bord, vu du siège conducteur : pleine largeur, derrière le combiné. */
function Cowl(): ReactElement {
  return (
    <svg className={styles.dashCowl} viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="dp-cowl-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-night-950)" stopOpacity="0.92" />
          <stop offset="0.55" stopColor="var(--color-night-950)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--color-night-950)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="dp-cowl-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-sodium)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--color-sodium)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--color-sodium)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M0 170C240 118 520 96 720 96S1200 118 1440 170V400H0Z" fill="url(#dp-cowl-fill)" />
      <path
        d="M0 170C240 118 520 96 720 96S1200 118 1440 170"
        fill="none"
        stroke="url(#dp-cowl-edge)"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Dashboard(): ReactElement {
  return (
    <>
      <Cowl />
      <div className={styles.dash}>
        <div className={styles.dashGaugeSlot} data-inview-once="">
          <Tachometer />
        </div>

        <div className={styles.dashPanel}>
          <div className={styles.dashHood} aria-hidden="true" />
          <VoyantGroup as="ul" className={styles.dashGrid}>
            {SITUATIONS.map((situation) => (
              <li key={situation.title} className={styles.dashItem}>
                <Voyant
                  glyph={situation.glyph}
                  label={situation.title}
                  showLabel={false}
                  className={styles.dashVoyant}
                />
                <div className={styles.dashCopy}>
                  <h3 className={styles.dashTitle}>{situation.title}</h3>
                  <p className={styles.dashText}>{situation.text}</p>
                </div>
              </li>
            ))}
          </VoyantGroup>
        </div>
      </div>
      <RoadStuds />
    </>
  );
}
