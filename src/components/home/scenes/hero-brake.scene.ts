/**
 * Scène « hero-brake » (docs/09, E.1) : le freinage de l'ouverture, lié au défilement.
 *
 * De 0 à 100 % de la sortie de l'ouverture (sans épinglage) :
 * 1. les boucles (villes, lampadaires, tirets, roues) ralentissent jusqu'à l'arrêt
 *    (`Animation.playbackRate`, courbe power2.out) ;
 * 2. la dépanneuse avance de `--brake-dx` (8 vw ou 18 vw) et s'arrête juste derrière la voiture
 *    en warnings ; les feux stop s'allument ; à 85 %, le nez plonge de 1,2° puis se replace ;
 * 3. le texte monte (yPercent −16) et pâlit jusqu'à 0,15 — jamais les boutons, qui restent
 *    pleinement visibles (C.1-2) ;
 * 4. à la fin, seuls les feux de détresse et le gyrophare restent animés.
 *
 * `full` : lié au défilement (lissé sur ordinateur, direct sur mobile), sans GSAP : la scène
 * reste légère et la page ne charge pas GSAP pour elle en niveau `lite`.
 * `lite` : seul le véhicule freine, une fois (1,4 s), au premier défilement ; le texte reste
 * entièrement lisible (il est encore à l'écran). `off` : la scène n'est pas lancée (CSS).
 * Nettoyage : tout revient à l'état de départ (vitesse 1, position d'origine).
 */
import type { SceneModule } from "@/components/motion/types";

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);
const power2Out = (t: number) => 1 - (1 - t) * (1 - t);
/** Équivalent de --ease-brake (cubic-bezier(.2,.8,.2,1)) : power3.out. */
const brakeEase = (t: number) => 1 - (1 - t) ** 3;
/** Plongée du nez (degrés) entre 85 % et 100 % : 0 → 1,2 → −0,35 → 0. */
function noseDip(p: number): number {
  if (p <= 0.85) return 0;
  const q = (p - 0.85) / 0.15;
  if (q < 0.38) return 1.2 * (q / 0.38);
  if (q < 0.72) return 1.2 + (-0.35 - 1.2) * ((q - 0.38) / 0.34);
  return -0.35 * (1 - (q - 0.72) / 0.28);
}

/** Les lumières qui ne ralentissent jamais : feux de détresse, gyrophare, point de disponibilité. */
const KEEP = /hazard|beacon|pulse/;

const scene: SceneModule = {
  init(root, ctx) {
    const hero = root.closest<HTMLElement>("section") ?? root;
    const rig = root.querySelector<HTMLElement>("[data-truck-rig]");
    const body = rig?.querySelector<SVGGElement>(".truck-body") ?? null;
    const fades = Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-fade]"));
    const copy = hero.querySelector<HTMLElement>("[data-hero-copy]");
    if (!rig) return;

    // Boucles à ralentir (animations CSS infinies de la scène, hors lumières codées).
    const loops = () =>
      root
        .getAnimations({ subtree: true })
        .filter((animation) => {
          const timing = animation.effect?.getComputedTiming();
          const name = "animationName" in animation ? String((animation as CSSAnimation).animationName) : "";
          return timing?.iterations === Infinity && !KEEP.test(name);
        });
    let animations = loops();

    if (body) {
      body.style.transformBox = "fill-box";
      body.style.transformOrigin = "80% 100%";
    }

    // `lite` : seul le véhicule freine (une fois) ; le texte n'est jamais estompé, car il est
    // encore à l'écran quand le freinage se joue.
    const withCopy = ctx.level === "full";
    let last = -1;
    const apply = (raw: number) => {
      const p = clamp01(raw);
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      const rate = 1 - power2Out(p);
      // Une boucle relancée par le navigateur (pause hors écran) garde sa vitesse ; une boucle
      // recréée (rare) est reprise au passage suivant.
      if (animations.some((animation) => animation.playState === "idle")) animations = loops();
      for (const animation of animations) animation.playbackRate = rate;

      if (p <= 0.0005) {
        rig.style.removeProperty("translate");
        rig.style.removeProperty("--brake");
        body?.style.removeProperty("rotate");
        for (const el of fades) el.style.removeProperty("opacity");
        copy?.style.removeProperty("translate");
        return;
      }
      const move = brakeEase(p);
      rig.style.translate = `calc(var(--brake-dx) * ${move.toFixed(4)}) ${(move * 0.6).toFixed(3)}%`;
      // Feux stop : montent pendant le freinage, restent allumés à l'arrêt.
      rig.style.setProperty("--brake", Math.min(0.9, p * 2.2).toFixed(3));
      if (body) body.style.rotate = `${noseDip(p).toFixed(3)}deg`;
      if (!withCopy) return;
      if (copy) copy.style.translate = `0 ${(-16 * p).toFixed(2)}%`;
      const opacity = (1 - 0.85 * p).toFixed(3);
      for (const el of fades) el.style.opacity = opacity;
    };

    const reset = () => {
      for (const animation of animations) animation.playbackRate = 1;
      rig.style.removeProperty("translate");
      rig.style.removeProperty("--brake");
      body?.style.removeProperty("rotate");
      body?.style.removeProperty("transform-box");
      body?.style.removeProperty("transform-origin");
      for (const el of fades) el.style.removeProperty("opacity");
      copy?.style.removeProperty("translate");
    };

    // `lite` : le freinage se joue une fois, au premier défilement.
    if (ctx.level === "lite") {
      let stop: () => void = () => {};
      const play = () => {
        window.removeEventListener("scroll", play);
        stop = ctx.helpers.tween({ duration: 1400, ease: (t) => t, onUpdate: apply });
      };
      if (window.scrollY > 4) play();
      else window.addEventListener("scroll", play, { passive: true });
      return () => {
        window.removeEventListener("scroll", play);
        stop();
        reset();
      };
    }

    // `full` : lié au défilement, de « haut de l'ouverture en haut de l'écran » à « bas de
    // l'ouverture en haut de l'écran ». Sur ordinateur, la progression est lissée (constante de
    // temps ≈ 0,2 s, l'équivalent d'un scrub de 0,6 s) ; sur mobile, elle suit le doigt.
    let target = 0;
    let current = 0;
    let frame = 0;
    let lastTime = 0;
    const measure = () => {
      const rect = hero.getBoundingClientRect();
      return rect.height > 0 ? clamp01(-rect.top / rect.height) : 0;
    };
    const tick = (time: number) => {
      frame = 0;
      if (!ctx.desktop) {
        current = target;
      } else {
        const dt = lastTime ? Math.min(64, time - lastTime) : 16;
        current += (target - current) * (1 - Math.exp(-dt / 200));
        if (Math.abs(target - current) < 0.0008) current = target;
      }
      lastTime = time;
      apply(current);
      if (current !== target) frame = requestAnimationFrame(tick);
      else lastTime = 0;
    };
    const onScroll = () => {
      target = measure();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    current = target = measure();
    apply(current);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      reset();
    };
  },
};

export default scene;
