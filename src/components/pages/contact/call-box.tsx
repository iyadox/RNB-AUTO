/**
 * /contact, PK 00 : la borne d'appel RNB AUTO (docs/09, F.7), décor statique pour ordinateur.
 *
 * Une borne de bord de route à la nuit : enseigne losange allumée sur son mât, auvent avec sa
 * réglette au sodium qui éclaire la façade, grille de haut-parleur, gros bouton au combiné, trois
 * touches qui rappellent les trois canaux de la page (jaune, vert WhatsApp, jaune au trait),
 * bande de chevrons, socle et sol mouillé. Aucune animation (page calme), `aria-hidden`.
 */
import type { ReactElement } from "react";
import styles from "./contact.module.css";

const KEYS = [
  { y: 372, led: "var(--color-signal-500)", hollow: false },
  { y: 412, led: "var(--color-whatsapp)", hollow: false },
  { y: 452, led: "var(--color-signal-500)", hollow: true },
] as const;

export function CallBox(): ReactElement {
  return (
    <div className={styles.callBox} aria-hidden="true">
      <svg className={styles.callBoxSvg} viewBox="0 0 300 720">
        <defs>
          <radialGradient id="cb-halo">
            <stop offset="0" stopOpacity="0.42" style={{ stopColor: "var(--color-signal-500)" }} />
            <stop offset="0.4" stopOpacity="0.12" style={{ stopColor: "var(--color-signal-500)" }} />
            <stop offset="1" stopOpacity="0" style={{ stopColor: "var(--color-signal-500)" }} />
          </radialGradient>
          <linearGradient id="cb-body" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" style={{ stopColor: "var(--color-asphalt-700)" }} />
            <stop offset="0.18" style={{ stopColor: "var(--color-asphalt-800)" }} />
            <stop offset="0.8" style={{ stopColor: "var(--color-asphalt-900)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-night-950)" }} />
          </linearGradient>
          <linearGradient id="cb-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopOpacity="0.3" style={{ stopColor: "var(--color-sodium)" }} />
            <stop offset="1" stopOpacity="0" style={{ stopColor: "var(--color-sodium)" }} />
          </linearGradient>
          <radialGradient id="cb-pool">
            <stop offset="0" stopOpacity="0.3" style={{ stopColor: "var(--color-sodium)" }} />
            <stop offset="1" stopOpacity="0" style={{ stopColor: "var(--color-sodium)" }} />
          </radialGradient>
          <linearGradient id="cb-wet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopOpacity="0.3" style={{ stopColor: "var(--color-signal-500)" }} />
            <stop offset="1" stopOpacity="0" style={{ stopColor: "var(--color-signal-500)" }} />
          </linearGradient>
          <pattern id="cb-grille" width="9" height="9" patternUnits="userSpaceOnUse">
            <circle cx="4.5" cy="4.5" r="2" style={{ fill: "var(--color-night-950)" }} />
          </pattern>
          <pattern id="cb-chevrons" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="14" style={{ fill: "var(--color-signal-500)" }} />
            <rect x="7" width="7" height="14" style={{ fill: "var(--color-night-950)" }} />
          </pattern>
        </defs>

        {/* Halo de l'enseigne */}
        <circle cx="150" cy="66" r="128" fill="url(#cb-halo)" />

        {/* Sol mouillé : flaque de lumière et reflet de l'enseigne */}
        <path d="M-60 700H360" strokeOpacity="0.18" strokeWidth="2" style={{ stroke: "var(--color-chalk)" }} />
        <ellipse cx="150" cy="704" rx="130" ry="9" fill="url(#cb-pool)" />
        <rect x="143" y="702" width="14" height="60" fill="url(#cb-wet)" />

        {/* Mât et enseigne losange RNB AUTO */}
        <rect x="146" y="92" width="8" height="30" style={{ fill: "var(--color-asphalt-800)" }} />
        <path d="M150 28L188 66L150 104L112 66Z" strokeWidth="3" style={{ fill: "var(--color-signal-500)", stroke: "var(--color-night-950)" }} />
        <path d="M150 35L181 66L150 97L119 66Z" fill="none" strokeOpacity="0.5" style={{ stroke: "var(--color-night-950)" }} />
        <text x="150" y="66" textAnchor="middle" fontSize="15" fontWeight="900" style={{ fill: "var(--color-night-950)", fontStretch: "75%" }}>
          RNB
        </text>
        <text
          x="150"
          y="79"
          textAnchor="middle"
          fontSize="8"
          fontWeight="800"
         
          style={{ fill: "var(--color-night-950)", fontStretch: "120%", letterSpacing: "0.14em" }}
        >
          AUTO
        </text>

        {/* Tête de la borne et auvent */}
        <rect x="90" y="122" width="120" height="122" rx="10" fill="url(#cb-body)" />
        <path d="M76 132Q150 108 224 132V142H76Z" style={{ fill: "var(--color-asphalt-900)" }} />
        <path d="M76 132Q150 108 224 132" fill="none" strokeOpacity="0.2" strokeWidth="1.5" style={{ stroke: "var(--color-chalk)" }} />
        <rect x="104" y="142" width="92" height="4" rx="2" style={{ fill: "var(--color-sodium)" }} />
        {/* Grille du haut-parleur */}
        <rect x="112" y="164" width="76" height="58" rx="5" style={{ fill: "var(--color-asphalt-800)" }} />
        <rect x="112" y="164" width="76" height="58" rx="5" fill="url(#cb-grille)" />

        {/* Fût */}
        <rect x="102" y="244" width="96" height="440" rx="5" fill="url(#cb-body)" />
        <path d="M102 248V684" strokeOpacity="0.12" style={{ stroke: "var(--color-chalk)" }} />

        {/* Gros bouton au combiné */}
        <circle cx="150" cy="306" r="36" style={{ fill: "var(--color-night-950)" }} />
        <circle cx="150" cy="306" r="31" fill="none" strokeWidth="3.5" style={{ stroke: "var(--color-signal-500)" }} />
        <path
          d="M139 292c2.5-2.5 5.5-1.6 6.8 1.2l1.8 4c.8 1.9.2 3.6-1.3 4.8l-1.6 1.2c1.6 3.4 4.3 6.1 7.7 7.7l1.2-1.6c1.2-1.5 2.9-2.1 4.8-1.3l4 1.8c2.8 1.3 3.7 4.3 1.2 6.8l-1.5 1.5c-2.4 2.4-6.2 3-10 1.3-6.7-3-12-8.3-15-15-1.7-3.8-1.1-7.6 1.3-10z" style={{ fill: "var(--color-signal-500)" }}
         
        />

        {/* Trois touches, comme les trois canaux de la page */}
        {KEYS.map((key) => (
          <g key={key.y}>
            <rect x="116" y={key.y} width="68" height="26" rx="4" strokeOpacity="0.18" style={{ fill: "var(--color-night-950)", stroke: "var(--color-chalk)" }} />
            <circle
              cx="129"
              cy={key.y + 13}
              r="5"
              strokeWidth={key.hollow ? 2 : 0}
              style={{ fill: key.hollow ? "none" : key.led, stroke: key.led }}
            />
            <path d={`M142 ${key.y + 10}h30M142 ${key.y + 17}h20`} strokeOpacity="0.22" strokeWidth="2" strokeLinecap="round" style={{ stroke: "var(--color-chalk)" }} />
          </g>
        ))}

        {/* Lumière de la réglette sur la façade */}
        <path d="M90 146H210V244H198V440H102V244H90Z" fill="url(#cb-cone)" />

        {/* Bande de chevrons et socle */}
        <rect x="102" y="596" width="96" height="38" fill="url(#cb-chevrons)" />
        <path d="M102 596h96M102 634h96" strokeWidth="2" style={{ stroke: "var(--color-night-950)" }} />
        <rect x="92" y="682" width="116" height="18" rx="3" style={{ fill: "var(--color-asphalt-900)" }} />
        <path d="M92 683h116" strokeOpacity="0.16" style={{ stroke: "var(--color-chalk)" }} />
      </svg>
    </div>
  );
}
