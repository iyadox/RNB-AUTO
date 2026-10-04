"use client";
/**
 * Le dépôt RNB AUTO (docs/09, B.7 et D.8) : hangar en bardage, rideau métallique, enseigne
 * losange, applique au sodium, bureau. Vue de profil, silhouettes sombres, une seule couleur
 * de marque (le jaune de l'enseigne). Décoratif (`aria-hidden`), identifiants uniques (useId).
 *
 * `shutter` : état final du rideau. `animate` : le rideau s'ouvre ou se ferme une fois, à
 * l'entrée dans l'écran (`data-inview-once`), en partant de l'état opposé ; le délai se règle
 * avec la variable CSS `--depot-delay`, la durée avec `--depot-duration` (1 s par défaut). Le
 * rideau porte `data-depot-shutter` : une page qui le pilote elle-même le cible par cet attribut
 * (plutôt que par la structure du dessin). Sans JavaScript et en `off` : état final.
 * Le jaune de l'enseigne et des bornes est le jeton `--color-signal-500` (`currentColor`).
 *
 * Composant client : son balisage n'est pas répété dans la charge RSC de la page (G.2).
 */
import { useId, type ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./base.module.css";

type DepotProps = {
  shutter?: "open" | "closed";
  animate?: "open" | "close" | null;
  signLit?: boolean;
  className?: string;
};

const GROUND = 240;
const roofY = (x: number) => (x <= 240 ? 110 - ((x - 40) / 200) * 38 : 72 + ((x - 240) / 200) * 38);

/** Nervures verticales du bardage, coupées par la pente du toit. */
const CLADDING = Array.from({ length: 48 }, (_, i) => 44 + i * 8)
  .filter((x) => x < 436 && (x < 160 || x > 326))
  .map((x) => `M${x} ${Math.ceil(roofY(x)) + 2}V${GROUND}`)
  .join("");

/** Bandes jaunes des deux bornes (quatre par borne). */
const BORNE_STRIPES = [142, 336].flatMap((x) => [0, 1, 2, 3].map((i) => `M${x} ${208 + i * 8}h8v4h-8z`)).join("");

/** Lames du rideau métallique. */
const SLATS = Array.from({ length: 14 }, (_, i) => `M168 ${143 + i * 7}h150`).join("");

export function Depot({ shutter = "closed", animate = null, signLit = true, className }: DepotProps): ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `depot-${uid}-${name}`;
  const finalState = animate === "close" ? "closed" : animate === "open" ? "open" : shutter;

  return (
    <svg
      viewBox="0 0 480 260"
      aria-hidden="true"
      data-inview-once={animate ? "" : undefined}
      className={cn(
        styles.depot,
        finalState === "open" && styles.open,
        animate === "close" && styles.animateClose,
        animate === "open" && styles.animateOpen,
        className,
      )}
    >
      <defs>
        <linearGradient id={id("wall")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c222b" />
          <stop offset="1" stopColor="#0f1318" />
        </linearGradient>
        <linearGradient id={id("annex")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#171c23" />
          <stop offset="1" stopColor="#0c0f13" />
        </linearGradient>
        <linearGradient id={id("inside")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2c17" />
          <stop offset="0.55" stopColor="#1a160f" />
          <stop offset="1" stopColor="#0b0c0e" />
        </linearGradient>
        <linearGradient id={id("cone")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.42" />
          <stop offset="0.6" stopColor="#ffd27a" stopOpacity="0.1" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0.02" />
        </linearGradient>
        <radialGradient id={id("pool")}>
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.34" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("sign")}>
          <stop offset="0" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="0.45" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("slat")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#363d47" />
          <stop offset="1" stopColor="#262c34" />
        </linearGradient>
        <clipPath id={id("door")}>
          <rect x="168" y="136" width="150" height="104" />
        </clipPath>
      </defs>

      {/* Halo de l'enseigne sur le ciel et le toit. */}
      {signLit ? <circle cx="240" cy="100" r="96" fill={`url(#${id("sign")})`} /> : null}

      {/* Parvis et ligne de sol */}
      <path d="M0 240H480" stroke="#2a3038" strokeWidth="2" />
      <path d="M150 240h186l30 20H120z" fill="#14181d" />

      {/* Hangar */}
      <path d="M40 240V110L240 72L440 110V240Z" fill={`url(#${id("wall")})`} />
      <path d={CLADDING} stroke="#0b0e12" strokeWidth="1.2" />
      <path d="M36 112L240 73L444 112" fill="none" stroke="#3a424c" strokeWidth="3" strokeLinecap="round" />
      {/* Liseré de lumière : l'applique et l'enseigne éclairent le bord du toit. */}
      <path d="M150 89.6L240 72.4L330 89.6" fill="none" stroke="#ffd27a" strokeOpacity={signLit ? 0.35 : 0.12} strokeWidth="1.2" />

      {/* Bureau, porte et fenêtre allumée */}
      <path d="M356 240V150H440V240Z" fill={`url(#${id("annex")})`} />
      <path d="M352 150H444" stroke="#3a424c" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="370" y="166" width="26" height="18" rx="1.5" fill="#ffd27a" fillOpacity="0.72" />
      <path d="M383 166v18M370 175h26" stroke="#3b2f18" strokeWidth="1.5" />
      <rect x="408" y="190" width="20" height="50" rx="1" fill="#0a0c0f" stroke="#2a3038" />
      <circle cx="424" cy="216" r="1.4" fill="#9ba6b2" />

      {/* Baie et intérieur (visible quand le rideau est levé) */}
      <rect x="160" y="128" width="166" height="112" fill="#0a0c0f" />
      <rect x="168" y="136" width="150" height="104" fill={`url(#${id("inside")})`} />
      <path d="M168 226h150" stroke="#ffd27a" strokeOpacity="0.18" />

      {/* Rideau métallique */}
      <g clipPath={`url(#${id("door")})`}>
        <g className={styles.shutter} data-depot-shutter="">
          <rect x="168" y="136" width="150" height="104" fill={`url(#${id("slat")})`} />
          <path d={SLATS} stroke="#1a1f25" strokeWidth="2" />
          <path d={SLATS} stroke="#4a525d" strokeWidth="0.8" strokeOpacity="0.6" transform="translate(0 2)" />
          <rect x="168" y="232" width="150" height="8" fill="#454d58" />
          <rect x="236" y="234" width="14" height="3" rx="1" fill="#1a1f25" />
        </g>
      </g>
      {/* Coffre du rideau et glissières */}
      <rect x="158" y="122" width="170" height="14" rx="2" fill="#262c34" />
      <path d="M158 129h170" stroke="#353c45" />
      <rect x="160" y="136" width="8" height="104" fill="#20262d" />
      <rect x="318" y="136" width="8" height="104" fill="#20262d" />

      {/* Bornes de balisage de part et d'autre de la baie (bandes jaunes : jeton de marque) */}
      <path d="M143.5 206h5a1.5 1.5 0 0 1 1.5 1.5V240h-8v-32.5a1.5 1.5 0 0 1 1.5-1.5zM337.5 206h5a1.5 1.5 0 0 1 1.5 1.5V240h-8v-32.5a1.5 1.5 0 0 1 1.5-1.5z" fill="#0d0f12" />
      <path d={BORNE_STRIPES} fill="currentColor" />

      {/* Deux appliques au sodium au-dessus de la baie : cône, flaque au sol */}
      <path d="M192 121l-60 119h120zM294 121l-60 119h120z" fill={`url(#${id("cone")})`} />
      <ellipse cx="192" cy="242" rx="70" ry="8" fill={`url(#${id("pool")})`} />
      <ellipse cx="294" cy="242" rx="70" ry="8" fill={`url(#${id("pool")})`} />
      <path d="M185 114h14l-2 5h-10zM287 114h14l-2 5h-10z" fill="#2c333c" />
      <path d="M187 118.5h10a1 1 0 0 1 1 1v.5a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-.5a1 1 0 0 1 1-1zM289 118.5h10a1 1 0 0 1 1 1v.5a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-.5a1 1 0 0 1 1-1z" fill="#ffd27a" />

      {/* Enseigne losange RNB AUTO */}
      <g>
        <path d="M240 76L264 100L240 124L216 100Z" fill={signLit ? "currentColor" : "#6b5410"} stroke="#0d0f12" strokeWidth="2.5" />
        <path d="M240 81L259 100L240 119L221 100Z" fill="none" stroke="#0d0f12" strokeOpacity="0.55" strokeWidth="1" />
        <text
          x="240"
          y="99"
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="900"
          fill="#0d0f12"
          style={{ fontStretch: "75%", letterSpacing: "0.04em" }}
        >
          RNB
        </text>
        <text
          x="240"
          y="108.5"
          textAnchor="middle"
          fontSize="6"
          fontWeight="800"
          fill="#0d0f12"
          style={{ fontStretch: "120%", letterSpacing: "0.12em" }}
        >
          AUTO
        </text>
      </g>
    </svg>
  );
}
