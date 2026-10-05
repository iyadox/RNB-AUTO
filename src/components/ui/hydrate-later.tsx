/**
 * Hydratation sélective (temps de blocage, docs/09 G.2).
 *
 * En production : une frontière `<Suspense>` sans repli autour d'un bloc rendu au serveur. Le HTML
 * ne change pas (deux commentaires `<!--$-->` / `<!--/$-->` encadrent le bloc, qui reste affiché
 * et lisible sans JavaScript) ; seul le moment où React l'hydrate change : au lieu de tout hydrater
 * en une seule longue tâche avec la page, React hydrate d'abord le reste (en-tête, ouverture),
 * valide, puis hydrate chaque frontière en priorité basse, par tranches de quelques millisecondes
 * qui rendent la main au navigateur. Un clic dans un bloc pas encore hydraté l'hydrate tout de
 * suite et React rejoue le clic.
 *
 * En développement : le bloc tel quel (aucune frontière). Le runtime du motion pose des classes
 * (`scene-paused`…) dès le premier affichage ; dans un bloc pas encore hydraté, React en
 * développement les compare aux propriétés et le signale en console (« attributes … didn't
 * match »), alors qu'en production il ne compare que les textes et laisse les attributs tels quels.
 *
 * Règles d'emploi :
 * - jamais autour d'un contenu qui suspend (aucune donnée attendue dans le bloc) ;
 * - jamais autour d'un titre `[data-split]` : le runtime le découpe (nouveaux nœuds) et React
 *   doit l'avoir hydraté avant (le titre reste dans le passage principal) ;
 * - le runtime du motion trouve les éléments comme avant : ils sont dans le DOM dès le HTML.
 */
import { Suspense, type ReactNode } from "react";

const SELECTIVE = process.env.NODE_ENV === "production";

export function HydrateLater({ children }: { children: ReactNode }): ReactNode {
  return SELECTIVE ? <Suspense>{children}</Suspense> : children;
}
