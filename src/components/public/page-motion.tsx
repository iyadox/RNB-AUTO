"use client";

/**
 * Apparitions douces au défilement sur toutes les pages publiques (sans bibliothèque),
 * et mise en pause des scènes animées lorsqu'elles sortent de l'écran.
 * Sans JavaScript, tout reste visible.
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const reveal = (el: Element) => {
      (el as HTMLElement).dataset.revealed = "";
    };
    const pending = Array.from(document.querySelectorAll("[data-reveal]:not([data-revealed])"));
    const limit = window.innerHeight * 0.92;
    for (const el of pending) {
      if (el.getBoundingClientRect().top < limit) reveal(el);
    }
    document.documentElement.classList.add("motion-ready");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    for (const el of pending) {
      if (!(el as HTMLElement).hasAttribute("data-revealed")) revealObserver.observe(el);
    }

    const pauseObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.classList.toggle("scene-paused", !entry.isIntersecting);
    });
    document.querySelectorAll("[data-pause-offscreen]").forEach((el) => pauseObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      pauseObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
