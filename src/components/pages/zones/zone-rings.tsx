/**
 * Pictogramme des quatre secteurs (docs/09, F.3) : trois anneaux centrés sur Paris (Paris,
 * petite couronne, grande couronne) et le losange du dépôt au nord-est (Seine-Saint-Denis).
 * Le secteur `active` est allumé en jaune ; `null` : aucun. Décoratif (`aria-hidden`).
 * Sans hook : utilisable côté serveur comme dans la recherche de commune (client).
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import type { AreaZone } from "./areas";
import styles from "./zones.module.css";

const ring = (r: number) => `M${32 - r} 32a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

export function ZoneRings({ active, className }: { active: AreaZone | null; className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 64 64" className={cn(styles.rings, className)} aria-hidden="true">
      <path className={styles.ringsBase} d={`${ring(30)}${ring(20)}${ring(10)}`} />
      {active === "grande-couronne" ? <path className={styles.ringsOn} fillRule="evenodd" d={`${ring(30)}${ring(20)}`} /> : null}
      {active === "petite-couronne" ? <path className={styles.ringsOn} fillRule="evenodd" d={`${ring(20)}${ring(10)}`} /> : null}
      {active === "paris" ? <path className={styles.ringsOn} d={ring(10)} /> : null}
      {active === "93" ? <circle cx="41" cy="24" r="9" className={styles.ringsOn} /> : null}
      <rect
        x="37.5"
        y="20.5"
        width="7"
        height="7"
        rx="1"
        transform="rotate(45 41 24)"
        className={active === "93" ? styles.ringsDepotOn : styles.ringsDepot}
      />
    </svg>
  );
}
