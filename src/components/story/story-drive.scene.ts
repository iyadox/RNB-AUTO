/**
 * Pilote du décor « de la commande à l'arrivée » (module de scène, P22).
 *
 * La chorégraphie est entièrement en CSS (story.module.css) : trois actes liés à leur fenêtre et
 * l'aube liée à la piste. Ce module ne fait que fournir la progression quand il le faut :
 * - ordinateur, niveau `full` : GSAP ScrollTrigger lit la piste avec un léger retard (`scrub`),
 *   l'inertie d'une caméra, sans épinglage (le cadre reste collant en CSS) ;
 * - ailleurs, sans frises CSS (`animation-timeline`, `timeline-scope`) : défilement passif et
 *   une lecture par image ;
 * - ailleurs, avec les frises CSS : rien, le navigateur fait tout (aucun JavaScript au
 *   défilement sur téléphone).
 * Il pose `data-drive="js"` sur le cadre (animations en pause, sur l'horloge du document) et règle
 * leur `currentTime`. Les boucles (gyrophare, feux de détresse) ne sont pas touchées.
 * Nettoyage : tout est rendu au CSS.
 */
import type { SceneModule } from "@/components/motion/types";
import { actProgress, collectStoryAnimations, storyTime, type Span, type StoryGeometry } from "./story-progress";

const cssTimelines = () => CSS.supports("animation-timeline: view()") && CSS.supports("timeline-scope: --a");

function measure(track: HTMLElement): StoryGeometry {
  const scroll = window.scrollY;
  const span = (el: Element): Span => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top + scroll, height: rect.height };
  };
  const windows = Array.from(track.querySelectorAll("[data-story-window]"))
    .sort((a, b) => Number(a.getAttribute("data-story-window")) - Number(b.getAttribute("data-story-window")))
    .map(span);
  return { viewport: window.innerHeight, track: span(track), windows };
}

const scene: SceneModule = {
  needsGsap: ({ level, desktop }) => level === "full" && desktop,
  init(root, ctx) {
    if (ctx.level !== "full") return;
    const track = root.closest<HTMLElement>("[data-story-track]");
    if (!track) return;
    if (!ctx.kit && cssTimelines()) return;

    root.setAttribute("data-drive", "js");
    // Les dessins sont montés après coup (premier défilement) : liste relue à chaque changement.
    let animations: ReturnType<typeof collectStoryAnimations> | null = null;
    const watch = new MutationObserver(() => {
      animations = null;
    });
    watch.observe(root, { childList: true, subtree: true });
    let geometry = measure(track);
    let lastScroll = Number.NaN;
    const apply = (scroll: number) => {
      if (!animations || animations.length === 0) {
        animations = collectStoryAnimations(root);
        lastScroll = Number.NaN;
      }
      if (scroll === lastScroll) return;
      lastScroll = scroll;
      const times = [0, 1, 2, 3].map((act) => storyTime(actProgress(scroll, geometry, act)));
      for (const { animation, act } of animations) animation.currentTime = times[act] ?? -1;
    };
    const remeasure = () => {
      geometry = measure(track);
      lastScroll = Number.NaN;
    };
    const release = () => {
      watch.disconnect();
      root.removeAttribute("data-drive");
    };

    if (ctx.kit) {
      const { gsap, ScrollTrigger } = ctx.kit;
      // Position de défilement lissée : une seule valeur suit la page, chaque acte en déduit sa
      // progression (mêmes frises que le CSS).
      const state = { scroll: window.scrollY };
      const tween = gsap.fromTo(state, { scroll: 0 }, {
        scroll: () => ScrollTrigger.maxScroll(window),
        immediateRender: false,
        ease: "none",
        onUpdate: () => apply(Math.round(state.scroll)),
        scrollTrigger: {
          trigger: document.documentElement,
          start: 0,
          end: () => ScrollTrigger.maxScroll(window),
          scrub: 0.8,
          invalidateOnRefresh: true,
          onRefresh: remeasure,
        },
      });
      apply(Math.round(window.scrollY));
      // Hauteurs qui changent sans redimensionner la fenêtre (polices, sections hydratées après
      // coup) : ScrollTrigger ne le voit pas seul ; sans cela, les actes se décalent du texte.
      let refreshTimer = 0;
      let firstCall = true;
      const layoutWatch = new ResizeObserver(() => {
        if (firstCall) {
          firstCall = false;
          return;
        }
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
      });
      layoutWatch.observe(document.body);
      return () => {
        layoutWatch.disconnect();
        window.clearTimeout(refreshTimer);
        tween.scrollTrigger?.kill();
        tween.kill();
        release();
      };
    }

    // Repli léger : une lecture par image, seulement quand la page défile.
    let frame = 0;
    const read = () => {
      frame = 0;
      apply(Math.round(window.scrollY));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    const onResize = () => {
      remeasure();
      schedule();
    };
    const resizeWatch = new ResizeObserver(onResize);
    // Le corps entier : un changement de hauteur au-dessus de la piste la déplace aussi.
    resizeWatch.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      resizeWatch.disconnect();
      if (frame) cancelAnimationFrame(frame);
      release();
    };
  },
};

export default scene;
