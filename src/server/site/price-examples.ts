/**
 * Exemples de prix de l'accueil (journée, nuit, dimanche), calculés par le moteur côté serveur.
 * Version provisoire : remplie par le lot L1b de la refonte.
 */
export type PriceExample = { priceTtcCents: number; includedLabels: string[]; when: string; approachKm: number; loadedKm: number };
export type HomePriceExamples = { weekday: PriceExample; night: PriceExample | null; sunday: PriceExample | null };

export async function getHomePriceExamples(): Promise<HomePriceExamples | null> {
  return null;
}
