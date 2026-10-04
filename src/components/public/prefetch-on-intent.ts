/**
 * Préchargement « à l'intention » pour les liens `prefetch={false}` (logo, plan du site) : Next
 * préchargeait chaque route liée dès que le lien entrait dans l'écran, et avec elle son
 * JavaScript et ses feuilles de style (l'accueil et ses scènes depuis toutes les pages, tout le
 * plan du site à l'arrivée du pied de page). Ici, la route est préchargée seulement au survol
 * (souris) ou au focus (clavier) : la navigation reste rapide, sans rien charger pour rien.
 */
import type { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;

export function prefetchOnIntent(router: Router, href: string) {
  const prefetch = () => router.prefetch(href);
  return { onPointerEnter: prefetch, onFocus: prefetch };
}
