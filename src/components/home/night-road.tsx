/**
 * Scène de nuit animée en CSS (aucun JavaScript nécessaire) : ville au loin, lampadaires,
 * route qui défile et dépanneuse qui roule. Les couches défilent à des vitesses différentes
 * (effet de profondeur).
 */
import { TowTruck } from "@/components/brand/tow-truck";

/** Générateur pseudo-aléatoire déterministe : la ville est identique à chaque rendu. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

function Skyline({ seed, height, color, windows }: { seed: number; height: number; color: string; windows: boolean }) {
  const rand = seeded(seed);
  const width = 1600;
  const buildings: { x: number; w: number; h: number }[] = [];
  let x = 0;
  while (x < width) {
    const w = 28 + Math.floor(rand() * 70);
    const h = height * (0.25 + rand() * 0.75);
    buildings.push({ x, w: Math.min(w, width - x), h });
    x += w + Math.floor(rand() * 6);
  }
  const lights: { x: number; y: number }[] = [];
  if (windows) {
    for (const b of buildings) {
      for (let wy = height - b.h + 8; wy < height - 6; wy += 9) {
        for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 8) {
          if (rand() > 0.86) lights.push({ x: wx, y: wy });
        }
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-full w-1/2 shrink-0" aria-hidden="true">
      {buildings.map((b) => (
        <rect key={b.x} x={b.x} y={height - b.h} width={b.w} height={b.h} fill={color} />
      ))}
      {lights.map((l) => (
        <rect key={`${l.x}-${l.y}`} x={l.x} y={l.y} width={3} height={4} fill="#ffd27a" opacity={0.55} />
      ))}
    </svg>
  );
}

function StreetLamps() {
  return (
    <svg viewBox="0 0 1600 160" preserveAspectRatio="none" className="h-full w-1/2 shrink-0" aria-hidden="true">
      <defs>
        <radialGradient id="lamp-glow" cx="0.5" cy="0" r="0.9">
          <stop offset="0" stopColor="#ffd27a" stopOpacity="0.32" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => {
        const x = 200 + i * 400;
        return (
          <g key={i}>
            <polygon points={`${x + 34},28 ${x - 30},160 ${x + 100},160`} fill="url(#lamp-glow)" />
            <rect x={x - 2} y={24} width={4} height={136} fill="#1d2228" />
            <path d={`M${x} 26 Q${x + 4} 16 ${x + 30} 18`} stroke="#1d2228" strokeWidth={4} fill="none" />
            <rect x={x + 24} y={17} width={18} height={6} rx={2} fill="#fff1c4" />
          </g>
        );
      })}
    </svg>
  );
}

export function NightRoad() {
  return (
    <div data-hero-scene data-pause-offscreen className="pointer-events-none relative mt-4 min-h-[230px] w-full flex-1 overflow-hidden lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:h-[38vh] lg:min-h-[280px]" aria-hidden="true">
      {/* Lueur de la ville */}
      <div className="absolute inset-x-0 bottom-[30%] h-2/3 bg-[radial-gradient(ellipse_at_50%_100%,rgb(255_160_40_/_0.16),transparent_65%)]" />
      {/* Ville au loin */}
      <div className="absolute inset-x-0 bottom-[30%] h-[46%] opacity-70">
        <div className="flex h-full w-[200%] animate-[marquee_140s_linear_infinite]">
          <Skyline seed={7} height={200} color="#14181d" windows={false} />
          <Skyline seed={7} height={200} color="#14181d" windows={false} />
        </div>
      </div>
      {/* Ville proche */}
      <div className="absolute inset-x-0 bottom-[30%] h-[34%]">
        <div className="flex h-full w-[200%] animate-[marquee_70s_linear_infinite]">
          <Skyline seed={42} height={140} color="#0f1216" windows />
          <Skyline seed={42} height={140} color="#0f1216" windows />
        </div>
      </div>
      {/* Lampadaires */}
      <div className="absolute inset-x-0 bottom-[30%] h-[44%]">
        <div className="flex h-full w-[200%] animate-[marquee_11s_linear_infinite]">
          <StreetLamps />
          <StreetLamps />
        </div>
      </div>
      {/* Route */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-b from-asphalt-800 to-asphalt-950">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-asphalt-600" />
        <div className="absolute inset-x-0 top-[44%] h-1 animate-road-x bg-[repeating-linear-gradient(90deg,rgb(245_243_238_/_0.75)_0_60px,transparent_60px_120px)]" />
        <div className="absolute inset-x-0 bottom-[14%] h-[3px] bg-white/15" />
      </div>
      {/* Dépanneuse */}
      <div className="absolute bottom-[12%] left-1/2 w-[min(100vw,640px)] -translate-x-[46%] lg:left-[70%] lg:w-[min(40vw,620px)] lg:-translate-x-1/2">
        <div data-hero-truck>
          <div className="animate-truck-in">
            <TowTruck moving headlights id="hero-truck" />
          </div>
        </div>
      </div>
      {/* Fondu vers le bas */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-asphalt-950 to-transparent" />
    </div>
  );
}
