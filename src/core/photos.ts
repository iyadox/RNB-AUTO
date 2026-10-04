/** Limites des photos d'une demande (techniques, pas commerciales), partagées navigateur / serveur. */
export const PHOTO_LIMITS = {
  perIntervention: 8,
  maxBytes: 4 * 1024 * 1024,
  maxPixels: 40_000_000,
  /** Durée pendant laquelle le client peut ajouter des photos après sa demande. */
  tokenHours: 12,
  /** Photos supprimées ce nombre de mois après la clôture de l'intervention. */
  retentionMonths: 12,
};
