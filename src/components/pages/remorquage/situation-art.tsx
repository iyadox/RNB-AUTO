/**
 * Vignettes des six situations de remorquage (docs/09, F.2, PK 01) : 64 unités, à côté de chaque
 * texte (mobile, sans JavaScript, `off`, et en repère sur ordinateur). La grande scène du plateau
 * (ordinateur seulement) est dans `stage-art.tsx`, chargée à la demande.
 * Couleurs par jetons (`var(--color-…)`). Tout est décoratif : le `<svg>` porte `aria-hidden`,
 * l'information est dans le texte de chaque étape.
 */
import type { ReactElement } from "react";

import type { SituationKind } from "./situations";

const CHALK = "var(--color-chalk)";
const BRAKE = "var(--color-brake)";
const SODIUM = "var(--color-sodium)";
const NIGHT = "var(--color-night-950)";
const STROKE = { stroke: CHALK, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Vignette d'une situation (64 × 64). */
export function SituationVignette({ kind }: { kind: SituationKind }): ReactElement {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      {VIGNETTES[kind]}
    </svg>
  );
}

const VIGNETTES: Record<SituationKind, ReactElement> = {
  // Roue calée, marquée en rouge : le véhicule ne roule pas.
  "non-roulant": (
    <g>
      <path d="M6 51H58" stroke={CHALK} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <circle cx="25" cy="37" r="18" fill="none" stroke={BRAKE} strokeWidth="2" strokeDasharray="3.2 3.2" />
      <circle cx="25" cy="37" r="13" fill={NIGHT} {...STROKE} />
      <circle cx="25" cy="37" r="7" fill="none" stroke={CHALK} strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="25" cy="37" r="2.6" fill={CHALK} />
      <path d="M39 51H57L43.5 38.5Q40.5 37 39 40.5Z" fill={CHALK} />
      <path d="M45.5 51l3-3.4M50.5 51l2.6-2.9" stroke={NIGHT} strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  // Avant enfoncé, éclats au sol.
  accident: (
    <g>
      <path d="M4 51H60" stroke={CHALK} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6 45V37Q6 33 10 32L19 30.5L26 22.5Q28 20.5 31 20.5H39.5L43.5 25L40.5 27.5L46.5 28.5L43.5 32.5L50 33.5L46 37.5L51.5 40L48.5 45Z"
        fill={CHALK}
        fillOpacity="0.12"
        {...STROKE}
      />
      <path d="M21 29.5L27.5 23.5H33.5V29.5Z" fill={CHALK} fillOpacity="0.45" />
      <circle cx="16" cy="45" r="5.6" fill={NIGHT} {...STROKE} />
      <path d="M55.5 24.5l3.5-3.5M56 30.5h5M54.5 35.5l3.5 3" stroke={BRAKE} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M52 51l2.5-3 2 3zM45 51l1.6-2.2 1.6 2.2z" fill={CHALK} fillOpacity="0.7" />
    </g>
  ),
  // Roue bloquée : cerclée de rouge, cadenas.
  "roues-bloquees": (
    <g>
      <path d="M6 54H58" stroke={CHALK} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 56.5H22" stroke={CHALK} strokeOpacity="0.5" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="29" cy="39" r="18.5" fill="none" stroke={BRAKE} strokeWidth="2.4" />
      <circle cx="29" cy="39" r="14" fill={NIGHT} {...STROKE} />
      <path d="M29 30.5V47.5M20.5 39H37.5M23 33l12 12M35 33L23 45" stroke={CHALK} strokeOpacity="0.4" strokeWidth="1.4" />
      <circle cx="29" cy="39" r="3" fill={CHALK} />
      <rect x="44" y="14" width="13" height="10.5" rx="2.2" fill={BRAKE} />
      <path d="M46.6 14v-3a3.9 3.9 0 0 1 7.8 0v3" fill="none" stroke={CHALK} strokeWidth="2" strokeLinecap="round" />
      <circle cx="50.5" cy="19.2" r="1.4" fill={NIGHT} />
    </g>
  ),
  // Barre de hauteur au-dessus du toit (aucune cote : jamais de chiffre inventé).
  parking: (
    <g>
      <defs>
        <pattern id="rqv-park-chev" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4" height="8" fill="var(--color-signal-500)" />
          <rect x="4" width="4" height="8" fill={NIGHT} />
        </pattern>
      </defs>
      <path d="M4 7H60" stroke={CHALK} strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 8V15M47 8V15" stroke={CHALK} strokeOpacity="0.6" strokeWidth="1.6" strokeDasharray="2 1.6" />
      <rect x="9" y="15" width="46" height="7.5" rx="1.6" fill="url(#rqv-park-chev)" stroke={NIGHT} strokeWidth="1" />
      <path d="M32 26.5V33.5M29.6 29l2.4-2.5 2.4 2.5M29.6 31l2.4 2.5 2.4-2.5" fill="none" stroke={CHALK} strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M8 53V46Q8 43 12 42.5L19.5 41.5L25 36Q26.5 35 29 35H41Q43.5 35 45 37L49.5 42Q55 43 56 46V53Z"
        fill={CHALK}
        fillOpacity="0.12"
        {...STROKE}
      />
      <circle cx="18" cy="53" r="4.6" fill={NIGHT} {...STROKE} />
      <circle cx="46" cy="53" r="4.6" fill={NIGHT} {...STROKE} />
      <path d="M4 58H60" stroke={CHALK} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  // Garage de destination : rideau, lumière dessous.
  garage: (
    <g>
      <defs>
        <radialGradient id="rqv-garage-glow">
          <stop offset="0" stopColor={SODIUM} stopOpacity="0.55" />
          <stop offset="1" stopColor={SODIUM} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="32" cy="56" rx="22" ry="5" fill="url(#rqv-garage-glow)" />
      <path d="M8 56V23L32 10.5L56 23V56" fill={CHALK} fillOpacity="0.06" {...STROKE} />
      <rect x="17.5" y="29" width="29" height="27" fill={NIGHT} stroke={CHALK} strokeWidth="1.6" />
      <path d="M17.5 34H46.5M17.5 39H46.5M17.5 44H46.5" stroke={CHALK} strokeOpacity="0.35" strokeWidth="1.1" />
      <rect x="18.3" y="50" width="27.4" height="5.2" fill={SODIUM} />
      <circle cx="32" cy="23.5" r="2" fill={SODIUM} />
      <path d="M4 56H60" stroke={CHALK} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  // Domicile : fenêtre allumée.
  domicile: (
    <g>
      <defs>
        <radialGradient id="rqv-home-glow">
          <stop offset="0" stopColor={SODIUM} stopOpacity="0.4" />
          <stop offset="1" stopColor={SODIUM} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="22.5" cy="38" r="14" fill="url(#rqv-home-glow)" />
      <path d="M44 20V12.5H49.5V24.5" fill="none" stroke={CHALK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M13 28.5V56H51V28.5" fill={CHALK} fillOpacity="0.06" {...STROKE} />
      <path d="M6 31L32 10.5L58 31" fill="none" {...STROKE} />
      <rect x="17" y="33" width="11.5" height="10" rx="1" fill={SODIUM} />
      <path d="M22.75 33V43M17 38H28.5" stroke={NIGHT} strokeWidth="1.3" />
      <rect x="35" y="38" width="10.5" height="18" fill={NIGHT} stroke={CHALK} strokeWidth="1.6" />
      <circle cx="42.6" cy="47.5" r="1" fill={SODIUM} />
      <path d="M4 56H60" stroke={CHALK} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
};
