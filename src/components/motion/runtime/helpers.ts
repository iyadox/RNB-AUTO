/**
 * Aides du runtime, chargées en différé (jamais sur le chemin critique) :
 * - `createSceneHelpers` : outils sans GSAP offerts aux scènes (tracé, suivi de chemin, interpolation) ;
 * - `initSplit` (P5), `initStages` (P9), `initRoutes` (P10) : aides globales de la page ;
 * - `initScenes` (P22) : associe les `[data-scene]` aux modules enregistrés par `useScenes`.
 * Chaque fonction retourne son nettoyage ; chaque élément est traité dans un try/catch et garde
 * son état final (`data-scene-failed`) en cas d'erreur.
 */
import type { GsapKit, MotionLevel, SceneContext, SceneHelpers } from "../types";
import type { SplitKit } from "./gsap-kit";
import { onDomChange } from "./observers";
import { getLoader, subscribe } from "./scene-registry";

type ActiveLevel = Exclude<MotionLevel, "off">;
type Cleanup = () => void;

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);
/** Équivalent de `expo.out` (C.2). */
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Rend la main au navigateur entre deux morceaux de travail (TBT, G.2) : aucune tâche du
 * démarrage ne doit dépasser 50 ms. `scheduler.yield()` quand il existe (la suite reste
 * prioritaire), sinon une tâche à part.
 */
export function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (typeof scheduler?.yield === "function") return scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const safely = (fn: Cleanup) => {
  try {
    fn();
  } catch {
    // Un nettoyage en échec ne doit jamais empêcher les suivants.
  }
};

const fail = (el: Element) => el.setAttribute("data-scene-failed", "");

// ─── Outils des scènes ────────────────────────────────────────────────────────

export function createSceneHelpers(): SceneHelpers {
  return {
    setDraw(el, progress) {
      const value = clamp01(progress).toFixed(4);
      el.style.setProperty("--draw", value);
      const maskId = el.getAttribute("data-draw-mask");
      const mask = maskId ? document.getElementById(maskId) : null;
      if (mask instanceof SVGElement) mask.style.setProperty("--draw", value);
    },
    follow(el, path, progress, opts) {
      const length = path.getTotalLength();
      if (!length) return;
      const at = clamp01(progress) * length;
      const point = path.getPointAtLength(at);
      let transform = `translate(${point.x.toFixed(2)} ${point.y.toFixed(2)})`;
      if (opts?.rotate !== false) {
        const a = path.getPointAtLength(Math.max(0, at - 0.75));
        const b = path.getPointAtLength(Math.min(length, at + 0.75));
        const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
        transform += ` rotate(${angle.toFixed(2)})`;
      }
      el.setAttribute("transform", transform);
    },
    tween({ duration, ease = easeOutExpo, onUpdate, onComplete }) {
      let frame = 0;
      let start = -1;
      const step = (now: number) => {
        if (start < 0) start = now;
        const t = duration > 0 ? Math.min(1, (now - start) / duration) : 1;
        onUpdate(ease(t));
        if (t < 1) frame = requestAnimationFrame(step);
        else {
          frame = 0;
          onComplete?.();
        }
      };
      frame = requestAnimationFrame(step);
      return () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      };
    },
  };
}

// ─── P5 · Montée des lignes (niveau `full` uniquement) ───────────────────────

/**
 * Texte d'un titre avant découpage. SplitText regroupe par défaut TOUS les blancs (`\s`, donc
 * aussi l'espace insécable posée par la coque avant « ? ! : ; ») en espaces ordinaires, puis coupe
 * les mots aux espaces : le « ? » partait seul sur une ligne (constaté à 390 px). Ici, seuls les
 * blancs ordinaires sont regroupés, et une ponctuation haute (ou un guillemet) reste collée à son
 * mot même si le titre a été écrit avec une espace simple.
 */
export function prepareSplitText(text: string): string {
  return text
    .replace(/[ \t\n\r\f\v]+/g, " ")
    .replace(/ ([?!:;»])/g, "\u00a0$1")
    .replace(/« /g, "«\u00a0");
}

/** Ligne de départ de la montée : le haut du titre passe à 86 % de la hauteur de l'écran (P5). */
const SPLIT_PLAY_MARGIN = "0px 0px -14% 0px";
/** Découpage préparé quand le titre approche (moins de 60 % d'écran sous le bas de l'écran). */
const SPLIT_PREPARE_MARGIN = "0px 0px 60% 0px";

/**
 * Découpe les titres `[data-split]` en lignes masquées qui montent une fois (top 86 %).
 * Un titre déjà dans l'écran (ou au-dessus) n'est jamais découpé : il ne doit pas clignoter.
 *
 * Travail réparti pour ne bloquer ni le premier affichage ni le défilement (TBT, G.2) :
 * - positions lues en un seul passage, avant tout découpage (aucune alternance lecture/écriture) ;
 * - GSAP et SplitText ne sont chargés qu'à l'approche du premier titre (`loadSplitKit`, sans
 *   ScrollTrigger : la montée part d'un IntersectionObserver à la même ligne de 86 %) ;
 * - un titre par tâche, en rendant la main entre deux.
 * Kit indisponible (réseau, blocage) : les titres restent tels quels, visibles.
 */
export function initSplit(root: ParentNode, loadKit: () => Promise<SplitKit>): Cleanup {
  const splits: { revert(): void }[] = [];
  const plays: IntersectionObserver[] = [];
  const queue: HTMLElement[] = [];
  let disposed = false;
  let draining = false;
  let ctx: ReturnType<SplitKit["gsap"]["context"]> | null = null;

  const split = (kit: SplitKit, title: HTMLElement) => {
    // Le visiteur a pu défiler vite : un titre déjà dans l'écran reste tel quel.
    if (title.getBoundingClientRect().top < window.innerHeight) return;
    const { gsap, SplitText } = kit;
    ctx ??= gsap.context(() => {});
    let played = false;
    let tween: { play(): unknown; progress(value: number): unknown } | null = null;
    try {
      ctx.add(() => {
        const instance = SplitText.create(title, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          aria: "auto",
          reduceWhiteSpace: false,
          prepareText: prepareSplitText,
          // Redécoupage (largeur, police) : la montée est recréée, à l'arrivée si elle a déjà joué.
          onSplit: (self: { lines: Element[] }) => {
            const animation = gsap.from(self.lines, {
              yPercent: 110,
              rotate: 2,
              duration: 0.8,
              ease: "expo.out",
              stagger: 0.07,
              paused: true,
            });
            if (played) animation.progress(1);
            tween = animation;
            return animation;
          },
        });
        splits.push(instance);
      });
    } catch {
      fail(title);
      return;
    }
    // Montée quand le haut du titre franchit 86 % de l'écran ; un saut au-delà (ancre, retour
    // en haut de page…) la joue aussi, pour qu'un titre ne reste jamais caché.
    const play = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || (!entry.isIntersecting && entry.boundingClientRect.top > 0)) return;
        play.disconnect();
        played = true;
        tween?.play();
      },
      { rootMargin: SPLIT_PLAY_MARGIN },
    );
    play.observe(title);
    plays.push(play);
  };

  const drain = async () => {
    if (draining) return;
    draining = true;
    try {
      const kit = await loadKit();
      while (!disposed && queue.length > 0) {
        const title = queue.shift();
        if (title?.isConnected) split(kit, title);
        await yieldToMain();
      }
    } catch {
      // GSAP indisponible : les titres gardent leur état final.
      queue.length = 0;
    } finally {
      draining = false;
    }
  };

  const approach = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        approach.unobserve(entry.target);
        queue.push(entry.target as HTMLElement);
      }
      if (queue.length > 0) void drain();
    },
    { rootMargin: SPLIT_PREPARE_MARGIN },
  );

  const scan = () => {
    if (disposed) return;
    const titles = Array.from(root.querySelectorAll<HTMLElement>("[data-split]")).filter(
      (title) => !title.hasAttribute("data-split-done") && !title.hasAttribute("data-beam"),
    );
    // Toutes les lectures d'abord, puis les écritures.
    const limit = window.innerHeight;
    const tops = titles.map((title) => title.getBoundingClientRect().top);
    titles.forEach((title, index) => {
      title.setAttribute("data-split-done", "");
      if ((tops[index] ?? 0) >= limit) approach.observe(title);
    });
  };

  // Lignes justes du premier coup : rien n'est préparé avant le chargement des polices.
  void document.fonts.ready.then(scan, scan);
  const stopDom = onDomChange(scan);
  return () => {
    disposed = true;
    stopDom();
    approach.disconnect();
    for (const play of plays) play.disconnect();
    for (const instance of splits) safely(() => instance.revert());
    if (ctx) safely(() => ctx?.revert());
    for (const title of Array.from(root.querySelectorAll("[data-split-done]"))) title.removeAttribute("data-split-done");
  };
}

// ─── P9 · Scènes collantes (ordinateur seulement) ────────────────────────────

/**
 * Pose `data-active` sur l'étape qui traverse le centre de l'écran, `data-beat="n"` (à partir
 * de 1) et `--stage-progress` (0 → 1) sur la scène. Sur mobile, rien (aucun élément collant).
 */
export function initStages(root: ParentNode, kit: GsapKit, desktop: boolean): Cleanup {
  if (!desktop) return () => {};
  const { gsap, ScrollTrigger } = kit;
  const stages = Array.from(root.querySelectorAll<HTMLElement>("[data-stage]"));
  const ctx = gsap.context(() => {
    for (const stage of stages) {
      try {
        const steps = Array.from(stage.querySelectorAll<HTMLElement>("[data-stage-step]"));
        const activate = (index: number) => {
          steps.forEach((step, i) => {
            if (i === index) step.setAttribute("data-active", "");
            else step.removeAttribute("data-active");
          });
          stage.setAttribute("data-beat", String(index + 1));
        };
        if (steps.length > 0) activate(0);
        steps.forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (self.isActive) activate(index);
            },
          });
        });
        ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => stage.style.setProperty("--stage-progress", self.progress.toFixed(4)),
        });
      } catch {
        fail(stage);
      }
    }
  });
  return () => {
    safely(() => ctx.revert());
    for (const stage of stages) {
      stage.removeAttribute("data-beat");
      stage.style.removeProperty("--stage-progress");
      for (const step of Array.from(stage.querySelectorAll("[data-active]"))) step.removeAttribute("data-active");
    }
  };
}

// ─── P10 · Trajets qui se dessinent ──────────────────────────────────────────

type RouteContext = { level: ActiveLevel; desktop: boolean; helpers: SceneHelpers };

/**
 * Anime les tracés `[data-route]` selon `data-route-mode` :
 * - `scrub` : progression liée au défilement (ordinateur + GSAP), sinon comme `view` ;
 *   bornes facultatives `data-route-start` / `data-route-end` (syntaxe ScrollTrigger) ;
 * - `view` : chaque tronçon se dessine en 900 ms, une fois, à l'entrée dans l'écran ;
 * - `loop` : le trajet recommence (pause hors écran) ; une seule fois en `lite` ;
 * - `static` : rien ne bouge.
 * Tronçons : `[data-route-leg]` (classe `draw`, pathLength="1"), dans l'ordre du document.
 * Véhicule : `[data-route-truck]`, placé sur le tronçon en cours ; la racine reçoit
 * `data-route-current="<valeur de data-route-leg>"`. Nettoyage : tout revient à l'état final.
 */
export function initRoutes(root: ParentNode, kit: GsapKit | null, ctx: RouteContext): Cleanup {
  const cleanups: Cleanup[] = [];
  const handled = new WeakSet<Element>();
  let initial = true;

  const setup = (route: HTMLElement, animateIfVisible: boolean) => {
    const legs = Array.from(route.querySelectorAll<SVGGeometryElement | SVGGElement>("[data-route-leg]"));
    if (legs.length === 0) return;
    const truck = route.querySelector<SVGGraphicsElement>("[data-route-truck]");
    const truckTransform = truck?.getAttribute("transform") ?? null;
    const geometry = (leg: Element) =>
      leg instanceof SVGGeometryElement ? leg : leg.querySelector<SVGGeometryElement>("path, line, polyline");

    const apply = (progress: number) => {
      const scaled = clamp01(progress) * legs.length;
      legs.forEach((leg, index) => ctx.helpers.setDraw(leg, scaled - index));
      const index = Math.min(legs.length - 1, Math.floor(scaled));
      const current = legs[index];
      if (!current) return;
      route.setAttribute("data-route-current", current.getAttribute("data-route-leg") ?? String(index));
      const path = geometry(current);
      if (truck && path) ctx.helpers.follow(truck, path, scaled - index);
    };
    const restore = () => {
      for (const leg of legs) {
        leg.style.removeProperty("--draw");
        const maskId = leg.getAttribute("data-draw-mask");
        const mask = maskId ? document.getElementById(maskId) : null;
        if (mask instanceof SVGElement) mask.style.removeProperty("--draw");
      }
      route.removeAttribute("data-route-current");
      if (truck) {
        if (truckTransform === null) truck.removeAttribute("transform");
        else truck.setAttribute("transform", truckTransform);
      }
    };
    cleanups.push(restore);

    const mode = route.getAttribute("data-route-mode") ?? "static";
    const rect = route.getBoundingClientRect();
    const visible = rect.top < window.innerHeight && rect.bottom > 0;

    if (mode === "scrub" && kit && ctx.desktop && ctx.level === "full") {
      const trigger = kit.ScrollTrigger.create({
        trigger: route.closest("[data-stage]") ?? route,
        start: route.getAttribute("data-route-start") ?? "top 75%",
        end: route.getAttribute("data-route-end") ?? "bottom 35%",
        onUpdate: (self) => apply(self.progress),
      });
      apply(trigger.progress);
      cleanups.push(() => trigger.kill());
      return;
    }

    if (mode === "view" || mode === "scrub") {
      // Déjà dans l'écran au chargement : il reste tracé (aucun clignotement).
      if (visible && !animateIfVisible) {
        route.setAttribute("data-route-current", legs[legs.length - 1]?.getAttribute("data-route-leg") ?? "");
        return;
      }
      apply(0);
      let stop: Cleanup = () => {};
      const play = () => {
        let leg = 0;
        const next = () => {
          if (leg >= legs.length) return;
          const from = leg;
          stop = ctx.helpers.tween({
            duration: 900,
            onUpdate: (p) => apply((from + p) / legs.length),
            onComplete: () => {
              leg++;
              next();
            },
          });
        };
        next();
      };
      // Déclenché quand le haut du trajet passe aux deux tiers de l'écran. (Un seuil en
      // proportion ne serait jamais atteint par un tracé plus haut que l'écran : il resterait effacé.)
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          io.disconnect();
          play();
        },
        { rootMargin: "0px 0px -30% 0px" },
      );
      io.observe(route);
      cleanups.push(() => {
        io.disconnect();
        stop();
      });
      return;
    }

    if (mode === "loop") {
      let stop: Cleanup = () => {};
      let running = false;
      let played = false;
      let onScreen = true;
      const cycle = () => {
        // `lite` : une seule fois, même si le trajet revient dans l'écran.
        if (played && ctx.level !== "full") return;
        played = true;
        running = true;
        stop = ctx.helpers.tween({
          duration: 900 * legs.length,
          ease: (t) => t,
          onUpdate: apply,
          onComplete: () => {
            running = false;
            if (ctx.level !== "full") return;
            const wait = window.setTimeout(() => {
              if (onScreen) cycle();
            }, 700);
            stop = () => window.clearTimeout(wait);
          },
        });
      };
      const io = new IntersectionObserver((entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        if (onScreen && !running) {
          stop();
          cycle();
        }
      });
      io.observe(route);
      cleanups.push(() => {
        io.disconnect();
        stop();
      });
    }
  };

  const scan = () => {
    for (const route of Array.from(root.querySelectorAll<HTMLElement>("[data-route]"))) {
      if (handled.has(route)) continue;
      handled.add(route);
      try {
        setup(route, !initial);
      } catch {
        fail(route);
      }
    }
    initial = false;
  };
  scan();
  cleanups.push(onDomChange(scan));
  return () => {
    for (const cleanup of cleanups.reverse()) safely(cleanup);
  };
}

// ─── P22 · Scènes de lot ─────────────────────────────────────────────────────

type ScenesContext = {
  level: ActiveLevel;
  desktop: boolean;
  helpers: SceneHelpers;
  /** Chargeur de GSAP fourni par le runtime (ce module ne référence jamais GSAP lui-même). */
  loadKit: () => Promise<GsapKit>;
};

/**
 * Initialise chaque `[data-scene="nom"]` quand elle approche de l'écran (rootMargin 100 %),
 * avec le module enregistré sous ce nom. Les modules `needsGsap` reçoivent le kit ; leurs
 * animations GSAP sont créées dans un contexte annulé au nettoyage.
 */
export function initScenes(root: ParentNode, ctx: ScenesContext): Cleanup {
  const cleanups: Cleanup[] = [];
  const handled = new WeakSet<Element>();
  let disposed = false;

  const start = async (el: HTMLElement) => {
    const name = el.getAttribute("data-scene") ?? "";
    const loader = getLoader(name);
    if (!loader) return;
    try {
      const { default: scene } = await loader();
      const wantsGsap =
        typeof scene.needsGsap === "function" ? scene.needsGsap({ level: ctx.level, desktop: ctx.desktop }) : scene.needsGsap === true;
      const kit = wantsGsap ? await ctx.loadKit() : null;
      // Une scène par tâche : plusieurs scènes qui approchent ensemble ne font pas une longue tâche.
      await yieldToMain();
      if (disposed || !el.isConnected) return;
      const sceneContext: SceneContext = { level: ctx.level, desktop: ctx.desktop, kit, helpers: ctx.helpers };
      let cleanup: void | Cleanup;
      if (kit) {
        // Contexte créé AVANT d'appeler la scène : si `init` échoue en cours de route, les
        // animations déjà créées (un `gsap.from` cache souvent son élément) sont annulées et
        // tout revient à l'état final.
        const gsapContext = kit.gsap.context(() => {}, el);
        try {
          gsapContext.add(() => {
            cleanup = scene.init(el, sceneContext);
          });
        } catch (error) {
          safely(() => gsapContext.revert());
          throw error;
        }
        cleanups.push(() => {
          if (typeof cleanup === "function") safely(cleanup);
          safely(() => gsapContext.revert());
        });
      } else {
        cleanup = scene.init(el, sceneContext);
        if (typeof cleanup === "function") cleanups.push(cleanup);
      }
      el.setAttribute("data-scene-ready", "");
    } catch (error) {
      fail(el);
      if (process.env.NODE_ENV !== "production") console.warn(`[motion] scène « ${name} » en échec :`, error);
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        void start(entry.target as HTMLElement);
      }
    },
    { rootMargin: "100% 0px 100% 0px" },
  );

  const scan = () => {
    for (const el of Array.from(root.querySelectorAll<HTMLElement>("[data-scene]"))) {
      if (handled.has(el) || !getLoader(el.getAttribute("data-scene") ?? "")) continue;
      handled.add(el);
      io.observe(el);
    }
  };
  scan();
  const unsubscribe = subscribe(scan);
  const stopDom = onDomChange(scan);
  return () => {
    disposed = true;
    unsubscribe();
    stopDom();
    io.disconnect();
    for (const cleanup of cleanups.reverse()) safely(cleanup);
    for (const el of Array.from(root.querySelectorAll("[data-scene-ready]"))) el.removeAttribute("data-scene-ready");
  };
}
