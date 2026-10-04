/**
 * Illustrations des six situations de remorquage (docs/09, F.2, PK 01) :
 * - `SituationVignette` : vignette de 64 unités (mobile, et à côté de chaque texte sans scène
 *   collante) ;
 * - `StageBackdrop` et `StageOverlays` : décor et marques de la grande scène du plateau
 *   (ordinateur), dans le repère 640 × 500, sol à y = 410.
 * Couleurs par jetons (`var(--color-…)`). Tout est décoratif : le `<svg>` porte `aria-hidden`,
 * l'information est dans le texte de chaque étape.
 */
import type { ReactElement } from "react";
import { Icon } from "@/components/ui/icon";

export type SituationKind = "non-roulant" | "accident" | "roues-bloquees" | "parking" | "garage" | "domicile";

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

// ─── Grande scène (ordinateur) : repère 640 × 500, sol à y = 410 ────────────────

/** Décor derrière les véhicules : rue (temps 1 à 3), parking (4), garage (5), domicile (6), sol. */
export function StageBackdrop(): ReactElement {
  return (
    <svg viewBox="0 0 640 500" aria-hidden="true">
      <defs>
        <linearGradient id="rq-st-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SODIUM} stopOpacity="0.34" />
          <stop offset="1" stopColor={SODIUM} stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id="rq-st-pool">
          <stop offset="0" stopColor={SODIUM} stopOpacity="0.3" />
          <stop offset="1" stopColor={SODIUM} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="rq-st-tube" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-xenon)" stopOpacity="0.2" />
          <stop offset="1" stopColor="var(--color-xenon)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="rq-st-slab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-asphalt-850)" />
          <stop offset="1" stopColor="var(--color-asphalt-700)" />
        </linearGradient>
        <linearGradient id="rq-st-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-night-800)" />
          <stop offset="1" stopColor="var(--color-night-950)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="rq-st-warm">
          <stop offset="0" stopColor={SODIUM} stopOpacity="0.45" />
          <stop offset="1" stopColor={SODIUM} stopOpacity="0" />
        </radialGradient>
        <pattern id="rq-st-chev" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="16" fill="var(--color-signal-500)" />
          <rect x="8" width="8" height="16" fill="var(--color-asphalt-950)" />
        </pattern>
        <pattern id="rq-st-brick" width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 0.5H24M0 6.5H24M6 0.5V6.5M18 6.5V12" stroke={CHALK} strokeOpacity="0.05" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Sol : chaussée mouillée, ligne de rive, tirets */}
      <rect x="-40" y="410" width="720" height="90" fill="url(#rq-st-ground)" />
      <path d="M-40 410.5H680" stroke={CHALK} strokeOpacity="0.16" strokeWidth="1.5" />
      <path d="M-40 452H680" stroke={CHALK} strokeOpacity="0.14" strokeWidth="2" strokeDasharray="30 30" />

      {/* 1 à 3 · La rue : lampadaire au sodium au-dessus de la rampe */}
      <g data-show="1 2 3">
        <polygon points="204,66 232,66 340,410 96,410" fill="url(#rq-st-cone)" />
        <ellipse cx="218" cy="414" rx="160" ry="14" fill="url(#rq-st-pool)" />
        <ellipse cx="218" cy="444" rx="10" ry="34" fill={SODIUM} fillOpacity="0.1" />
        <rect x="114" y="70" width="7" height="340" fill="var(--color-asphalt-800)" />
        <path d="M117.5 76Q117.5 56 138 56H214" fill="none" stroke="var(--color-asphalt-700)" strokeWidth="6" />
        <path d="M198 51H238Q241 61 231 64H205Q195 61 198 51Z" fill="var(--color-asphalt-750)" />
        <rect x="205" y="63" width="26" height="3.5" rx="1.5" fill={SODIUM} />
        <path d="M117.5 76Q117.5 57 138 57H214" fill="none" stroke={SODIUM} strokeOpacity="0.25" strokeWidth="1" />
      </g>

      {/* 4 · Parking et sous-sol : dalle, piliers balisés, néons, barre de hauteur */}
      <g data-show="4">
        <rect x="-40" y="0" width="720" height="410" fill={NIGHT} fillOpacity="0.88" />
        <rect x="-40" y="0" width="720" height="122" fill="url(#rq-st-slab)" />
        <rect x="-40" y="122" width="720" height="14" fill="var(--color-asphalt-800)" />
        <path d="M-40 122.5H680" stroke={CHALK} strokeOpacity="0.18" strokeWidth="1" />
        <rect x="6" y="136" width="34" height="274" fill="var(--color-asphalt-800)" />
        <rect x="6" y="352" width="34" height="58" fill="url(#rq-st-chev)" />
        <rect x="600" y="136" width="34" height="274" fill="var(--color-asphalt-800)" />
        <rect x="600" y="352" width="34" height="58" fill="url(#rq-st-chev)" />
        <polygon points="120,140 230,140 300,410 60,410" fill="url(#rq-st-tube)" />
        <polygon points="390,140 500,140 570,410 330,410" fill="url(#rq-st-tube)" />
        <rect x="120" y="136" width="110" height="5" rx="2" fill="var(--color-xenon)" />
        <rect x="390" y="136" width="110" height="5" rx="2" fill="var(--color-xenon)" />
        <path d="M300 136V226M580 136V226" stroke="var(--color-asphalt-300)" strokeWidth="2" strokeDasharray="4 3" />
        <rect x="282" y="226" width="316" height="20" rx="3" fill="url(#rq-st-chev)" stroke="var(--color-asphalt-950)" strokeWidth="1.5" />
        <path d="M284 228.5H596" stroke={CHALK} strokeOpacity="0.3" strokeWidth="1" />
        <path d="M440 246V252" stroke="var(--color-asphalt-400)" strokeWidth="2" />
        <rect x="418" y="252" width="44" height="30" rx="4" fill={NIGHT} stroke={CHALK} strokeOpacity="0.75" strokeWidth="2" />
        <Icon name="heightBar" x={429} y={256} size={22} strokeWidth={2} style={{ color: "var(--color-chalk)" }} />
        <path d="M60 470L140 410M580 470L500 410" stroke={CHALK} strokeOpacity="0.12" strokeWidth="2" />
      </g>

      {/* 5 · Vers votre garage : façade, enseigne à pictogramme, rideau entrouvert */}
      <g data-show="5">
        <rect x="430" y="150" width="230" height="260" fill="var(--color-asphalt-850)" />
        <rect x="430" y="150" width="230" height="260" fill="url(#rq-st-brick)" />
        <path d="M424 150H666" stroke={CHALK} strokeOpacity="0.2" strokeWidth="2" />
        <rect x="490" y="166" width="96" height="36" rx="4" fill={NIGHT} stroke={CHALK} strokeOpacity="0.55" strokeWidth="1.5" />
        <Icon name="garage" x={506} y={173} size={22} strokeWidth={2} style={{ color: "var(--color-chalk)" }} />
        <Icon name="wrench" x={548} y={173} size={22} strokeWidth={2} style={{ color: "var(--color-chalk)" }} />
        <polygon points="526,214 550,214 618,410 458,410" fill="url(#rq-st-cone)" opacity="0.6" />
        <rect x="524" y="206" width="28" height="7" rx="2" fill="var(--color-asphalt-700)" />
        <rect x="528" y="212" width="20" height="2.5" rx="1" fill={SODIUM} />
        <rect x="462" y="222" width="8" height="188" fill="var(--color-asphalt-700)" />
        <rect x="610" y="222" width="8" height="188" fill="var(--color-asphalt-700)" />
        <rect x="470" y="222" width="140" height="170" fill="var(--color-asphalt-750)" />
        {Array.from({ length: 20 }, (_, i) => (
          <path key={i} d={`M470 ${230 + i * 8}H610`} stroke="var(--color-asphalt-900)" strokeWidth="1.4" />
        ))}
        <rect x="470" y="392" width="140" height="18" fill={SODIUM} fillOpacity="0.8" />
        <ellipse cx="540" cy="414" rx="110" ry="12" fill="url(#rq-st-warm)" />
        <ellipse cx="540" cy="446" rx="60" ry="30" fill={SODIUM} fillOpacity="0.07" />
      </g>

      {/* 6 · Chez vous : maison, fenêtres allumées, haie */}
      <g data-show="6">
        <circle cx="490" cy="300" r="70" fill="url(#rq-st-warm)" />
        <rect x="574" y="196" width="18" height="40" fill="var(--color-asphalt-800)" />
        <rect x="452" y="262" width="176" height="148" fill="var(--color-asphalt-850)" />
        <polygon points="438,268 540,196 642,268" fill="var(--color-asphalt-900)" />
        <path d="M438 268L540 196L642 268" fill="none" stroke={SODIUM} strokeOpacity="0.3" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="472" y="288" width="38" height="32" rx="1.5" fill={SODIUM} fillOpacity="0.9" />
        <path d="M491 288V320M472 304H510" stroke="var(--color-asphalt-900)" strokeWidth="2.2" />
        <rect x="572" y="288" width="38" height="32" rx="1.5" fill={SODIUM} fillOpacity="0.55" />
        <path d="M591 288V320M572 304H610" stroke="var(--color-asphalt-900)" strokeWidth="2.2" />
        <rect x="526" y="334" width="30" height="76" fill="var(--color-asphalt-950)" stroke={CHALK} strokeOpacity="0.2" strokeWidth="1.5" />
        <circle cx="550" cy="374" r="2" fill={SODIUM} />
        <rect x="532" y="324" width="18" height="4" rx="1.5" fill={SODIUM} />
        <path d="M418 410Q424 392 436 396Q444 384 456 394Q466 388 470 410Z" fill="var(--color-asphalt-800)" />
        <path d="M600 410Q606 394 618 398Q628 388 640 400V410Z" fill="var(--color-asphalt-800)" />
        <ellipse cx="491" cy="420" rx="16" ry="34" fill={SODIUM} fillOpacity="0.1" />
      </g>
    </svg>
  );
}

/** Marques par-dessus les véhicules : cales et roues marquées, avant enfoncé, roue bloquée. */
export function StageOverlays(): ReactElement {
  // Roues de la voiture du client dans le repère de la scène (voiture posée en x = 44,5).
  const rear = { x: 96.5, y: 395 };
  const front = { x: 228.5, y: 395 };
  return (
    <svg viewBox="0 0 640 500" aria-hidden="true">
      <defs>
        <radialGradient id="rq-st-red">
          <stop offset="0" stopColor={BRAKE} stopOpacity="0.35" />
          <stop offset="1" stopColor={BRAKE} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 1 · Non roulant : roues marquées, cales */}
      <g data-show="1">
        {[rear, front].map((w) => (
          <g key={w.x}>
            <circle cx={w.x} cy={w.y} r="26" fill="url(#rq-st-red)" />
            <circle cx={w.x} cy={w.y} r="20" fill="none" stroke={BRAKE} strokeWidth="2.5" strokeDasharray="5 4" />
          </g>
        ))}
        <path d="M66 410H86L82 398Q78 395 74.5 398.5Z" fill={CHALK} />
        <path d="M239 410H259L250 398.5Q246.5 395 243 398Z" fill={CHALK} />
        <path d="M71 410l3.4-4M77 410l3-3.6M244 410l3-3.6M250 410l3-3.6" stroke={NIGHT} strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* 2 · Après un accident : avant enfoncé, capot plié, éclats */}
      <g data-show="2">
        <path
          d="M244 371L252.5 369L249 375L258.5 374L254 380L264.5 379.5L259 385.5L270 386.5L263 391.5L273.5 394.5L266 398.5L246 398.5Z"
          fill="var(--color-asphalt-950)"
          stroke="var(--color-xenon)"
          strokeOpacity="0.55"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M212 366L226 358.5L235 366L245.5 360L255.5 368.5" fill="none" stroke={SODIUM} strokeOpacity="0.7" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M181 352l-9-5.5M181 352l10-3M181 352l2 8.5M181 352l-6 6" stroke={CHALK} strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M282 410l3-4.5 2.6 4.5zM292 410l2-3 2 3zM300.5 410l2.6-5.2 2.4 5.2zM276 410l1.6-2.4 1.6 2.4z" fill="var(--color-asphalt-200)" fillOpacity="0.75" />
      </g>

      {/* 3 · Roues bloquées : roue avant cerclée, cadenas, traces de frottement */}
      <g data-show="3">
        <path d="M140 409.5H208M30 409.5H76" stroke="var(--color-asphalt-950)" strokeOpacity="0.9" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx={front.x} cy={front.y} r="30" fill="url(#rq-st-red)" />
        <circle cx={front.x} cy={front.y} r="21" fill="none" stroke={BRAKE} strokeWidth="3" />
        <path d={`M${front.x} 374V344`} stroke={BRAKE} strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx={front.x} cy="330" r="16" fill={NIGHT} stroke={BRAKE} strokeWidth="2.2" />
        <rect x={front.x - 7} y="329" width="14" height="10" rx="2" fill={BRAKE} />
        <path d={`M${front.x - 4.4} 329v-3.2a4.4 4.4 0 0 1 8.8 0v3.2`} fill="none" stroke={CHALK} strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
