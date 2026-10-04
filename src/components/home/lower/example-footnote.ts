/**
 * Pied du ticket d'exemple de l'accueil (texte de docs/09, E.5). Module partagé (ni serveur ni
 * client) : utilisé par le sélecteur « Quand ? » (client) et par la section prix (serveur).
 * L'information « exemple » y est écrite en clair (le tampon n'est qu'un décor).
 */
import type { PriceExample } from "@/server/site/price-examples";

const km = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export function exampleFootnote(example: Pick<PriceExample, "approachKm" | "loadedKm" | "when">, vehicle: string): string {
  return `Confirmé par téléphone avant le départ. Exemple calculé avec nos tarifs actuels : ${vehicle} à ${km.format(
    example.approachKm,
  )} km du dépôt, remorquée sur ${km.format(example.loadedKm)} km, ${example.when}. Votre prix exact en moins d'une minute.`;
}
