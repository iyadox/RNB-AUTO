/**
 * Scène « loading-sequence » (docs/09, P22) : chargement d'une voiture sur le plateau.
 *
 * Progression p (0 → 1) :
 * - 0 → 0,14 : le câble se déroule du treuil jusqu'à l'avant de la voiture (au pied de la rampe) ;
 * - 0,14 → 0,72 : la voiture monte (ses roues arrière restent au sol tant que la pente l'exige),
 *   le câble raccourcit ;
 * - 0,72 → 0,9 : le plateau revient à plat, voiture chargée ;
 * - 0,9 → 1 : les phares s'allument.
 * `scrub` (ordinateur, niveau `full`, GSAP) : liée au défilement. Sinon, une fois (2,6 s),
 * 400 ms après l'entrée dans l'écran. Si la scène est déjà visible à l'initialisation (dans les
 * deux modes), la voiture chargée quitte le plateau en fondu et réapparaît à sa pose de départ
 * (700 ms) : jamais de saut. Nettoyage : tout revient à l'état final.
 *
 * Géométrie (repère de `TowTruck`, 360 × 150) : le plateau pivote autour de (236, 94) ;
 * la voiture chargée touche le plateau en (206, 75) à l'avant ; le sol est à y = 136.
 */
import type { SceneContext, SceneModule } from "@/components/motion/types";

const PIVOT = { x: 236, y: 94 };
/** Point de contact avant de la voiture chargée (repère du plateau). */
const FRONT = { x: 206, y: 75 };
/** Point d'accroche du câble sur la voiture (repère de la voiture chargée). */
const HOOK = { x: 205, y: 63 };
const WINCH = { x: 232, y: 64 };
const CAR_LENGTH = 166;
const GROUND = 136;
const TILT = -13;
/** Abscisse (repère du plateau) où la voiture prend la rampe. */
const RAMP_START = 18;
const ONCE_MS = 2600;
const ONCE_DELAY_MS = 400;
/** Mise en place (voiture qui apparaît au pied de la rampe) quand la scène est déjà visible. */
const SETUP_MS = 700;

type Pt = { x: number; y: number };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (p: number, from: number, to: number) => clamp01((p - from) / (to - from));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const rad = (deg: number) => (deg * Math.PI) / 180;
const fmt = (v: number) => (Math.round(v * 100) / 100).toString();

/** Rotation de `p` autour de `c` (degrés, sens SVG). */
function rotate(p: Pt, c: Pt, deg: number): Pt {
  const a = rad(deg);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

/** Pose de la voiture dans le monde : point de contact avant `at`, inclinaison `angle`. */
type Pose = { at: Pt; angle: number };

/** Pose pour une montée s (0 → 1), plateau incliné de TILT. */
function climbPose(s: number): Pose {
  const rampAt = (u: number) => rotate({ x: u, y: FRONT.y }, PIVOT, TILT);
  const start = rampAt(RAMP_START);
  // Avant la rampe : la voiture roule au sol jusqu'au bout du plateau.
  const ground: Pt = { x: start.x - 18, y: GROUND };
  let at: Pt;
  if (s < 0.16) {
    const t = s / 0.16;
    at = { x: lerp(ground.x, start.x, t), y: lerp(ground.y, start.y, t) };
  } else {
    at = rampAt(lerp(RAMP_START, FRONT.x, (s - 0.16) / 0.84));
  }
  // Les roues arrière restent au sol tant que la pente de la voiture est inférieure à celle du plateau.
  const lift = Math.min(1, Math.max(0, (GROUND - at.y) / CAR_LENGTH));
  const angle = Math.max(TILT, (-Math.asin(lift) * 180) / Math.PI);
  return { at, angle };
}

/** Transform de la voiture DANS le groupe du plateau incliné de `bed` degrés. */
function carTransform(pose: Pose, bed: number): string {
  return `rotate(${fmt(-bed)} ${PIVOT.x} ${PIVOT.y}) translate(${fmt(pose.at.x)} ${fmt(pose.at.y)}) rotate(${fmt(pose.angle)}) translate(${-FRONT.x} ${-FRONT.y})`;
}

/** Point d'accroche du câble, dans le repère du plateau. */
function hookInBed(pose: Pose, bed: number): Pt {
  const local = rotate({ x: HOOK.x - FRONT.x, y: HOOK.y - FRONT.y }, { x: 0, y: 0 }, pose.angle);
  const world = { x: pose.at.x + local.x, y: pose.at.y + local.y };
  return rotate(world, PIVOT, -bed);
}

function init(root: HTMLElement, ctx: SceneContext): () => void {
  const bed = root.querySelector<SVGGElement>('[data-part="bed"]');
  const car = root.querySelector<SVGGElement>('[data-part="car"]');
  const cable = root.querySelector<SVGPathElement>('[data-part="cable"] .draw');
  const lights = root.querySelector<SVGGElement>('[data-part="headlights"]');
  const pool = root.querySelector<HTMLElement>("[data-loading-pool]");
  if (!bed || !car || !cable) return () => {};

  const saved = {
    bed: bed.getAttribute("transform"),
    car: car.getAttribute("transform"),
    cable: cable.getAttribute("d"),
  };

  const setLights = (value: number) => {
    const v = value.toFixed(3);
    lights?.style.setProperty("opacity", v);
    pool?.style.setProperty("opacity", v);
  };
  const setCable = (to: Pt, draw: number) => {
    cable.setAttribute("d", `M${WINCH.x} ${WINCH.y}L${fmt(to.x)} ${fmt(to.y)}`);
    ctx.helpers.setDraw(cable, draw);
  };

  /** Applique la progression p (0 → 1). */
  const apply = (p: number) => {
    const climb = easeInOut(seg(p, 0.14, 0.72));
    const flatten = easeInOut(seg(p, 0.72, 0.9));
    const bedAngle = lerp(TILT, 0, flatten);
    const pose = flatten > 0 ? null : climbPose(climb);
    bed.setAttribute("transform", `rotate(${fmt(bedAngle)} ${PIVOT.x} ${PIVOT.y})`);
    if (pose) {
      car.setAttribute("transform", carTransform(pose, bedAngle));
      setCable(hookInBed(pose, bedAngle), p < 0.14 ? easeOut(seg(p, 0, 0.14)) : 1);
    } else {
      car.removeAttribute("transform");
      setCable(hookInBed({ at: rotate(FRONT, PIVOT, TILT), angle: TILT }, TILT), 1);
    }
    car.style.removeProperty("opacity");
    setLights(easeOut(seg(p, 0.9, 1)));
  };

  const restore = () => {
    if (saved.bed === null) bed.removeAttribute("transform");
    else bed.setAttribute("transform", saved.bed);
    if (saved.car === null) car.removeAttribute("transform");
    else car.setAttribute("transform", saved.car);
    if (saved.cable !== null) cable.setAttribute("d", saved.cable);
    cable.style.removeProperty("--draw");
    car.style.removeProperty("opacity");
    lights?.style.removeProperty("opacity");
    pool?.style.removeProperty("opacity");
  };

  // Déjà visible à l'initialisation (ouverture de /remorquage) : l'état de base est l'état final
  // (voiture chargée). Plutôt que de la téléporter au pied de la rampe, elle quitte le plateau
  // en fondu, le plateau s'incline, puis elle réapparaît à la pose `target()` (700 ms).
  let stop: () => void = () => {};
  let timer = 0;
  const rect = root.getBoundingClientRect();
  const visible = rect.top < window.innerHeight && rect.bottom > 0;

  const setup = (target: () => number, done: () => void) => {
    stop = ctx.helpers.tween({
      duration: SETUP_MS,
      ease: (t) => t,
      onUpdate: (t) => {
        if (t < 0.45) {
          // Fondu de sortie de la voiture chargée, plateau qui s'incline.
          car.style.setProperty("opacity", (1 - t / 0.45).toFixed(3));
          bed.setAttribute("transform", `rotate(${fmt(lerp(0, TILT, easeInOut(t / 0.45)))} ${PIVOT.x} ${PIVOT.y})`);
          setLights(1 - t / 0.45);
          ctx.helpers.setDraw(cable, 0);
        } else {
          apply(target());
          car.style.setProperty("opacity", easeOut((t - 0.45) / 0.55).toFixed(3));
        }
      },
      onComplete: () => {
        car.style.removeProperty("opacity");
        done();
      },
    });
  };

  const kit = ctx.kit;
  if (root.dataset.mode === "scrub" && kit && ctx.desktop && ctx.level === "full") {
    let ready = false;
    const customStart = root.dataset.scrubStart;
    // Fin par défaut : 60 % de la hauteur de l'écran APRÈS le départ réellement retenu. « +=60% »
    // se compterait depuis le départ non borné : une scène déjà dans l'écran au chargement
    // (ouverture) finirait de charger en 150 px. Le départ par défaut, « clamp(top 85%) », est
    // recalculé ici à chaque rafraîchissement (position absolue de défilement).
    const defaultEnd = () => {
      const top = root.getBoundingClientRect().top + window.scrollY;
      return Math.max(0, top - window.innerHeight * 0.85) + window.innerHeight * 0.6;
    };
    const trigger = kit.ScrollTrigger.create({
      trigger: root,
      start: customStart || "clamp(top 85%)",
      end: root.dataset.scrubEnd || (customStart ? "+=60%" : defaultEnd),
      onUpdate: (self) => {
        if (ready) apply(self.progress);
      },
    });
    const start = () => {
      ready = true;
      apply(trigger.progress);
    };
    // Une voiture déjà montée (progression avancée) n'a pas besoin de mise en place.
    if (visible && trigger.progress < 0.72) setup(() => trigger.progress, start);
    else start();
    return () => {
      stop();
      trigger.kill();
      restore();
    };
  }

  // Une fois : 400 ms après l'entrée dans l'écran (après la mise en place si déjà visible).
  const play = () => {
    stop = ctx.helpers.tween({ duration: ONCE_MS, ease: (t) => t, onUpdate: apply });
  };

  if (visible) {
    setup(
      () => 0,
      () => {
        timer = window.setTimeout(play, ONCE_DELAY_MS);
      },
    );
    return () => {
      window.clearTimeout(timer);
      stop();
      restore();
    };
  }

  apply(0);
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      timer = window.setTimeout(play, ONCE_DELAY_MS);
    },
    { rootMargin: "0px 0px -15% 0px" },
  );
  io.observe(root);
  return () => {
    io.disconnect();
    window.clearTimeout(timer);
    stop();
    restore();
  };
}

const scene: SceneModule = {
  // GSAP n'est utilisé qu'en mode `scrub`, sur ordinateur en niveau `full` (même condition que
  // `init`) ; le mode `once` passe par `helpers.tween`. En `lite` ou sur téléphone, GSAP n'est
  // donc jamais chargé pour cette scène (appareils modestes).
  needsGsap: ({ level, desktop }) => desktop && level === "full",
  init,
};

export default scene;
