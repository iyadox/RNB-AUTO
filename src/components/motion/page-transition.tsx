/**
 * Transitions de page « allumage des phares » (docs/09, D.4), avec React `ViewTransition`.
 *
 * - `PageTransition` enveloppe le contenu de CHAQUE `page.tsx` (jamais un layout : un layout
 *   persiste, ses animations d'entrée et de sortie ne se déclenchent pas). Le `div` unique
 *   garantit une seule capture. Ne jamais y mettre l'en-tête, la barre d'action ni `RoadLine`.
 * - `SharedMorph` relie un panneau du carrefour à la plaque d'ouverture de la page d'arrivée.
 *   Un seul élément par nom et par page. Jamais sur un bouton, Appeler ou WhatsApp.
 * Styles : src/styles/view-transitions.css.
 */
import { ViewTransition, type ReactElement, type ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }): ReactElement {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div className="page">{children}</div>
    </ViewTransition>
  );
}

export type MorphName = `vt-sign-${string}`;

export function SharedMorph({ name, children }: { name: MorphName; children: ReactElement }): ReactElement {
  return (
    <ViewTransition name={name} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
