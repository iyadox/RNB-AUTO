/**
 * Glyphes en vue de dessus (docs/09, B.7 « la compréhension ») : dépanneuse avec cône de
 * phares, voiture, épingle « Vous », drapeau de destination, dépôt. Chaque glyphe est un
 * groupe `<g>` centré sur (0, 0), orienté vers la droite (+x), à poser dans un `<svg>` :
 *
 *   <g transform="translate(120 80) rotate(30)"><TruckTopGlyph headlights /></g>
 *
 * Échelle pensée pour un plan de 600 unités de côté (dépanneuse ≈ 46 unités de long).
 * Décor uniquement : le `<svg>` parent porte `aria-hidden`. Identifiants internes uniques
 * (useId). L'épingle et le drapeau ont leur point d'ancrage (la pointe, le pied) en (0, 0).
 */
import { useId, type ReactElement } from "react";

const useSvgId = (name: string) => `${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

type TruckTopGlyphProps = {
  /** Cône des phares devant la cabine. */
  headlights?: boolean;
  /** Voiture chargée sur le plateau. */
  loaded?: boolean;
  /** `neutral` : dépanneur agréé de l'autoroute (gris, sans couleur RNB AUTO ni gyrophare allumé). */
  tone?: "rnb" | "neutral";
};

export function TruckTopGlyph({ headlights = false, loaded = false, tone = "rnb" }: TruckTopGlyphProps): ReactElement {
  const id = useSvgId("ttg");
  const rnb = tone === "rnb";
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e3ecff" stopOpacity="0.62" />
          <stop offset="0.45" stopColor="#e3ecff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#e3ecff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-beacon`}>
          <stop offset="0" stopColor="#ff9a3d" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ff7a1a" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {headlights ? (
        <g>
          <path d="M22 -6.2 L84 -26 Q92 0 84 26 L22 6.2 Z" fill={`url(#${id}-beam)`} />
          <path d="M22 -4 L60 -10 Q63 0 60 10 L22 4 Z" fill={`url(#${id}-beam)`} opacity="0.7" />
        </g>
      ) : null}
      {/* Ombre portée */}
      <rect x="-21.5" y="-6.5" width="46" height="17" rx="3" fill="#000" opacity="0.45" />
      {/* Plateau */}
      <rect x="-23" y="-8" width="33.5" height="16" rx="1.6" fill={rnb ? "#2f363e" : "#3a4048"} />
      <path d="M-21 -4.2H9M-21 0H9M-21 4.2H9" stroke="#4b5560" strokeWidth="0.6" />
      {rnb ? (
        <>
          <rect x="-23" y="-8.4" width="33.5" height="1.9" rx="0.6" fill="#ffc400" />
          <rect x="-23" y="6.5" width="33.5" height="1.9" rx="0.6" fill="#ffc400" />
          <path d="M-23 -6.5h2.6l-2.6 3zM-23 -1.5l2.6-3v3l-2.6 3zM-23 3.5l2.6-3v3l-2.6 3z" fill="#ffc400" />
        </>
      ) : (
        <>
          <rect x="-23" y="-8.4" width="33.5" height="1.4" rx="0.6" fill="#6f7b88" />
          <rect x="-23" y="7" width="33.5" height="1.4" rx="0.6" fill="#6f7b88" />
        </>
      )}
      {loaded ? (
        <g>
          <rect x="-20.5" y="-6" width="26" height="12" rx="3.6" fill="#4f6d8c" />
          <rect x="-14" y="-4.7" width="12.5" height="9.4" rx="2" fill="#273a4f" />
          <path d="M-1.6 -4.6 L2 -5.2 Q3.2 0 2 5.2 L-1.6 4.6 Z" fill="#101a25" />
          <path d="M-18.6 -4.4h3.8M-18.6 4.4h3.8" stroke="#ff4b3a" strokeWidth="1" strokeLinecap="round" />
          <path d="M-13 -3.4h10" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="0.8" />
        </g>
      ) : null}
      {/* Tête de plateau et treuil */}
      <rect x="9.6" y="-7.4" width="2.6" height="14.8" rx="0.6" fill="#1b2026" />
      {/* Cabine */}
      <rect x="12" y="-8.2" width="11.4" height="16.4" rx="3.2" fill={rnb ? "#ecebe6" : "#8a939d"} />
      <path d="M18.8 -6.8 Q21.6 0 18.8 6.8 L21.1 6.3 Q23 0 21.1 -6.3 Z" fill="#1b2a3a" />
      <rect x="16.6" y="-9.8" width="2.2" height="1.6" rx="0.5" fill="#1b2026" />
      <rect x="16.6" y="8.2" width="2.2" height="1.6" rx="0.5" fill="#1b2026" />
      {/* Rampe de gyrophare */}
      {rnb ? <circle cx="14.3" cy="0" r="9" fill={`url(#${id}-beacon)`} /> : null}
      <rect x="13.2" y="-5.6" width="2.3" height="11.2" rx="1" fill={rnb ? "#ff8a2a" : "#5d6773"} />
      {/* Feux avant */}
      <rect x="22.4" y="-6.6" width="1.3" height="2.8" rx="0.5" fill="#e3ecff" />
      <rect x="22.4" y="3.8" width="1.3" height="2.8" rx="0.5" fill="#e3ecff" />
    </g>
  );
}

type CarTopGlyphProps = {
  /** Feux de détresse aux quatre coins (1 Hz, classe `.hazard`). */
  hazards?: boolean;
};

export function CarTopGlyph({ hazards = false }: CarTopGlyphProps): ReactElement {
  const id = useSvgId("ctg");
  const corners = [
    [12.2, -5.2],
    [12.2, 5.2],
    [-12.2, -5.2],
    [-12.2, 5.2],
  ] as const;
  return (
    <g>
      {hazards ? (
        <defs>
          <radialGradient id={`${id}-amber`}>
            <stop offset="0" stopColor="#ff9a3d" stopOpacity="0.9" />
            <stop offset="0.45" stopColor="#ff9a3d" stopOpacity="0.28" />
            <stop offset="1" stopColor="#ff9a3d" stopOpacity="0" />
          </radialGradient>
        </defs>
      ) : null}
      <rect x="-12.5" y="-5.4" width="27" height="12.6" rx="4" fill="#000" opacity="0.45" />
      <rect x="-13.5" y="-6.3" width="27" height="12.6" rx="4.2" fill="#3b4652" />
      <rect x="-6.8" y="-5" width="11" height="10" rx="2.2" fill="#222a33" />
      <path d="M4.4 -4.8 L8 -5.3 Q9.3 0 8 5.3 L4.4 4.8 Z" fill="#0f151c" />
      <path d="M-6.8 -4.6 L-9.4 -4.2 Q-10.2 0 -9.4 4.2 L-6.8 4.6 Z" fill="#0f151c" />
      <path d="M-5 -3.6h8" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="0.8" />
      <rect x="2.6" y="-7.6" width="2" height="1.4" rx="0.5" fill="#262d36" />
      <rect x="2.6" y="6.2" width="2" height="1.4" rx="0.5" fill="#262d36" />
      {hazards ? (
        <g className="hazard">
          {corners.map(([cx, cy]) => (
            <circle key={`g${cx}${cy}`} cx={cx} cy={cy} r="6.5" fill={`url(#${id}-amber)`} />
          ))}
          {corners.map(([cx, cy]) => (
            <circle key={`l${cx}${cy}`} cx={cx} cy={cy} r="1.35" fill="#ffb15c" />
          ))}
        </g>
      ) : null}
    </g>
  );
}

type PinGlyphProps = {
  /** Texte sous la pointe, par exemple « Vous ». */
  label?: string;
  /** Anneau de feux de détresse autour de la pointe (1 Hz). */
  hazards?: boolean;
};

export function PinGlyph({ label, hazards = false }: PinGlyphProps): ReactElement {
  const id = useSvgId("pin");
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#ff7a1a" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a3d" />
          <stop offset="1" stopColor="#e85d00" />
        </linearGradient>
      </defs>
      <ellipse cx="0" cy="0" rx="16" ry="5.5" fill={`url(#${id}-halo)`} />
      {hazards ? (
        <ellipse className="hazard" cx="0" cy="0" rx="10" ry="3.6" fill="none" stroke="#ff9a3d" strokeWidth="1.4" />
      ) : null}
      <ellipse cx="0" cy="0.5" rx="4.5" ry="1.6" fill="#000" opacity="0.55" />
      <path
        d="M0 0 C-2.6 -5.6 -10.5 -9.6 -10.5 -17.5 A10.5 10.5 0 1 1 10.5 -17.5 C10.5 -9.6 2.6 -5.6 0 0 Z"
        fill={`url(#${id}-body)`}
        stroke="#05070d"
        strokeWidth="1.4"
      />
      <path d="M-6.5 -22 A7.5 7.5 0 0 1 2 -25.4" fill="none" stroke="#fff3e0" strokeOpacity="0.55" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="0" cy="-17.5" r="3.9" fill="#05070d" />
      {label ? (
        <text
          x="0"
          y="17"
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill="#f5f3ee"
          stroke="#05070d"
          strokeWidth="3.5"
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function FlagGlyph(): ReactElement {
  const id = useSvgId("flag");
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#ffc400" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffc400" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="0" rx="17" ry="6" fill={`url(#${id}-glow)`} />
      <ellipse cx="0" cy="0.5" rx="4" ry="1.5" fill="#000" opacity="0.55" />
      <path d="M0 0V-31" stroke="#f5f3ee" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M1 -31 H20 L15 -25 L20 -19 H1 Z" fill="#ffc400" stroke="#05070d" strokeWidth="1" strokeLinejoin="round" />
      <path d="M1 -31 H7 V-25 H1 Z M7 -25 H13 V-19 H7 Z" fill="#05070d" opacity="0.85" />
    </g>
  );
}

type DepotGlyphProps = {
  /** Onde du gyrophare autour du dépôt (boucle, pause hors écran par la scène). */
  pulse?: boolean;
};

export function DepotGlyph({ pulse = false }: DepotGlyphProps): ReactElement {
  const id = useSvgId("dep");
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#ffc400" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#ffc400" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffc400" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="30" fill={`url(#${id}-halo)`} />
      {pulse ? (
        <circle
          r="13"
          fill="none"
          stroke="#ff7a1a"
          strokeWidth="1.6"
          className="animate-pulse-ring"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        />
      ) : null}
      <rect x="-10.5" y="-10.5" width="21" height="21" rx="2.5" transform="rotate(45)" fill="#ffc400" stroke="#05070d" strokeWidth="2" />
      <rect x="-7.6" y="-7.6" width="15.2" height="15.2" rx="1.5" transform="rotate(45)" fill="none" stroke="#05070d" strokeOpacity="0.45" strokeWidth="0.8" />
      <text x="0" y="2.7" textAnchor="middle" fontSize="7.4" fontWeight="900" fill="#0d0f12" style={{ fontStretch: "75%", letterSpacing: "0.02em" }}>
        RNB
      </text>
    </g>
  );
}
