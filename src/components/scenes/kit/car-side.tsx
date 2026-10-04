/**
 * Voiture du client, vue de profil (docs/09, B.7 « l'émotion ») : silhouette sombre,
 * liseré de la source la plus proche (sodium du lampadaire sur le pavillon, xénon des phares
 * de la dépanneuse sur l'arrière), feux de détresse et leurs reflets sur la chaussée mouillée.
 *
 * - Tournée vers la droite (avant à droite), comme la dépanneuse : elle s'arrête derrière.
 * - `viewBox` 240 × 110 ; le sol est à y = 92 (≈ 84 % de la hauteur), la bande du dessous
 *   reçoit les reflets. À la même échelle que `TowTruck` quand sa largeur vaut 2/3 de celle
 *   de la dépanneuse.
 * - `hazards` : feux de détresse à 1 Hz (classe `.hazard`, état de base allumé, pause hors
 *   écran par la scène qui l'entoure) ; `hoodOpen` : capot levé, compartiment moteur visible.
 * Décoratif (`aria-hidden`). `id` préfixe les identifiants internes (unique dans la page).
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";

type CarSideProps = {
  id: string;
  hazards?: boolean;
  hoodOpen?: boolean;
  className?: string;
};

/** Citadine moderne (hayon), caisse fermée. */
const BODY_CLOSED =
  "M16 80L13 70Q12 60 17 53L28 38Q34 30 46 28L66 25.5Q100 22.5 118 24Q128 25 136 30L162 46Q196 49 214 54Q227 57 229 64L230 74Q230 80 224 80L203 80A19 19 0 0 0 165 80L71 80A19 19 0 0 0 33 80Z";
/** Même caisse, capot retiré (l'avant s'arrête à la baie moteur). */
const BODY_OPEN =
  "M16 80L13 70Q12 60 17 53L28 38Q34 30 46 28L66 25.5Q100 22.5 118 24Q128 25 136 30L162 46L164 51L224 59Q229 60.5 229.4 64L230 74Q230 80 224 80L203 80A19 19 0 0 0 165 80L71 80A19 19 0 0 0 33 80Z";

function Wheel({ cx, id }: { cx: number; id: string }) {
  return (
    <g>
      <circle cx={cx} cy="77" r="15" fill="#08090b" />
      <circle cx={cx} cy="77" r="13.3" fill="#101317" stroke="#262c34" strokeWidth="1.4" />
      <circle cx={cx} cy="77" r="9" fill={`url(#${id}-rim)`} />
      {[0, 72, 144, 216, 288].map((angle) => (
        <path
          key={angle}
          d={`M${cx} 77L${(cx + 8 * Math.cos(((angle - 90) * Math.PI) / 180)).toFixed(2)} ${(77 + 8 * Math.sin(((angle - 90) * Math.PI) / 180)).toFixed(2)}`}
          stroke="#3b434c"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}
      <circle cx={cx} cy="77" r="2.8" fill="#2a3038" stroke="#9aa4b0" strokeWidth="0.6" />
      {/* Reflet du lampadaire sur le haut du pneu */}
      <path d={`M${cx - 9.5} 67.8A13.3 13.3 0 0 1 ${cx + 6.5} 65.4`} fill="none" stroke="#ffd27a" strokeOpacity="0.3" strokeWidth="1" />
    </g>
  );
}

export function CarSide({ id, hazards = false, hoodOpen = false, className }: CarSideProps): ReactElement {
  const amber = "#ffb15c";
  return (
    <svg
      viewBox="0 0 240 110"
      className={cn("overflow-visible", className)}
      aria-hidden="true"
      // Feux de détresse : boucle en pause hors écran (P14), même si la scène autour l'oublie.
      data-pause-offscreen={hazards ? "" : undefined}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#323944" />
          <stop offset="0.32" stopColor="#20262e" />
          <stop offset="0.7" stopColor="#161a20" />
          <stop offset="1" stopColor="#0d1014" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#2a3a4d" />
          <stop offset="0.6" stopColor="#111a24" />
          <stop offset="1" stopColor="#0a0f15" />
        </linearGradient>
        <radialGradient id={`${id}-rim`}>
          <stop offset="0" stopColor="#c9d0d8" />
          <stop offset="0.75" stopColor="#7d8894" />
          <stop offset="1" stopColor="#4b5560" />
        </radialGradient>
        <radialGradient id={`${id}-amber`}>
          <stop offset="0" stopColor="#ff9a3d" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="#ff9a3d" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ff9a3d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-wet`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb15c" stopOpacity="0.5" />
          <stop offset="0.45" stopColor="#ff9a3d" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ff9a3d" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-bay`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2418" />
          <stop offset="1" stopColor="#08090b" />
        </linearGradient>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="122" cy="92" rx="106" ry="3.6" fill="#000" opacity="0.6" />

      {/* Caisse */}
      <path d={hoodOpen ? BODY_OPEN : BODY_CLOSED} fill={`url(#${id}-body)`} />

      {hoodOpen ? (
        <g>
          {/* Baie moteur : bloc, durites, vase d'expansion ; la lueur du lampadaire sur les arêtes */}
          <path d="M162 46L164 51L224 59L222 54.5Q210 51.5 190 49Z" fill={`url(#${id}-bay)`} />
          <rect x="180" y="48.6" width="20" height="6.4" rx="1.5" fill="#1b2026" />
          <path d="M182 49.2h16M184 47.2v2M192 47.4v2" stroke="#4b5560" strokeWidth="1" />
          <path d="M204 53.4q6-4 12 1" fill="none" stroke="#3b434c" strokeWidth="1.4" />
          <circle cx="172" cy="49.6" r="2.2" fill="#262c34" stroke="#ffd27a" strokeOpacity="0.4" strokeWidth="0.6" />
          {/* Capot levé, charnière au pied du pare-brise */}
          <g transform="translate(162 46) rotate(-33)">
            <path d="M0 0L50 3.4Q62 5.4 65 10.4L62.4 11.6Q49 8.4 0 3.8Z" fill="#1d2229" />
            <path d="M2 0.3L50 3.5Q61 5.4 64.4 10" fill="none" stroke="#ffd27a" strokeOpacity="0.62" strokeWidth="1.1" />
            <path d="M0 3.8Q32 6.2 62.4 11.6" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1" />
          </g>
          {/* Béquille */}
          <path d="M212 55.6L201 23" stroke="#6f7b88" strokeWidth="0.9" />
        </g>
      ) : null}

      {/* Vitres (custode, porte arrière, porte avant) et reflets */}
      <path d="M33 41.4L41.4 32.4Q45 30.6 51 30.1L58 29.5V41.6Z" fill={`url(#${id}-glass)`} />
      <path d="M62 29.2L103 27.3V44L62 42.3Z" fill={`url(#${id}-glass)`} />
      <path d="M107 27.2L118 27.4Q126 28.1 131.4 31.2L152 45.6L107 44.1Z" fill={`url(#${id}-glass)`} />
      <path d="M68 39L78 30.6M112 41.5L121 30.4" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="3.4" strokeLinecap="round" />

      {/* Ligne de ceinture, portes, poignées, rétroviseur, bas de caisse */}
      <path d="M32 42.2L154 47.3Q190 49.6 214 55" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />
      <path d="M105 45V78.5M157 47.5Q160.5 62 157.5 78.5M60 42.6Q57.4 60 60.5 78.5" fill="none" stroke="#05070d" strokeOpacity="0.75" strokeWidth="1" />
      <path d="M36 74H198" stroke="#05070d" strokeOpacity="0.5" strokeWidth="2" />
      <rect x="86" y="50" width="8" height="1.8" rx="0.9" fill="#3b434c" />
      <rect x="134" y="51.3" width="8" height="1.8" rx="0.9" fill="#3b434c" />
      <path d="M148 41.4L156 40.4L157.6 45.8L150 46.2Z" fill="#1b2026" />

      {/* Liserés de lumière : sodium (lampadaire) sur le pavillon, xénon (phares derrière) sur l'arrière */}
      <path
        d={
          hoodOpen
            ? "M28 38Q34 30 46 28L66 25.5Q100 22.5 118 24Q128 25 136 30L162 46"
            : "M28 38Q34 30 46 28L66 25.5Q100 22.5 118 24Q128 25 136 30L162 46Q196 49 214 54Q226.4 57 228.6 62"
        }
        fill="none"
        stroke="#ffd27a"
        strokeOpacity="0.62"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M24 44L17 53Q12 60 13 68" fill="none" stroke="#e3ecff" strokeOpacity="0.42" strokeWidth="1.1" strokeLinecap="round" />

      {/* Feux : arrière rouge (éteint au repos), phare avant éteint (véhicule en panne) */}
      <path d="M14.8 54.4L20.2 51.4L20.8 59.6L14.2 60.6Z" fill="#7a1d16" />
      <path d="M15.8 55.2L19.6 53" stroke="#ff4b3a" strokeOpacity="0.85" strokeWidth="1" strokeLinecap="round" />
      <path d="M213 54.6L226 57.6L227.2 61L215.4 59.6Z" fill="#9aa4b0" fillOpacity={hoodOpen ? 0 : 0.5} />
      {/* Clignotants (orange éteint ; allumés par les feux de détresse) */}
      <rect x="13.6" y="61.6" width="5.2" height="2.6" rx="0.8" fill="#6b3a12" />
      <rect x="224.4" y="62.6" width="4.4" height="2.6" rx="0.8" fill="#6b3a12" />
      <rect x="167" y="51.6" width="3.8" height="1.6" rx="0.8" fill="#6b3a12" />

      {hazards ? (
        <g className="hazard">
          <circle cx="16" cy="62.9" r="15" fill={`url(#${id}-amber)`} />
          <circle cx="226.6" cy="63.9" r="13" fill={`url(#${id}-amber)`} />
          <circle cx="168.9" cy="52.4" r="6" fill={`url(#${id}-amber)`} />
          <rect x="13.6" y="61.6" width="5.2" height="2.6" rx="0.8" fill={amber} />
          <rect x="224.4" y="62.6" width="4.4" height="2.6" rx="0.8" fill={amber} />
          <rect x="167" y="51.6" width="3.8" height="1.6" rx="0.8" fill={amber} />
          {/* Reflets étirés sur la chaussée mouillée */}
          <ellipse cx="16" cy="101" rx="1.7" ry="9" fill={`url(#${id}-wet)`} />
          <ellipse cx="226.6" cy="101" rx="1.6" ry="8.6" fill={`url(#${id}-wet)`} />
        </g>
      ) : null}

      <Wheel cx={52} id={id} />
      <Wheel cx={184} id={id} />
    </svg>
  );
}
