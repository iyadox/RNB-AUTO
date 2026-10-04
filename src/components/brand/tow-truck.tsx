/**
 * Dépanneuse plateau en vue de profil (illustration SVG, animable en CSS).
 * Les identifiants internes sont préfixés pour pouvoir afficher plusieurs dépanneuses.
 */
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
};

function Wheel({ cx, cy, moving, id }: { cx: number; cy: number; moving: boolean; id: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={18.5} fill="#0b0d10" />
      <circle cx={cx} cy={cy} r={17} fill="#121519" stroke="#2a3038" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={10.5} fill={`url(#${id}-rim)`} />
      <g
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        className={moving ? "animate-wheel" : undefined}
      >
        <circle cx={cx} cy={cy} r={10.5} fill="none" />
        {[0, 72, 144, 216, 288].map((angle) => (
          <circle
            key={angle}
            cx={cx + 6.2 * Math.cos((angle * Math.PI) / 180)}
            cy={cy + 6.2 * Math.sin((angle * Math.PI) / 180)}
            r={1.6}
            fill="#4b5560"
          />
        ))}
        <path d={`M${cx - 9} ${cy}h18`} stroke="#7d8894" strokeWidth={0.8} opacity={0.6} />
      </g>
      <circle cx={cx} cy={cy} r={3.4} fill="#2a3038" stroke="#9aa4b0" strokeWidth={0.8} />
    </g>
  );
}

export function TowTruck({
  className,
  loaded = false,
  moving = false,
  headlights = false,
  beacon = true,
  id = "truck",
}: TowTruckProps) {
  return (
    <svg viewBox="0 0 360 150" className={cn("overflow-visible", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-cab`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
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
        <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff3b0" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff3b0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#ff9a3d" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#ff7a1a" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-car`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f8fae" />
          <stop offset="1" stopColor="#36506a" />
        </linearGradient>
        <pattern id={`${id}-chevrons`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="5" height="10" fill="#ffc400" />
          <rect x="5" width="5" height="10" fill="#0d0f12" />
        </pattern>
      </defs>

      {/* Ombre au sol */}
      <ellipse cx="180" cy="134" rx="168" ry="6" fill="#000" opacity="0.55" />

      {headlights ? (
        <polygon points="336,71 470,52 470,104 336,82" fill={`url(#${id}-beam)`} opacity="0.55" />
      ) : null}

      <g className={moving ? "animate-truck-idle" : undefined}>
        {/* Châssis */}
        <rect x="22" y="94" width="312" height="9" rx="2" fill="#1b2026" />

        {/* Plateau */}
        <path d="M8 88 L20 74 H236 V88 Z" fill={`url(#${id}-bed)`} />
        <path d="M20 74 H236" stroke="#8a95a1" strokeWidth="1.2" />
        <rect x="18" y="80" width="34" height="8" fill={`url(#${id}-chevrons)`} />
        <rect x="58" y="88" width="178" height="6" fill="#ffc400" />
        <text x="148" y="86" textAnchor="middle" fontSize="7.5" fontWeight="800" letterSpacing="2.2" fill="#ffc400" style={{ fontStretch: "120%" }}>
          RNB AUTO
        </text>

        {/* Coffre à outils */}
        <rect x="150" y="94" width="66" height="14" rx="1.5" fill="#262c33" />
        <path d="M150 99 H216" stroke="#3b434c" />

        {/* Tête de plateau avec treuil */}
        <rect x="226" y="48" width="12" height="28" rx="1.5" fill="#2f363e" />
        <circle cx="232" cy="64" r="3.6" fill="#11151a" stroke="#6f7b88" strokeWidth="1" />
        <path d="M232 64 L120 72" stroke="#9aa4b0" strokeWidth="0.8" opacity={loaded ? 0.8 : 0} />

        {/* Voiture chargée */}
        {loaded ? (
          <g>
            <path
              d="M40 66 Q38 57 47 55 L80 52 L104 39 Q110 35 120 35 H158 Q168 35 176 42 L191 52 Q204 54 206 60 V64 Q206 68 200 68 H44 Q40 68 40 66Z"
              fill={`url(#${id}-car)`}
            />
            <path d="M108 42 Q112 39 120 39 H138 V52 H90Z" fill="#0f1720" />
            <path d="M142 39 H157 Q165 39 171 45 L178 52 H142Z" fill="#0f1720" />
            <path d="M48 58 H200" stroke="#ffffff" strokeOpacity="0.25" />
            <circle cx="70" cy="66" r="9" fill="#0b0d10" />
            <circle cx="70" cy="66" r="4.2" fill="#9aa4b0" />
            <circle cx="176" cy="66" r="9" fill="#0b0d10" />
            <circle cx="176" cy="66" r="4.2" fill="#9aa4b0" />
            <rect x="198" y="58" width="6" height="3" rx="1" fill="#ff5a3d" />
          </g>
        ) : null}

        {/* Cabine */}
        <path
          d="M240 103 V47 Q240 40 247 40 H287 Q293 40 297 45 L314 64 Q317 67 323 68 L330 69 Q337 70 337 77 V103 Z"
          fill={`url(#${id}-cab)`}
        />
        <path d="M250 48 H285 Q289 48 291 51 L304 64 H250 Z" fill={`url(#${id}-glass)`} />
        <path d="M262 48 L254 64" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="5" />
        <path d="M296 66 L299 102" stroke="#b9b8b2" strokeWidth="1" />
        <path d="M250 70 V102" stroke="#b9b8b2" strokeWidth="1" />
        <rect x="256" y="72" width="9" height="2.6" rx="1.3" fill="#9f9e98" />
        <rect x="240" y="86" width="97" height="7" fill="#ffc400" />
        <path d="M276 76 L281 81 L276 86 L271 81 Z" fill="#0d0f12" opacity="0.85" />
        <rect x="287" y="52" width="5" height="10" rx="1.5" fill="#1b2026" />
        <rect x="326" y="96" width="14" height="8" rx="2" fill="#262c33" />
        <rect x="331" y="72" width="6" height="7" rx="1.5" fill={headlights ? "#fff3b0" : "#e0dccc"} />
        <rect x="241" y="80" width="4" height="5" rx="1" fill="#ff5a3d" />

        {/* Gyrophare */}
        <rect x="252" y="35" width="30" height="5" rx="2" fill="#1b2026" />
        {beacon ? (
          <>
            <circle cx="259" cy="34" r="22" fill={`url(#${id}-glow)`} className="animate-beacon-flash" />
            <circle
              cx="275"
              cy="34"
              r="22"
              fill={`url(#${id}-glow)`}
              className="animate-beacon-flash"
              style={{ animationDelay: "0.6s" }}
            />
          </>
        ) : null}
        <rect x="254" y="31" width="10" height="5" rx="2" fill="#ff8a2a" />
        <rect x="270" y="31" width="10" height="5" rx="2" fill="#ff8a2a" />
      </g>

      {/* Passages de roues et roues */}
      <circle cx="78" cy="114" r="22" fill="#08090b" />
      <circle cx="284" cy="114" r="22" fill="#08090b" />
      <Wheel cx={78} cy={114} moving={moving} id={id} />
      <Wheel cx={284} cy={114} moving={moving} id={id} />
    </svg>
  );
}
