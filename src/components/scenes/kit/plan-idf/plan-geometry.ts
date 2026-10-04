/**
 * Repère du « Plan RNB » (docs/09, H.3), sans rendu : taille, rayon, position du dépôt et point
 * du plan pour une position. Pur (aucun accès au navigateur ni au serveur) : importable par les
 * composants serveur ET clients (`PlanIdf` est un composant client).
 */
import type { PublicSiteInfo } from "@/server/site/public-info";
import type { Point } from "../svg-path";
import { findCity, type GeoPoint } from "./geo";
import { projectIdf, type PlanVariant } from "./projection";

/** Côté du repère du plan (unités du `viewBox`). */
export const PLAN_SIZE = 600;
export const PLAN_CENTER = PLAN_SIZE / 2;
/** Rayon du disque régional ; le plan du dépôt va jusqu'au bord du carré (12 km). */
export const PLAN_RADIUS: Record<PlanVariant, number> = { region: 272, depot: 300 };

/** Position connue du dépôt : coordonnées du réglage, sinon la ville trouvée dans le plan. */
export function resolveDepotPosition(depot: PublicSiteInfo["depot"]): GeoPoint | null {
  if (depot.lat !== null && depot.lng !== null) return { lat: depot.lat, lng: depot.lng };
  const city = findCity(depot.city);
  return city ? { lat: city.lat, lng: city.lng } : null;
}

/** Point du plan (repère 600 × 600) pour une position, avec le même centrage que `PlanIdf`. */
export function planPoint(lat: number, lng: number, variant: PlanVariant, depot: PublicSiteInfo["depot"]): Point {
  const center = variant === "depot" ? (resolveDepotPosition(depot) ?? undefined) : undefined;
  const unit = projectIdf(lat, lng, variant, center);
  return { x: PLAN_CENTER + unit.x * PLAN_RADIUS[variant], y: PLAN_CENTER + unit.y * PLAN_RADIUS[variant] };
}

/**
 * Largeur estimée d'un nom de commune (unités du plan) pour une taille de police : sert à
 * retourner ou masquer les noms qui sortiraient du cadre. Estimation volontairement large
 * (Archivo, mesurée à 0,54-0,64 em par caractère en graisse 600 ; graisse 800 : + 6 %).
 */
export function estimateLabelWidth(text: string, fontSize: number, bold = false): number {
  let em = 0;
  for (const char of text) {
    if (char === " " || char === "'") em += 0.3;
    else if (char === "-") em += 0.4;
    else if ("iIljtf.,".includes(char)) em += 0.32;
    else if ("mwMW".includes(char)) em += 0.9;
    else if (char === char.toUpperCase() && char !== char.toLowerCase()) em += 0.72;
    else em += 0.62;
  }
  return em * fontSize * (bold ? 1.06 : 1) + 6;
}
