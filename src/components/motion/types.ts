/**
 * Types du système de motion (docs/09, C.4). Point d'extension des lots : un module de scène
 * exporte par défaut un `SceneModule`, enregistré par `useScenes` et rendu `<div data-scene="nom">`.
 */

export type MotionLevel = "full" | "lite" | "off";
export type SkyState = "minuit" | "nuit" | "bleue" | "aube";

export type GsapKit = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
  SplitText: typeof import("gsap/SplitText").SplitText;
};

export type SceneHelpers = {
  /** Trace un chemin pathLength="1" (0 → 1) via --draw. Suit aussi `data-draw-mask="<id>"`. */
  setDraw(el: SVGGeometryElement | SVGGElement, progress: number): void;
  /** Place un groupe sur un chemin (getPointAtLength) et l'oriente dans le sens de la marche. */
  follow(el: SVGGraphicsElement, path: SVGGeometryElement, progress: number, opts?: { rotate?: boolean }): void;
  /** Petite interpolation sans GSAP (requestAnimationFrame). Retourne une fonction d'arrêt. */
  tween(opts: { duration: number; ease?: (t: number) => number; onUpdate: (p: number) => void; onComplete?: () => void }): () => void;
};

export type SceneContext = {
  level: Exclude<MotionLevel, "off">;
  /** (min-width: 1024px) and (pointer: fine) */
  desktop: boolean;
  /** Non nul si le module déclare `needsGsap` (ou si sa fonction `needsGsap` a répondu vrai). */
  kit: GsapKit | null;
  helpers: SceneHelpers;
};

/** Ce que le runtime sait AVANT d'initialiser une scène (pour décider de charger GSAP). */
export type SceneGsapQuery = { level: Exclude<MotionLevel, "off">; desktop: boolean };

export type SceneModule = {
  /**
   * La scène a-t-elle besoin de GSAP (`ctx.kit` non nul) ? Booléen, ou fonction appelée avec le
   * niveau et le format : par exemple `({ level, desktop }) => level === "full" && desktop`
   * charge GSAP pour la version liée au défilement sans l'imposer en `lite` sur mobile.
   */
  needsGsap?: boolean | ((query: SceneGsapQuery) => boolean);
  /** Appelé quand la racine approche de l'écran. Retourne une fonction de nettoyage (facultative). */
  init(root: HTMLElement, ctx: SceneContext): void | (() => void);
};

export type SceneLoaders = Record<string, () => Promise<{ default: SceneModule }>>;
