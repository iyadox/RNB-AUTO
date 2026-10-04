"use client";

/**
 * D.3 · La ligne de route, fil conducteur de la lecture (ordinateur, à partir de 1 024 px).
 *
 * Une ligne de route fixe à gauche du contenu : tirets craie, remplissage jaune qui suit la
 * lecture (`scroll(root)`, repli `--scroll-progress` écrit par le runtime) et une petite borne
 * losange jaune au bout. Un repère par section (`markers`) : de vrais liens d'ancre, qui marchent
 * sans JavaScript ; l'étiquette « PK 03 · Le prix » apparaît au survol et au focus ; le repère de la
 * section en cours porte `aria-current` (runtime, `data-follow-section`).
 *
 * Rendu par chaque page, EN DEHORS de `PageTransition` (jamais capturé par la transition).
 * Sous 1 024 px : rien (la ligne de progression est dans l'en-tête).
 *
 * Quand le pied de page « Retour au dépôt » arrive dans l'écran, la ligne s'efface
 * (`data-at-depot`) : elle ne passe jamais par-dessus la scène du retour. Le trajet est fini.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./blocks.module.css";

export type RoadMarker = { id: string; pk: string; label: string };

export function RoadLine({ markers = [] }: { markers?: readonly RoadMarker[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const setRoot = (element: HTMLElement | null) => {
    rootRef.current = element;
  };

  // Arrivée au dépôt : la ligne s'efface dès que le pied de page entre dans l'écran (8 % du bas).
  useEffect(() => {
    const root = rootRef.current;
    const footer = document.querySelector("footer[data-depot-footer]");
    if (!root || !footer) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) root.setAttribute("data-at-depot", "");
        else root.removeAttribute("data-at-depot");
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(footer);
    return () => {
      observer.disconnect();
      root.removeAttribute("data-at-depot");
    };
  }, []);

  // Chaque repère est placé là où le remplissage arrive quand sa section atteint le haut de
  // l'écran. Rendu serveur : repères répartis régulièrement (aucun saut s'il n'y a pas de JS).
  useEffect(() => {
    const list = listRef.current;
    if (!list || markers.length === 0) return;
    let frame = 0;
    const place = () => {
      frame = 0;
      const html = document.documentElement;
      const max = html.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      for (const item of Array.from(list.querySelectorAll<HTMLElement>("[data-marker]"))) {
        const target = document.getElementById(item.dataset.marker ?? "");
        if (!target) continue;
        const top = target.getBoundingClientRect().top + window.scrollY;
        item.style.setProperty("--pos", Math.min(1, Math.max(0, top / max)).toFixed(4));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [markers]);

  const track = (
    <div className={styles.roadTrack} aria-hidden="true">
      <span className={styles.roadFill}>
        <span className={styles.roadHead} />
      </span>
    </div>
  );

  if (markers.length === 0)
    return (
      <div ref={setRoot} className={styles.roadLine}>
        {track}
      </div>
    );

  return (
    <nav ref={setRoot} aria-label="Repères de la page" className={styles.roadLine}>
      {track}
      <ol ref={listRef} className={styles.roadMarkers}>
        {markers.map((marker, index) => (
          <li
            key={marker.id}
            data-marker={marker.id}
            className={styles.roadMarkerItem}
            style={{ "--pos": ((index + 0.5) / markers.length).toFixed(4) } as CSSProperties}
          >
            <a href={`#${marker.id}`} data-follow-section className={cn(styles.roadMarker)}>
              <span className={styles.roadMarkerDot} aria-hidden="true" />
              <span className={styles.roadMarkerLabel}>
                <span aria-hidden="true">PK {marker.pk} · </span>
                {marker.label}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
