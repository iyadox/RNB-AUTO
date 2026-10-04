"use client";
/**
 * Lampadaires au sodium (docs/09, B.6) : cône et flaque de lumière statiques, reflet étiré sur
 * la chaussée mouillée. Ils se tiennent à `--lamp-ground` (22 % du bas du conteneur) ; la bande
 * du dessous reçoit leur reflet. `loop` : ils défilent (on roule) ; pause hors de l'écran.
 * Le conteneur donne la hauteur (classe `className`).
 *
 * `ignite` : les lampes sont éteintes puis s'allument une à une (deux scintillements de sodium,
 * 120 ms d'écart) quand la rangée entre dans l'écran (`data-inview-once`). Sans JavaScript et
 * en `off` : allumées. Les parties lumineuses portent `data-lamp="cone|pool|reflection|head"`
 * pour les pages qui pilotent elles-mêmes l'allumage (plutôt que l'ordre des éléments).
 *
 * Composant client (sans état) : ses lampes ne sont pas répétées dans la charge RSC de la page (G.2).
 */
import type { CSSProperties, ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./base.module.css";

type StreetLampsProps = {
  count?: number;
  reflection?: boolean;
  loop?: boolean;
  /** Allumage à l'entrée dans l'écran (éteintes avant). */
  ignite?: boolean;
  className?: string;
};

function LampRow({ count, reflection }: { count: number; reflection: boolean }) {
  return (
    <div className={styles.lampRow}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={cn(styles.lamp, "lamp")}
          style={{ left: `${((i + 0.5) / count) * 100}%`, "--lamp-i": i } as CSSProperties}
        >
          <span className={styles.cone} data-lamp="cone" />
          <span className={styles.pool} data-lamp="pool" />
          {reflection ? <span className={styles.reflection} data-lamp="reflection" /> : null}
          <span className={styles.post} />
          <span className={styles.arm} />
          <span className={styles.head} data-lamp="head" />
        </div>
      ))}
    </div>
  );
}

export function StreetLamps({ count = 4, reflection = true, loop = false, ignite = false, className }: StreetLampsProps): ReactElement {
  return (
    <div
      aria-hidden="true"
      data-pause-offscreen={loop ? "" : undefined}
      data-inview-once={ignite ? "" : undefined}
      className={cn(styles.lamps, ignite && styles.ignite, className)}
    >
      <div className={cn(styles.lampTrack, loop && styles.lampLoop)}>
        <LampRow count={count} reflection={reflection} />
        {loop ? <LampRow count={count} reflection={reflection} /> : null}
      </div>
    </div>
  );
}
