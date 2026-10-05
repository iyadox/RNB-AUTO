/**
 * Noms composés insécables pour /zones-d-intervention (« Seine-Saint-Denis », « Seine-et-Marne »,
 * « Île-de-France ») : à 390 px, le navigateur coupait au trait d'union et laissait
 * « Seine-Saint- / Denis (93) ». Chaque mot qui contient un trait d'union entre deux lettres est
 * enveloppé dans un `span` insécable ; le texte copié et lu reste identique (pas de trait d'union
 * insécable U+2011, absent de certaines polices). Composant propre à la page (pas d'import depuis
 * l'accueil).
 */
import { Fragment, type ReactElement } from "react";

const HYPHENATED = /(\S*\p{L}-\p{L}\S*)/u;

export function NoBreakHyphens({ text }: { text: string }): ReactElement {
  const parts = text.split(HYPHENATED);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="whitespace-nowrap">
            {part}
          </span>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
