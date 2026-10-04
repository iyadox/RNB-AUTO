/**
 * Route des étapes de la demande (docs/09, F.8) : elle remplace les six segments de progression.
 *
 * Six bornes kilométriques (Lieu · Destination · Véhicule · Problème · Prix · Coordonnées) sur
 * une chaussée vue de profil. Le trajet parcouru est jaune jusqu'à la borne courante ; une
 * mini-dépanneuse, phares allumés, avance d'une borne à l'autre (transform, 400 ms). Une fois le
 * véhicule choisi, sa silhouette se pose sur le plateau.
 *
 * « Étape x sur 6 » et « Retour » restent du vrai texte ; la route elle-même est décorative
 * (`aria-hidden`) : le titre de l'étape dit déjà où l'on est. La route est la cible du morph
 * `vt-sign-demande` (le panneau « Demande » de l'accueil s'y pose) ; le bouton « Retour » reste
 * hors de l'élément nommé, il reçoit donc toujours les clics pendant une transition.
 */
import type { CSSProperties } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { VehicleIcon } from "@/components/brand/vehicle-icon";
import { SharedMorph } from "@/components/motion/page-transition";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import styles from "./request.module.css";

/** Noms des six bornes (docs/09, F.8). */
export const STEP_LABELS = ["Lieu", "Destination", "Véhicule", "Problème", "Prix", "Coordonnées"] as const;

type StepRoadProps = {
  /** Index de la borne courante (0 à 5). */
  index: number;
  /** Code du véhicule choisi : sa silhouette est posée sur le plateau. */
  vehicle: string | null;
  /** Retour à l'étape précédente ; `null` à la première étape. */
  onBack: (() => void) | null;
  className?: string;
};

export function StepRoad({ index, vehicle, onBack, className }: StepRoadProps) {
  const total = STEP_LABELS.length;
  const current = Math.max(0, Math.min(total - 1, index));
  return (
    <div className={cn(styles.stepRoad, className)}>
      <div className={styles.stepRoadTop}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 flex h-12 items-center gap-1.5 rounded-2xl pl-2 pr-4 font-bold text-asphalt-200 transition-colors hover:text-chalk"
          >
            <Icon name="arrowLeft" size={20} />
            Retour
          </button>
        ) : (
          <span className="font-plate text-plate whitespace-nowrap tracking-[0.12em] text-signal-500 sm:tracking-[0.2em]">Demande de dépannage</span>
        )}
        <span className="font-figure whitespace-nowrap text-[1.0625rem] text-asphalt-200 [word-spacing:0.08em]">
          Étape {current + 1} sur {total}
        </span>
      </div>

      <SharedMorph name="vt-sign-demande">
        <div className={styles.road} style={{ "--i": current, "--n": total - 1 } as CSSProperties} aria-hidden="true">
          <span className={styles.roadBand} />
          <span className={styles.roadFillStub} />
          <span className={styles.roadFill} />
          <ol className={styles.posts}>
            {STEP_LABELS.map((label, k) => (
              <li
                key={label}
                className={styles.post}
                data-state={k < current ? "passed" : k === current ? "current" : "next"}
                style={{ "--k": k } as CSSProperties}
              >
                <span className={styles.postHead} />
                <span className={cn(styles.postNum, "font-figure")}>{k + 1}</span>
                <span className={cn(styles.postLabel, "text-[0.9375rem] font-bold leading-none")}>{label}</span>
              </li>
            ))}
          </ol>
          <span className={styles.truckRail}>
            <span className={styles.truckMover}>
              <span className={styles.truck}>
                <TowTruck id="step-road-truck" headlights beacon={false} />
                {vehicle ? (
                  <span key={vehicle} className={styles.truckCargo}>
                    <VehicleIcon code={vehicle} />
                  </span>
                ) : null}
              </span>
            </span>
          </span>
        </div>
      </SharedMorph>
    </div>
  );
}
