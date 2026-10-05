/**
 * P1 · NightSky : le ciel continu de tout le site, fixe derrière le contenu (docs/09, C.5).
 * Minuit en haut de page, puis la nuit, l'heure bleue et l'aube, section après section
 * (`data-sky` sur chaque section, recopié sur <html> par le runtime). Sans JavaScript : minuit.
 *
 * Couches, de l'arrière vers l'avant : dégradé du ciel, étoiles fixes (un seul calque : 12 sur
 * mobile, 24 sur ordinateur plus une poussière d'étoiles très fines), nappes de nuages éclairées
 * par la ville (elles s'éteignent avec elle), lueur de la ville sur l'horizon, brume basse, grain
 * de bitume, halo des phares (P21), puis six étoiles qui scintillent à l'arrivée et se figent (ce
 * n'est pas une boucle), en dernier pour que leurs animations ne fassent sortir aucune autre
 * couche du calque du ciel. Tout est décoratif : `aria-hidden`, sans pointeur.
 * Les étoiles fixes sont des dégradés écrits dans la feuille de style (mis en cache), pas des
 * attributs `style` répétés dans chaque page ; chacune n'est peinte que sur sa petite tuile.
 * Styles et états : src/styles/motion.css (« P1 · NightSky »).
 */
import type { CSSProperties, ReactElement } from "react";

/** Générateur pseudo-aléatoire déterministe (repris de night-road.tsx) : mêmes étoiles à chaque rendu. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

/**
 * Six étoiles qui scintillent à l'arrivée. Même tirage que les étoiles fixes (graine 47) : par
 * étoile, éclat, x, y, puis rayon et intensité (étoiles ordinaires seulement), puis teinte.
 */
const TWINKLES = (() => {
  const rand = seeded(47);
  return Array.from({ length: 6 }, (_, i) => {
    const bright = rand() > 0.84;
    const x = Math.round(rand() * 1000) / 10;
    const y = Math.round(rand() ** 1.5 * 960) / 10;
    if (!bright) {
      rand();
      rand();
    }
    rand();
    return {
      left: `${x}%`,
      top: `${(y * 0.46).toFixed(1)}%`,
      "--tw-dur": `${3 + ((i * 7) % 5) * 0.5}s`,
      "--tw-delay": `${-i * 0.9}s`,
    };
  });
})();

export function NightSky(): ReactElement {
  return (
    <div className="night-sky" aria-hidden="true">
      <div className="night-sky__stars" />
      <div className="night-sky__clouds" />
      <div className="night-sky__glow" />
      <div className="night-sky__haze" />
      <div className="night-sky__grain" />
      <div className="night-sky__halo">
        <div className="night-sky__halo-window">
          <div className="night-sky__halo-grain" />
        </div>
      </div>
      {/* En dernier : leurs animations ne font sortir aucune autre couche du calque du ciel. */}
      <div className="night-sky__twinkles">
        {TWINKLES.map((style, i) => (
          <span key={i} className="night-sky__twinkle" style={style as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
