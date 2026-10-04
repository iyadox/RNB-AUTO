"use client";
/**
 * Décors de l'accueil montés à l'approche (budget du HTML et des nœuds, docs/09 G.2).
 *
 * Le cadre est rendu tout de suite (au serveur aussi) et garde sa place : sa taille vient du CSS
 * de la page (`aspect-ratio`), rien ne bouge quand le dessin arrive. Le dessin, décoratif
 * (`aria-hidden`) et souvent lourd en SVG, n'est monté qu'à 1,5 écran de distance : il n'est
 * plus dans le HTML de la page. Le runtime du socle prend en compte le contenu ajouté
 * (apparitions, pause hors de l'écran).
 * Sans JavaScript : le cadre reste vide ; la page qui l'emploie décide quoi montrer à la place.
 * Jamais pour un contenu lisible (texte, légende) : il doit rester dans le HTML.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

/** `true` dès que l'élément passe à moins de 1,5 écran de la zone visible (une seule fois). */
export function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        setNear(true);
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return [ref, near] as const;
}

export function LazyScene({ className, children }: { className?: string; children: ReactNode }) {
  const [ref, near] = useNearViewport<HTMLDivElement>();
  return (
    <div ref={ref} className={className}>
      {near ? children : null}
    </div>
  );
}
