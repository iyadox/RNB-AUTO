/**
 * Scène « story » (docs/09, E.4) : les temps de la carte collante, sur ordinateur seulement.
 *
 * L'aide des scènes collantes (P9) pose `data-beat="1..4"` sur la section selon l'étape au
 * milieu de l'écran. Cette scène :
 * - pose `data-story="0..4"` (0 tant que la section n'est pas atteinte) : l'épingle tombe (1),
 *   l'étiquette du prix se déplie (2), la dépanneuse sort du dépôt (3), le drapeau et la légende
 *   arrivent (4) — en CSS ;
 * - trace les trajets à chaque temps (900 ms par tronçon) : l'aller avec la dépanneuse (3), puis
 *   le transport en jaune et le retour (4) ; en remontant, les tracés se retirent ;
 * - suit l'interrupteur « Remorquage / Réparé sur place » (pas de transport, retour depuis vous).
 *
 * Sans GSAP (`needsGsap: false`) : en niveau `lite` sur mobile, la page ne charge pas GSAP pour
 * rien. Si l'aide P9 n'a pas tourné (GSAP bloqué, pas de `data-beat`), la scène ne fait rien :
 * la carte reste à l'état final, tout tracé.
 * Mobile : rien (les mini-cartes se dessinent seules, mode `view`). Nettoyage : état final.
 */
import type { SceneModule } from "@/components/motion/types";

type Leg = { el: SVGGElement | SVGGeometryElement; path: SVGGeometryElement };
type Step = { item: Leg; to: number; truck?: "aller" | "transport" };

const scene: SceneModule = {
  init(root, ctx) {
    if (!ctx.desktop || !root.hasAttribute("data-beat")) return;
    const { helpers } = ctx;

    const leg = (route: string, name: string): Leg | null => {
      const el = root.querySelector<SVGGElement | SVGGeometryElement>(
        `[data-story-route="${route}"] [data-route-leg="${name}"]`,
      );
      if (!el) return null;
      const path = el instanceof SVGGeometryElement ? el : el.querySelector<SVGGeometryElement>("path");
      return path ? { el, path } : null;
    };
    const towRoute = root.querySelector<SVGGElement>('[data-story-route="tow"] [data-route]');
    const truck = towRoute?.querySelector<SVGGraphicsElement>("[data-route-truck]") ?? null;
    const truckHome = truck?.getAttribute("transform") ?? null;
    const aller = leg("tow", "aller");
    const transport = leg("tow", "transport");
    const back = leg("back", "retour");
    const backSite = leg("back-site", "retour");
    const anchor = root.querySelector<HTMLElement>("[data-stage-step]");
    if (!aller || !transport || !back || !backSite || !anchor) return;
    const all = [aller, transport, back, backSite];

    const onSite = () => root.querySelector<HTMLInputElement>('input[value="on_site"]')?.checked === true;

    // Valeur tracée de chaque tronçon (0 → 1).
    const drawn = new Map<Leg, number>(all.map((item) => [item, 0]));
    const setLeg = (item: Leg, value: number) => {
      drawn.set(item, value);
      helpers.setDraw(item.el, value);
      // Un tracé à 0 garde le bout arrondi d'un tiret de longueur nulle : on le masque.
      item.el.style.visibility = value <= 0.0005 ? "hidden" : "";
    };
    const placeTruck = (on: Leg, progress: number, look: "aller" | "transport") => {
      if (!truck) return;
      // Transport entièrement retiré : la dépanneuse est revenue chez vous, à vide.
      if (look === "transport" && progress <= 0.001) {
        on = aller;
        progress = 1;
        look = "aller";
      }
      helpers.follow(truck, on.path, progress);
      towRoute?.setAttribute("data-route-current", look);
    };

    let stop: () => void = () => {};
    let entered = false;

    /** Enchaîne les tronçons vers leur cible, l'un après l'autre (retrait plus rapide). */
    const run = (queue: Step[]) => {
      stop();
      const next = () => {
        const step = queue.shift();
        if (!step) return;
        const from = drawn.get(step.item) ?? 0;
        const growing = step.to > from;
        stop = helpers.tween({
          duration: growing ? 900 : 420,
          onUpdate: (p) => {
            const value = from + (step.to - from) * p;
            setLeg(step.item, value);
            if (step.truck) placeTruck(step.item, value, step.truck);
          },
          onComplete: next,
        });
      };
      next();
    };

    const update = () => {
      const beat = entered ? Number(root.getAttribute("data-beat") ?? "1") || 1 : 0;
      root.setAttribute("data-story", String(beat));
      const site = onSite();
      // Les retraits d'abord (dans l'ordre inverse), puis les tracés (dans l'ordre du trajet).
      const plan: Step[] = [
        { item: aller, to: beat >= 3 ? 1 : 0, truck: "aller" },
        { item: transport, to: beat >= 4 && !site ? 1 : 0, truck: "transport" },
        { item: back, to: beat >= 4 && !site ? 1 : 0 },
        { item: backSite, to: beat >= 4 && site ? 1 : 0 },
      ];
      run([
        ...plan.filter((step) => step.to < (drawn.get(step.item) ?? 0)).reverse(),
        ...plan.filter((step) => step.to > (drawn.get(step.item) ?? 0)),
      ]);
    };

    // État de départ : rien n'est tracé, la dépanneuse attend au dépôt (masquée en CSS).
    for (const item of all) setLeg(item, 0);
    placeTruck(aller, 0, "aller");
    root.setAttribute("data-story", "0");

    // « Atteinte » : le haut de la première étape a passé 70 % de la hauteur de l'écran.
    let frame = 0;
    const measure = () => {
      frame = 0;
      const now = anchor.getBoundingClientRect().top <= window.innerHeight * 0.7;
      if (now === entered) return;
      entered = now;
      update();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    if (!entered) update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-beat"] });
    root.addEventListener("change", update);

    return () => {
      stop();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      observer.disconnect();
      root.removeEventListener("change", update);
      root.removeAttribute("data-story");
      for (const item of all) {
        item.el.style.removeProperty("--draw");
        item.el.style.removeProperty("visibility");
        const maskId = item.el.getAttribute("data-draw-mask");
        const mask = maskId ? document.getElementById(maskId) : null;
        if (mask instanceof SVGElement) mask.style.removeProperty("--draw");
      }
      towRoute?.removeAttribute("data-route-current");
      if (truck) {
        if (truckHome === null) truck.removeAttribute("transform");
        else truck.setAttribute("transform", truckHome);
      }
    };
  },
};

export default scene;
