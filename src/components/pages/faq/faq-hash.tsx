"use client";

/**
 * Ouverture par l'adresse (docs/09, F.5) : `/questions-frequentes#prix-definitif` ouvre la
 * question désignée et la fait briller une fois, au chargement et quand l'ancre change.
 * Sur mobile, la barre des thèmes garde sa voie active dans l'écran (défilement horizontal).
 * Sans JavaScript, l'adresse amène à la question (ancre native) ; un geste suffit pour l'ouvrir.
 */
import { useEffect } from "react";

const FLASH_MS = 1700;

export function FaqHash({ barId }: { barId: string }): null {
  useEffect(() => {
    let flashTimer = 0;
    let scrollFrame = 0;
    const openFromHash = () => {
      let id = window.location.hash.slice(1);
      try {
        id = decodeURIComponent(id);
      } catch {
        // Ancre mal encodée (« #% ») : on la prend telle quelle plutôt que de casser la page.
      }
      if (!id) return;
      const target = document.getElementById(id);
      if (!(target instanceof HTMLDetailsElement) || !target.hasAttribute("data-faq-question")) return;
      target.open = true;
      target.removeAttribute("data-flash");
      // Relance l'animation même si la même question est désignée deux fois.
      void target.offsetWidth;
      target.setAttribute("data-flash", "");
      window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => target.removeAttribute("data-flash"), FLASH_MS);
      // L'ouverture peut agrandir la page : la question reste en haut, sous les bandes collantes.
      cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);

    // Voie active de la barre des thèmes : toujours visible sur un petit écran.
    const bar = document.getElementById(barId);
    const lanes = bar?.querySelector<HTMLElement>("[data-lanes]");
    const observer = new MutationObserver(() => {
      const active = lanes?.querySelector<HTMLElement>("[aria-current]");
      if (!lanes || !active || lanes.scrollWidth <= lanes.clientWidth) return;
      const left = active.offsetLeft - (lanes.clientWidth - active.offsetWidth) / 2;
      const still = document.documentElement.getAttribute("data-motion") === "off";
      lanes.scrollTo({ left: Math.max(0, left), behavior: still ? "instant" : "smooth" });
    });
    if (lanes) observer.observe(lanes, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });

    return () => {
      window.removeEventListener("hashchange", openFromHash);
      window.clearTimeout(flashTimer);
      cancelAnimationFrame(scrollFrame);
      observer.disconnect();
    };
  }, [barId]);
  return null;
}
