"use client";

/**
 * Animations de la page d'accueil pilotées par le défilement (GSAP + ScrollTrigger),
 * défilement fluide sur ordinateur (Lenis). Tout est désactivé si le visiteur préfère
 * moins d'animations. Le contenu reste lisible si ce script ne se charge pas.
 */
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { useEffect } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin, SplitText);

function setupStory() {
  const section = document.querySelector<HTMLElement>("[data-story]");
  const path = document.querySelector<SVGPathElement>("[data-story-path]");
  const leg1 = document.querySelector<SVGPathElement>("[data-story-leg1]");
  const truck = document.querySelector<SVGGElement>("[data-story-truck]");
  if (!section || !path || !leg1 || !truck) return;

  const total = path.getTotalLength();
  const split = Math.min(0.95, Math.max(0.05, leg1.getTotalLength() / total));
  const motion = (start: number, end: number) => ({
    path,
    align: path,
    alignOrigin: [0.5, 0.5] as [number, number],
    start,
    end,
  });

  gsap.set(path, { strokeDasharray: total, strokeDashoffset: total });
  gsap.set(truck, { motionPath: motion(0, 0) });

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: section, start: "top 35%", end: "bottom 75%", scrub: 0.8 },
  });
  timeline
    .from("[data-story-pin]", { scale: 0, opacity: 0, transformOrigin: "50% 50%", duration: 0.5, ease: "back.out(2)" })
    .from("[data-story-price]", { scale: 0.5, opacity: 0, transformOrigin: "0% 50%", duration: 0.5, ease: "back.out(2)" }, "+=0.5")
    .to(path, { strokeDashoffset: total * (1 - split), duration: 1.2 }, "+=0.4")
    .to(truck, { motionPath: motion(0, split), duration: 1.2 }, "<")
    .to(path, { strokeDashoffset: 0, duration: 1.2 }, "+=0.4")
    .to(truck, { motionPath: motion(split, 1), duration: 1.2 }, "<")
    .from("[data-story-flag]", { scale: 0.3, opacity: 0, transformOrigin: "50% 100%", duration: 0.4, ease: "back.out(2)" }, "-=0.3");

  gsap.utils.toArray<HTMLElement>("[data-story-step]").forEach((step) => {
    step.dataset.active = "false";
    ScrollTrigger.create({
      trigger: step,
      start: "top 62%",
      end: "bottom 38%",
      onToggle: (self) => {
        step.dataset.active = String(self.isActive);
      },
    });
  });
}

export function HomeMotion() {
  // Défilement fluide, uniquement à la souris (les téléphones gardent leur défilement natif).
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Accueil : le texte remonte, la dépanneuse accélère et sort de l'écran.
      const hero = document.querySelector("[data-hero]");
      if (hero) {
        gsap.to("[data-hero-content]", {
          yPercent: -16,
          opacity: 0.15,
          ease: "none",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to("[data-hero-truck]", {
          x: () => window.innerWidth * 0.75,
          ease: "power1.in",
          scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
        });
      }

      // Titres : chaque ligne monte depuis un masque.
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((title) => {
        SplitText.create(title, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 115,
              rotate: 2.5,
              duration: 1.15,
              ease: "expo.out",
              stagger: 0.09,
              scrollTrigger: { trigger: title, start: "top 86%", once: true },
            }),
        });
      });

      // Bandeau : s'incline selon la vitesse de défilement.
      const marquee = gsap.utils.toArray<HTMLElement>("[data-marquee-skew]");
      if (marquee.length > 0) {
        const skewTo = gsap.quickTo(marquee, "skewX", { duration: 0.5, ease: "power3" });
        ScrollTrigger.create({
          onUpdate: (self) => skewTo(gsap.utils.clamp(-12, 12, self.getVelocity() / -220)),
        });
      }

      setupStory();

      // Téléphone : léger flottement au défilement.
      const phone = document.querySelector("[data-phone]");
      if (phone) {
        gsap.fromTo(
          phone,
          { y: 70, rotate: -5 },
          { y: -50, rotate: 3, ease: "none", scrollTrigger: { trigger: phone, start: "top bottom", end: "bottom top", scrub: true } },
        );
      }

      // Compteur du prix d'exemple.
      gsap.utils.toArray<HTMLElement>("[data-count-to]").forEach((el) => {
        const target = Number(el.dataset.countTo);
        if (!Number.isFinite(target)) return;
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.8,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(counter.value));
          },
        });
      });

      // Radar : les villes apparaissent une à une.
      const radar = document.querySelector("[data-radar]");
      if (radar) {
        gsap.from("[data-radar-city]", {
          opacity: 0,
          scale: 0.2,
          transformOrigin: "50% 50%",
          duration: 0.6,
          ease: "back.out(2)",
          stagger: 0.05,
          scrollTrigger: { trigger: radar, start: "top 75%", once: true },
        });
      }

      // Appel final : le panneau jaune s'ouvre, la dépanneuse chargée arrive.
      const panel = document.querySelector("[data-final-panel]");
      if (panel) {
        gsap.fromTo(
          panel,
          { clipPath: "inset(14% 9% 14% 9% round 2.5rem)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 2.5rem)",
            ease: "none",
            scrollTrigger: { trigger: panel, start: "top 95%", end: "top 35%", scrub: true },
          },
        );
        gsap.from("[data-final-truck]", {
          xPercent: -120,
          opacity: 0,
          duration: 1.6,
          ease: "expo.out",
          scrollTrigger: { trigger: panel, start: "top 60%", once: true },
        });
      }
    });

    // Cartes de services : légère inclinaison sous la souris (ordinateur uniquement).
    mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-tilt]");
      const cleanups = cards.map((card) => {
        const rotateX = gsap.quickTo(card, "rotateX", { duration: 0.5, ease: "power3" });
        const rotateY = gsap.quickTo(card, "rotateY", { duration: 0.5, ease: "power3" });
        gsap.set(card, { transformPerspective: 900 });
        const move = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          rotateY(((event.clientX - rect.left) / rect.width - 0.5) * 8);
          rotateX(((event.clientY - rect.top) / rect.height - 0.5) * -8);
        };
        const leave = () => {
          rotateX(0);
          rotateY(0);
        };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        return () => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
        };
      });
      return () => cleanups.forEach((cleanup) => cleanup());
    });

    return () => mm.revert();
  });

  return null;
}
