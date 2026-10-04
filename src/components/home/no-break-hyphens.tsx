/**
 * Noms composés insécables (« Île-de-France », « Seine-Saint-Denis ») : le navigateur coupe
 * volontiers au trait d'union, ce qui laisse « Île-de- / France ». Chaque mot qui contient un trait
 * d'union entre deux lettres est enveloppé dans un `span` insécable ; le texte copié reste
 * identique (pas de trait d'union insécable U+2011, absent de certaines polices).
 */
import { Fragment } from "react";

const HYPHENATED = /(\S*\p{L}-\p{L}\S*)/u;

export function NoBreakHyphens({ text }: { text: string }) {
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
