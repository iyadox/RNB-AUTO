/**
 * Route du suivi (/suivi) : la vraie position de l'intervention racontée par une scène.
 *
 * Une chaussée de nuit vue de profil, trois arrêts plantés sur l'accotement (le dépôt RNB AUTO,
 * « Vous », la destination ; deux en dépannage sur place) et la dépanneuse posée là où en est
 * l'intervention : au dépôt (reçue, confirmée), entre le dépôt et vous (en route), chez vous (sur
 * place), entre vous et la destination avec votre véhicule sur le plateau (transport), à
 * destination (terminée). Le trajet parcouru s'allume en jaune.
 *
 * Mouvement (seulement sous `html.motion-ready`, jamais en `off` ni avec « moins d'animations ») :
 * à l'ouverture, la dépanneuse roule du dépôt jusqu'à sa position ; quand le statut change pendant
 * que la page est ouverte, elle roule jusqu'à la nouvelle position ; en route, les roues tournent
 * et le marquage défile. Sans JavaScript ou sans animation : la scène est déjà dans son état final.
 * Décor pur (`aria-hidden`) : le titre, le texte et la liste des étapes disent tout.
 */
import type { CSSProperties } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { Skyline } from "@/components/scenes/base/skyline";
import { DepotGlyph, FlagGlyph, PinGlyph } from "@/components/scenes/kit/glyphs";
import { cn } from "@/components/ui/cn";
import type { TrackingView } from "@/server/tracking/view";
import styles from "./suivi.module.css";

const GLYPHS = {
  depot: { viewBox: "-32 -32 64 64", node: <DepotGlyph /> },
  pickup: { viewBox: "-18 -36 36 42", node: <PinGlyph hazards /> },
  dropoff: { viewBox: "-18 -36 42 42", node: <FlagGlyph /> },
} as const;

export function TrackingRoad({ view, className }: { view: TrackingView; className?: string }) {
  const n = Math.max(1, view.stops.length - 1);
  const at = view.truckAt ?? 0;
  const moving = view.phase === "en_route" || view.phase === "transport";
  return (
    <div
      className={cn(styles.scene, className)}
      data-phase={view.phase}
      data-moving={moving ? "" : undefined}
      style={{ "--at": at, "--n": n } as CSSProperties}
      aria-hidden="true"
    >
      <Skyline layer="far" className={styles.sceneCity} />
      <span className={styles.sceneGlow} />
      <span className={styles.band}>
        <span className={styles.dashes} />
      </span>
      <span className={styles.fill} />
      <ol className={styles.stops}>
        {view.stops.map((stop, k) => (
          <li key={stop.key} className={styles.stop} data-reached={view.truckAt !== null && at >= k ? "" : undefined} style={{ "--k": k } as CSSProperties}>
            <span className={styles.stopSign}>
              <svg viewBox={GLYPHS[stop.key].viewBox} className={styles.stopGlyph}>
                {GLYPHS[stop.key].node}
              </svg>
              <span className={styles.stopPost} />
            </span>
            <span className={cn(styles.stopLabel, "font-plate")}>{stop.label}</span>
          </li>
        ))}
      </ol>
      {view.truckAt !== null ? (
        <span className={styles.rail}>
          <span className={styles.mover}>
            <span className={styles.truck}>
              <TowTruck
                id="suivi-truck"
                headlights={view.phase !== "received" && view.phase !== "callback" && view.phase !== "completed"}
                beacon={moving || view.phase === "arrived"}
                moving={moving}
                loaded={view.truckLoaded}
              />
            </span>
          </span>
        </span>
      ) : null}
    </div>
  );
}
