/**
 * Chargement différé de GSAP, ScrollTrigger et SplitText (48,6 Ko compressés, docs/09 G.2).
 * Importés une seule fois, enregistrés une seule fois, jamais au chargement initial.
 * Aucun autre module GSAP n'est autorisé.
 *
 * Deux portes d'entrée :
 * - `loadSplitKit` : GSAP et SplitText seulement, pour la montée des lignes (P5). Sans
 *   ScrollTrigger, aucune boucle `requestAnimationFrame` permanente (ScrollTrigger en garde une
 *   dès qu'il est enregistré, même au repos) et 17,5 Ko de moins à évaluer sur téléphone ;
 * - `loadGsapKit` : le kit complet, pour les scènes collantes, les tracés liés au défilement et
 *   les scènes qui déclarent `needsGsap`.
 */
import type { GsapKit } from "../types";

export type SplitKit = Pick<GsapKit, "gsap" | "SplitText">;

let pendingSplit: Promise<SplitKit> | null = null;
let pending: Promise<GsapKit> | null = null;

export function loadSplitKit(): Promise<SplitKit> {
  if (!pendingSplit) {
    pendingSplit = Promise.all([import("gsap"), import("gsap/SplitText")])
      .then(([core, split]) => {
        const kit: SplitKit = { gsap: core.gsap, SplitText: split.SplitText };
        kit.gsap.registerPlugin(kit.SplitText);
        return kit;
      })
      .catch((error: unknown) => {
        // Requête bloquée ou réseau coupé : on pourra réessayer à la page suivante.
        pendingSplit = null;
        throw error;
      });
  }
  return pendingSplit;
}

export function loadGsapKit(): Promise<GsapKit> {
  if (!pending) {
    pending = Promise.all([loadSplitKit(), import("gsap/ScrollTrigger")])
      .then(([base, scroll]) => {
        const kit: GsapKit = { ...base, ScrollTrigger: scroll.ScrollTrigger };
        kit.gsap.registerPlugin(kit.ScrollTrigger);
        kit.ScrollTrigger.config({ ignoreMobileResize: true });
        return kit;
      })
      .catch((error: unknown) => {
        pending = null;
        throw error;
      });
  }
  return pending;
}
