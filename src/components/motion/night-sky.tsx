/**
 * P1 · NightSky : le ciel continu de tout le site, fixe derrière le contenu (docs/09, C.5).
 * Minuit en haut de page, puis la nuit, l'heure bleue et l'aube, section après section
 * (`data-sky` sur chaque section, recopié sur <html> par le runtime). Sans JavaScript : minuit.
 *
 * Couches, de l'arrière vers l'avant : dégradé du ciel, étoiles fixes (12 sur mobile, 24 sur
 * ordinateur plus une poussière d'étoiles très fines, six qui scintillent), nappes de nuages
 * éclairées par la ville (elles s'éteignent avec elle), lueur de la ville sur l'horizon, brume
 * basse, grain de bitume, halo des phares (P21). Tout est décoratif : `aria-hidden`, sans pointeur.
 * Styles et états : src/styles/motion.css (« P1 · NightSky »).
 */
import type { CSSProperties, ReactElement } from "react";

/** Générateur pseudo-aléatoire déterministe (repris de night-road.tsx) : même ciel à chaque rendu. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

type Star = { x: number; y: number; r: number; a: number; warm: boolean; bright: boolean };

function makeStars(seed: number, count: number, kind: "stars" | "dust"): Star[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => {
    const bright = kind === "stars" && rand() > 0.84;
    return {
      x: Math.round(rand() * 1000) / 10,
      // Plus d'étoiles en haut : la ville éclaire le bas du ciel.
      y: Math.round(rand() ** 1.5 * 960) / 10,
      r: kind === "dust" ? 0.5 + rand() * 0.3 : bright ? 1.35 : 0.75 + rand() * 0.4,
      a: kind === "dust" ? 0.22 + rand() * 0.2 : bright ? 0.95 : 0.45 + rand() * 0.3,
      warm: rand() > 0.72,
      bright,
    };
  });
}

/** Une étoile = un dégradé radial ; les plus brillantes ont un petit halo. */
const starLayer = (stars: Star[]) =>
  stars
    .flatMap((s) => {
      const color = s.warm ? "255 236 212" : "227 236 255";
      const core = `radial-gradient(circle at ${s.x}% ${s.y}%, rgb(${color} / ${s.a.toFixed(2)}) 0 ${s.r.toFixed(2)}px, transparent ${(s.r + 0.8).toFixed(2)}px)`;
      if (!s.bright) return [core];
      return [core, `radial-gradient(circle at ${s.x}% ${s.y}%, rgb(${color} / 0.16), transparent 5px)`];
    })
    .join(",");

const MOBILE_STARS = makeStars(11, 12, "stars");
const DESKTOP_STARS = makeStars(29, 12, "stars");
const DUST = makeStars(83, 26, "dust");
const TWINKLES = makeStars(47, 6, "stars").map((s, i) => ({
  left: `${s.x}%`,
  top: `${(s.y * 0.46).toFixed(1)}%`,
  "--tw-dur": `${3 + ((i * 7) % 5) * 0.5}s`,
  "--tw-delay": `${-i * 0.9}s`,
}));

export function NightSky(): ReactElement {
  return (
    <div className="night-sky" aria-hidden="true">
      <div className="night-sky__stars" style={{ backgroundImage: starLayer(MOBILE_STARS) }} />
      <div className="night-sky__stars night-sky__stars--more" style={{ backgroundImage: starLayer(DESKTOP_STARS) }} />
      <div className="night-sky__stars night-sky__stars--more night-sky__stars--dust" style={{ backgroundImage: starLayer(DUST) }} />
      {TWINKLES.map((style, i) => (
        <span key={i} className="night-sky__twinkle" style={style as CSSProperties} />
      ))}
      <div className="night-sky__clouds" />
      <div className="night-sky__glow" />
      <div className="night-sky__haze" />
      <div className="night-sky__grain" />
      <div className="night-sky__halo" />
    </div>
  );
}
