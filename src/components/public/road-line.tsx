"use client";

/**
 * D.3 · La ligne de route, fil conducteur de la lecture (ordinateur, à partir de 1 360 px).
 *
 * Une ligne de route fixe à gauche du contenu : tirets craie, remplissage jaune qui suit la
 * lecture (`scroll(root)`, repli `--scroll-progress` écrit par le runtime) et une petite borne
 * losange jaune au bout. Un repère par section (`markers`) : de vrais liens d'ancre, qui marchent
 * sans JavaScript ; l'étiquette « PK 03 · Le prix » apparaît au survol et au focus ; le repère de la
 * section en cours porte `aria-current` (runtime, `data-follow-section`).
 *
 * Rendu par chaque page, EN DEHORS de `PageTransition` (jamais capturé par la transition).
 * Sous 1 360 px : rien (la ligne de progression est dans l'en-tête). Entre 1 024 et 1 359 px, la
 * marge du contenu (32 à 72 px) ne laissait pas de place à la ligne : ses repères débordaient de
 * l'écran (losanges rognés) et touchaient presque les titres.
 *
 * Quand le pied de page « Retour au dépôt » arrive dans l'écran, la ligne s'efface
 * (`data-at-depot`) : elle ne passe jamais par-dessus la scène du retour. Le trajet est fini.
 */
import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./blocks.module.css";

export type RoadMarker = { id: string; pk: string; label: string };

/** La ligne n'est affichée qu'à partir de 1 360 px (même seuil que `.roadLine`, blocks.module.css). */
const RAIL_MEDIA = "(min-width: 1360px)";
/** Écart minimal entre deux repères (cible de 30 px et un peu d'air). */
const MIN_GAP_PX = 36;

/**
 * Positions des repères (fractions de la ligne, 0 à 1), sans chevauchement : sur une page courte,
 * plusieurs sections commencent au-delà du défilement maximal et leurs repères tombaient tous à 1
 * (l'un recouvrait l'autre, impossible à toucher). Chaque repère garde au moins `gap` avec le
 * précédent ; ceux qui dépassent le bout de la ligne remontent en gardant cet écart. `null` : section
 * absente, repère laissé à sa place.
 */
export function spreadMarkers(raw: readonly (number | null)[], gap: number): (number | null)[] {
  const values = raw.flatMap((value) => (value === null ? [] : [Math.min(1, Math.max(0, value))]));
  // Vers le bas : chaque repère au moins `gap` sous le précédent.
  for (let k = 1; k < values.length; k += 1) values[k] = Math.max(values[k] ?? 0, (values[k - 1] ?? 0) + gap);
  // Vers le haut : rien au-delà du bout de la ligne, en gardant l'écart.
  for (let k = values.length - 1; k >= 0; k -= 1) {
    const limit = k === values.length - 1 ? 1 : (values[k + 1] ?? 1) - gap;
    values[k] = Math.max(0, Math.min(values[k] ?? 0, limit));
  }
  let next = 0;
  return raw.map((value) => (value === null ? null : (values[next++] ?? null)));
}

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
  //
  // Coût : rien tant que la ligne est cachée (sous 1 360 px, `RAIL_MEDIA`). Sinon, une seule
  // passe par image, regroupée : toutes les lectures (positions des sections, hauteur du rail),
  // puis toutes les écritures. Une lecture après chaque écriture forçait un recalcul de style et
  // de mise en page par repère, à chaque changement de hauteur de la page (constaté : 286 ms sur
  // téléphone ×4, où la ligne n'est même pas affichée). Les changements de taille sont regroupés
  // (150 ms) ; recalcul aussi après le chargement des polices.
  useEffect(() => {
    const list = listRef.current;
    if (!list || markers.length === 0) return;
    const media = window.matchMedia(RAIL_MEDIA);
    let frame = 0;
    let timer = 0;
    const place = () => {
      frame = 0;
      if (!media.matches) return;
      const items = Array.from(list.querySelectorAll<HTMLElement>("[data-marker]"));
      // Lectures.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const railHeight = list.getBoundingClientRect().height;
      if (max <= 0 || railHeight <= 0) return;
      const raw = items.map((item) => {
        const target = document.getElementById(item.dataset.marker ?? "");
        return target ? (target.getBoundingClientRect().top + window.scrollY) / max : null;
      });
      // Écritures.
      const positions = spreadMarkers(raw, MIN_GAP_PX / railHeight);
      items.forEach((item, index) => {
        const pos = positions[index];
        if (pos !== null && pos !== undefined) item.style.setProperty("--pos", pos.toFixed(4));
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    const debounce = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(schedule, 150);
    };
    schedule();
    void document.fonts?.ready.then(schedule);
    const observer = new ResizeObserver(debounce);
    observer.observe(document.body);
    media.addEventListener("change", schedule);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", schedule);
      window.clearTimeout(timer);
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
