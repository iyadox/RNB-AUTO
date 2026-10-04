/**
 * Lampadaires au sodium (docs/09, B.6) : cône et flaque de lumière statiques, reflet étiré sur
 * la chaussée mouillée. Ils se tiennent à `--lamp-ground` (22 % du bas du conteneur) ; la bande
 * du dessous reçoit leur reflet. `loop` : ils défilent (on roule) ; pause hors de l'écran.
 * Le conteneur donne la hauteur (classe `className`).
 */
import type { ReactElement } from "react";
import { cn } from "@/components/ui/cn";
import styles from "./base.module.css";

type StreetLampsProps = {
  count?: number;
  reflection?: boolean;
  loop?: boolean;
  className?: string;
};

function LampRow({ count, reflection }: { count: number; reflection: boolean }) {
  return (
    <div className={styles.lampRow}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={cn(styles.lamp, "lamp")} style={{ left: `${((i + 0.5) / count) * 100}%` }}>
          <span className={styles.cone} />
          <span className={styles.pool} />
          {reflection ? <span className={styles.reflection} /> : null}
          <span className={styles.post} />
          <span className={styles.arm} />
          <span className={styles.head} />
        </div>
      ))}
    </div>
  );
}

export function StreetLamps({ count = 4, reflection = true, loop = false, className }: StreetLampsProps): ReactElement {
  return (
    <div aria-hidden="true" data-pause-offscreen={loop ? "" : undefined} className={cn(styles.lamps, className)}>
      <div className={cn(styles.lampTrack, loop && styles.lampLoop)}>
        <LampRow count={count} reflection={reflection} />
        {loop ? <LampRow count={count} reflection={reflection} /> : null}
      </div>
    </div>
  );
}
