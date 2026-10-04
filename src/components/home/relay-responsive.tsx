"use client";
/**
 * Le relais d'autoroute de l'accueil (docs/09, E.6), une seule orientation dans le HTML.
 *
 * `HighwayRelay orientation="auto"` rend les deux schémas au serveur (le CSS choisit) : 12 Ko et
 * environ 140 nœuds de plus jusqu'à l'hydratation (budget G.2). Mobile d'abord : le serveur ne
 * rend que le schéma vertical (téléphone) ; à partir de 768 px, le schéma horizontal le remplace
 * après l'hydratation. La section est sous la ligne de flottaison : aucun décalage visible.
 * Le runtime du socle prend en charge le tracé ajouté. Sans JavaScript, sur un grand écran : le
 * schéma vertical, centré sur 32 rem, avec ses légendes.
 */
import { useSyncExternalStore } from "react";
import { HighwayRelay } from "@/components/scenes/kit/highway-relay";
import styles from "./home-lower.module.css";

const WIDE = "(min-width: 768px)";

const subscribe = (onChange: () => void) => {
  const list = window.matchMedia(WIDE);
  list.addEventListener("change", onChange);
  return () => list.removeEventListener("change", onChange);
};

export function RelayResponsive({ className }: { className?: string }) {
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
  return (
    <HighwayRelay
      draw="scrub"
      orientation={wide ? "horizontal" : "vertical"}
      className={wide ? className : `${className ?? ""} ${styles.relayNarrow}`}
    />
  );
}
