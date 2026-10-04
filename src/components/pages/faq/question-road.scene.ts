/**
 * Scène `question-road` (docs/09, F.5, P22) : la dépanneuse parcourt une fois la route en « ? »,
 * puis se gare au dépôt (le point du « ? »).
 *
 * L'état de base (rendu serveur) est l'état final : dépanneuse garée. Au démarrage, elle s'efface
 * au dépôt (240 ms), réapparaît au départ du « ? », roule 6 s en accélérant puis en freinant, et
 * retrouve exactement sa place. Aucun GSAP : `helpers.follow` (getPointAtLength) et `helpers.tween`.
 * Nettoyage : tout revient à l'état final.
 */
import type { SceneModule } from "@/components/motion/types";

const FADE_MS = 260;
const DRIVE_MS = 6000;

/** Démarre doucement, roule, freine en douceur (équivalent de `power2.inOut`). */
const drive = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const scene: SceneModule = {
  init(root, { helpers }) {
    const route = root.querySelector<SVGPathElement>("[data-qr-route]");
    const truck = root.querySelector<SVGGElement>("[data-qr-truck]");
    if (!route || !truck) return;
    const parked = truck.getAttribute("transform") ?? "";

    let stopTween: (() => void) | null = null;
    root.setAttribute("data-qr-phase", "leaving");
    const timer = window.setTimeout(() => {
      helpers.follow(truck, route, 0);
      root.setAttribute("data-qr-phase", "driving");
      stopTween = helpers.tween({
        duration: DRIVE_MS,
        ease: drive,
        onUpdate: (progress) => helpers.follow(truck, route, progress),
        onComplete: () => {
          truck.setAttribute("transform", parked);
          root.setAttribute("data-qr-phase", "parked");
        },
      });
    }, FADE_MS);

    return () => {
      window.clearTimeout(timer);
      stopTween?.();
      truck.setAttribute("transform", parked);
      root.removeAttribute("data-qr-phase");
    };
  },
};

export default scene;
