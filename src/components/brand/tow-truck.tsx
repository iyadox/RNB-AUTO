"use client";
/**
 * Dépanneuse plateau en vue de profil (illustration SVG, animable en CSS).
 * Les identifiants internes sont préfixés pour pouvoir afficher plusieurs dépanneuses.
 *
 * Options ajoutées pour la refonte (docs/09, B.7), sans changer le rendu par défaut :
 * plateau incliné, câble du treuil, version en miroir, version « plan technique » et
 * parties nommées (`data-part`) pour les scènes. La caisse porte la classe `truck-body` et
 * les roues `data-wheel` (arrivée et freinage, P16).
 *
 * - La voiture chargée est la voiture du client (`CarSideBody` du kit) : la même d'une scène à
 *   l'autre. Le jaune RNB AUTO vient du jeton `--color-signal-500` (`currentColor`).
 * - Boucles (gyrophare, roues) : sans JavaScript, elles ne tournent que dans un ancêtre
 *   `[data-loops-nojs]` (l'ouverture, C.3).
 * Composant client : son balisage n'est pas répété dans la charge RSC de la page (G.2).
 */
import { CarSideBody } from "@/components/scenes/kit/car-side";
import kit from "@/components/scenes/kit/kit.module.css";
import { cn } from "@/components/ui/cn";

type TowTruckProps = {
  className?: string;
  /** Voiture chargée sur le plateau. */
  loaded?: boolean;
  /** Roues qui tournent et légère suspension. */
  moving?: boolean;
  /** Faisceau des phares. */
  headlights?: boolean;
  /** Gyrophare allumé. */
  beacon?: boolean;
  id?: string;
  /** Plateau à plat (par défaut) ou incliné jusqu'au sol pour le chargement. */
  bed?: "flat" | "tilted";
  /** Câble du treuil déroulé jusqu'à l'arrière du plateau (tracé `pathLength="1"`, classe `draw`). */
  cable?: boolean;
  /** Dépanneuse tournée vers la gauche (le texte « RNB AUTO » reste lisible). */
  mirrored?: boolean;
  /** `blueprint` : plan technique au trait (couleur du texte courant), sans lumière ni ombre. */
  variant?: "illustration" | "blueprint";
  /** Pose `data-part="body|bed|car|cable|cab|wheels|beacon|headlights"` pour les scènes. */
  parts?: boolean;
};

/** Plan technique : tout au trait, épaisseur constante, lumières masquées. */
const BLUEPRINT =
  "[&_*]:[fill:none] [&_*]:[stroke:currentColor] [&_*]:[stroke-width:1px] [&_*]:[vector-effect:non-scaling-stroke] [&_[data-glow]]:hidden";

/** Cinq goujons de jante en un seul tracé (arrondi au dixième). */
const studs = (cx: number, cy: number) =>
  [0, 72, 144, 216, 288]
    .map((angle) => {
      const x = Math.round((cx + 6.2 * Math.cos((angle * Math.PI) / 180) - 1.6) * 10) / 10;
      const y = Math.round((cy + 6.2 * Math.sin((angle * Math.PI) / 180)) * 10) / 10;
      return `M${x} ${y}a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0-3.2 0`;
    })
    .join("");

function Wheel({ cx, cy, moving, id }: { cx: number; cy: number; moving: boolean; id: string }) {
  return (
    <>
      <circle cx={cx} cy={cy} r={17} fill="#121519" stroke="#2a3038" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={10.5} fill={`url(#${id}-rim)`} />
      {/* Boîte de rotation centrée : le trait (±9) et les goujons (±7,5) sont symétriques. */}
      <g
        data-wheel=""
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        className={moving ? cn("animate-wheel", kit.loop) : undefined}
      >
        <path d={studs(cx, cy)} fill="#4b5560" />
        <path d={`M${cx - 9} ${cy}h18`} stroke="#7d8894" strokeWidth={0.8} opacity={0.6} />
      </g>
      <circle cx={cx} cy={cy} r={3.4} fill="#2a3038" stroke="#9aa4b0" strokeWidth={0.8} />
    </>
  );
}

export function TowTruck({
  className,
  loaded = false,
  moving = false,
  headlights = false,
  beacon = true,
  id = "truck",
  bed = "flat",
  cable = false,
  mirrored = false,
  variant = "illustration",
  parts = false,
}: TowTruckProps) {
  const part = (name: string) => (parts ? name : undefined);
  const blueprint = variant === "blueprint";
  // Le plateau pivote autour de sa tête (côté cabine) : l'arrière descend jusqu'au sol.
  const bedTransform = bed === "tilted" ? "rotate(-9 236 94)" : undefined;

  return (
    <svg
      viewBox="0 0 360 150"
      className={cn("overflow-visible", blueprint ? BLUEPRINT : kit.towTruck, className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-cab`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.55" stopColor="#ecebe6" />
          <stop offset="1" stopColor="#c9c8c2" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a3d52" />
          <stop offset="1" stopColor="#0c131c" />
        </linearGradient>
        <linearGradient id={`${id}-bed`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6570" />
          <stop offset="0.25" stopColor="#3b434c" />
          <stop offset="1" stopColor="#22282e" />
        </linearGradient>
        <radialGradient id={`${id}-rim`}>
          <stop offset="0" stopColor="#e6e9ed" />
          <stop offset="0.7" stopColor="#9aa4b0" />
          <stop offset="1" stopColor="#5d6773" />
        </radialGradient>
        {headlights ? (
          <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff3b0" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff3b0" stopOpacity="0" />
          </linearGradient>
        ) : null}
        {beacon ? (
          <radialGradient id={`${id}-glow`}>
            <stop offset="0" stopColor="#ff9a3d" stopOpacity="0.95" />
            <stop offset="0.4" stopColor="#ff7a1a" stopOpacity="0.45" />
            <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
          </radialGradient>
        ) : null}
        {/* Chevrons : jaune RNB AUTO (`currentColor`) et noir. */}
        <pattern id={`${id}-chevrons`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0h5v10H0z" fill="currentColor" />
          <path d="M5 0h5v10H5z" fill="#0d0f12" />
        </pattern>
      </defs>

      <g transform={mirrored ? "translate(360 0) scale(-1 1)" : undefined}>
        {/* Ombre au sol */}
        <ellipse data-glow="" cx="180" cy="134" rx="168" ry="6" fill="#000" opacity="0.55" />

        {headlights ? (
          <g data-part={part("headlights")} data-glow="">
            <polygon points="336,71 470,52 470,104 336,82" fill={`url(#${id}-beam)`} opacity="0.55" />
          </g>
        ) : null}

        {blueprint ? (
          // Axes de construction du plan technique (aucune cote, aucune dimension).
          <path d="M78 40V146M284 40V146M-6 136H366" strokeDasharray="3 4" opacity="0.45" />
        ) : null}

        <g data-part={part("body")} className={cn("truck-body", moving && cn("animate-truck-idle", kit.loop))}>
          {/* Châssis */}
          <rect x="22" y="94" width="312" height="9" rx="2" fill="#1b2026" />

          {/* Coffre à outils */}
          <rect x="150" y="94" width="66" height="14" rx="1.5" fill="#262c33" />
          <path d="M150 99 H216" stroke="#3b434c" />

          {/* Plateau (pivote quand il est incliné) */}
          <g data-part={part("bed")} transform={bedTransform}>
            <path d="M8 88 L20 74 H236 V88 Z" fill={`url(#${id}-bed)`} />
            <path d="M20 74 H236" stroke="#8a95a1" strokeWidth="1.2" />
            <rect x="18" y="80" width="34" height="8" fill={`url(#${id}-chevrons)`} />
            <rect x="58" y="88" width="178" height="6" fill="currentColor" />
            <text
              x="148"
              y="86"
              textAnchor="middle"
              fontSize="7.5"
              fontWeight="800"
              letterSpacing="2.2"
              fill="currentColor"
              style={{ fontStretch: "120%" }}
              transform={mirrored ? "translate(296 0) scale(-1 1)" : undefined}
            >
              RNB AUTO
            </text>

            {/* Tête de plateau avec treuil */}
            <rect x="226" y="48" width="12" height="28" rx="1.5" fill="#2f363e" />
            <circle cx="232" cy="64" r="3.6" fill="#11151a" stroke="#6f7b88" strokeWidth="1" />
            {/* Sangle de la voiture chargée */}
            {loaded ? <path d="M232 64 L120 72" stroke="#9aa4b0" strokeWidth="0.8" opacity={0.8} /> : null}

            {cable ? (
              <g data-part={part("cable")}>
                <path
                  className="draw"
                  pathLength={1}
                  d="M232 64 L14 73"
                  fill="none"
                  stroke="#c8ced6"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
                <path d="M14 73 v4 a2.5 2.5 0 0 1 -5 0" fill="none" stroke="#c8ced6" strokeWidth="1.4" strokeLinecap="round" />
              </g>
            ) : null}

            {/* Voiture chargée : la voiture du client (CarSide), de x = 40 à 206, roues sur le plateau.
                Repère inchangé pour la scène « loading-sequence » (avant en 206, 75). */}
            {loaded ? (
              <g data-part={part("car")}>
                <g transform="translate(30.05 4.4) scale(0.765)">
                  <CarSideBody id={`${id}-car`} ground={false} shared={{ rim: `${id}-rim`, glass: `${id}-glass` }} />
                </g>
              </g>
            ) : null}
          </g>

          {/* Cabine */}
          <g data-part={part("cab")}>
            <path
              d="M240 103 V47 Q240 40 247 40 H287 Q293 40 297 45 L314 64 Q317 67 323 68 L330 69 Q337 70 337 77 V103 Z"
              fill={`url(#${id}-cab)`}
            />
            <path d="M250 48 H285 Q289 48 291 51 L304 64 H250 Z" fill={`url(#${id}-glass)`} />
            <path d="M262 48 L254 64" stroke="#fff" strokeOpacity="0.22" strokeWidth="5" />
            <path d="M296 66 L299 102M250 70 V102" stroke="#b9b8b2" strokeWidth="1" />
            <rect x="256" y="72" width="9" height="2.6" rx="1.3" fill="#9f9e98" />
            <rect x="240" y="86" width="97" height="7" fill="currentColor" />
            <path d="M276 76 L281 81 L276 86 L271 81 Z" fill="#0d0f12" opacity="0.85" />
            <rect x="287" y="52" width="5" height="10" rx="1.5" fill="#1b2026" />
            <rect x="326" y="96" width="14" height="8" rx="2" fill="#262c33" />
            <rect x="331" y="72" width="6" height="7" rx="1.5" fill={headlights ? "#fff3b0" : "#e0dccc"} />
            <rect x="241" y="80" width="4" height="5" rx="1" fill="#ff5a3d" />
          </g>

          {/* Gyrophare (structure lue par la coque : barre, halos [data-glow], deux feux) */}
          <g data-part={part("beacon")}>
            <rect x="252" y="35" width="30" height="5" rx="2" fill="#1b2026" />
            {beacon ? (
              <>
                <circle data-glow="" cx="259" cy="34" r="22" fill={`url(#${id}-glow)`} className={cn("animate-beacon-flash", kit.loop)} />
                <circle
                  data-glow=""
                  cx="275"
                  cy="34"
                  r="22"
                  fill={`url(#${id}-glow)`}
                  className={cn("animate-beacon-flash", kit.loop)}
                  style={{ animationDelay: "0.6s" }}
                />
              </>
            ) : null}
            <rect x="254" y="31" width="10" height="5" rx="2" fill="#ff8a2a" />
            <rect x="270" y="31" width="10" height="5" rx="2" fill="#ff8a2a" />
          </g>
        </g>

        {/* Passages de roues et roues */}
        <g data-part={part("wheels")}>
          <path d="M56 114a22 22 0 1 0 44 0a22 22 0 1 0-44 0zM262 114a22 22 0 1 0 44 0a22 22 0 1 0-44 0z" fill="#08090b" />
          <Wheel cx={78} cy={114} moving={moving} id={id} />
          <Wheel cx={284} cy={114} moving={moving} id={id} />
        </g>
      </g>
    </svg>
  );
}
