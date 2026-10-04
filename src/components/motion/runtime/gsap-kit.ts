/**
 * Chargement différé de GSAP, ScrollTrigger et SplitText (48,6 Ko compressés, docs/09 G.2).
 * Importés une seule fois, enregistrés une seule fois, jamais au chargement initial.
 * Aucun autre module GSAP n'est autorisé.
 */
import type { GsapKit } from "../types";

let pending: Promise<GsapKit> | null = null;

export function loadGsapKit(): Promise<GsapKit> {
  if (!pending) {
    pending = Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("gsap/SplitText")])
      .then(([core, scroll, split]) => {
        const kit: GsapKit = { gsap: core.gsap, ScrollTrigger: scroll.ScrollTrigger, SplitText: split.SplitText };
        kit.gsap.registerPlugin(kit.ScrollTrigger, kit.SplitText);
        kit.ScrollTrigger.config({ ignoreMobileResize: true });
        return kit;
      })
      .catch((error: unknown) => {
        // Requête bloquée ou réseau coupé : on pourra réessayer à la page suivante.
        pending = null;
        throw error;
      });
  }
  return pending;
}
