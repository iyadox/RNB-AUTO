/**
 * Scène « steps-road » de /depannage (docs/09, P22, F.1 PK 02) : sur ordinateur, la dépanneuse
 * vue de dessus va de borne en borne sur la route horizontale ; le tracé jaune la suit et chaque
 * borne s'allume quand elle la dépasse (les bornes pas encore atteintes portent `data-pending`).
 *
 * - Niveau `full` : liée au défilement (ScrollTrigger lit seulement la progression, aucun pin).
 * - Niveau `lite` : jouée une fois (2,4 s) à l'entrée dans l'écran.
 * - Mobile et tablette : rien ici, la version verticale est animée en CSS (`view()`).
 * Déjà visible à l'initialisation en `lite` : elle reste à l'état final (aucun saut).
 * Nettoyage : tout revient à l'état final (dépanneuse à la dernière borne, tracé complet).
 */
import type { SceneContext, SceneModule } from "@/components/motion/types";

const ONCE_MS = 2400;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function init(root: HTMLElement, ctx: SceneContext): (() => void) | void {
  if (!ctx.desktop) return;
  const truck = root.querySelector<SVGGElement>("[data-steps-truck]");
  const trail = root.querySelector<SVGPathElement>("[data-steps-trail]");
  const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-step]"));
  if (!truck || !trail || steps.length === 0) return;

  const from = Number(root.dataset.from ?? 0);
  const to = Number(root.dataset.to ?? 0);
  const width = Number(root.dataset.width ?? 0);
  const lane = Number(root.dataset.lane ?? 0);
  if (!(to > from) || !(width > 0)) return;

  const savedTruck = truck.getAttribute("transform");
  // Abscisse de chaque borne (centre de sa colonne), en progression 0 → 1 du trajet.
  const thresholds = steps.map((_, i) => ((width * (i + 0.5)) / steps.length - from) / (to - from));

  const apply = (progress: number) => {
    const p = Math.min(1, Math.max(0, progress));
    const x = from + (to - from) * p;
    truck.setAttribute("transform", `translate(${x.toFixed(2)} ${lane})`);
    ctx.helpers.setDraw(trail, p);
    steps.forEach((step, i) => {
      if (p + 0.004 >= (thresholds[i] ?? 0)) step.removeAttribute("data-pending");
      else step.setAttribute("data-pending", "");
    });
  };

  const restore = () => {
    if (savedTruck === null) truck.removeAttribute("transform");
    else truck.setAttribute("transform", savedTruck);
    trail.style.removeProperty("--draw");
    for (const step of steps) step.removeAttribute("data-pending");
  };

  const kit = ctx.kit;
  if (ctx.level === "full" && kit) {
    const trigger = kit.ScrollTrigger.create({
      trigger: root,
      start: "top 72%",
      end: "bottom 58%",
      onUpdate: (self) => apply(self.progress),
    });
    apply(trigger.progress);
    return () => {
      trigger.kill();
      restore();
    };
  }

  // `lite` : une fois, à l'entrée. Déjà visible : reste à l'état final.
  const rect = root.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) return restore;
  apply(0);
  let stop: () => void = () => {};
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      stop = ctx.helpers.tween({ duration: ONCE_MS, ease: easeInOut, onUpdate: apply });
    },
    { rootMargin: "0px 0px -30% 0px" },
  );
  io.observe(root);
  return () => {
    io.disconnect();
    stop();
    restore();
  };
}

// Le kit ne sert qu'au niveau `full` sur ordinateur : en `lite` (interpolation maison) et sur
// mobile (rien ici), la page ne charge pas GSAP pour cette scène.
const scene: SceneModule = { needsGsap: ({ level, desktop }) => desktop && level === "full", init };
export default scene;
