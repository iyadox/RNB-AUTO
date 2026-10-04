import {
  baseStage,
  calendarStage,
  discountsStage,
  eligibilityStage,
  fuelIndexationStage,
  internalCostsStage,
  legsStage,
  minimumStage,
  profitabilityStage,
  roundingStage,
  supplementsStage,
  vatStage,
  type Stage,
} from "./stages";

/**
 * ORDRE DES ÉTAPES — déclaré uniquement ici.
 * Modifier l'ordre ou ajouter une étape se fait dans cette liste (et ses tests),
 * sans toucher aux autres étapes. Voir docs/03-moteur-tarifaire.md, §3.
 */
export const PRICE_PIPELINE: readonly Stage[] = [
  eligibilityStage, //     0. vérifications (véhicule accepté, zone)
  internalCostsStage, //   0. coût interne (ne dépend pas du prix)
  legsStage, //            1. trajets
  baseStage, //            2. prix de base
  fuelIndexationStage, //  3. carburant
  supplementsStage, //     4. suppléments
  calendarStage, //        5. majorations
  discountsStage, //       6. remises automatiques
  roundingStage, //        7. arrondi
  minimumStage, //         8. prix minimum
  profitabilityStage, //   9. rentabilité
  vatStage, //                TTC / HT
];
