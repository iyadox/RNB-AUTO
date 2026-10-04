/**
 * Outils purs de l'accueil (sans rendu, utilisables côté serveur et côté client).
 * - `depotInSeineSaintDenis` : la phrase « Au cœur de la Seine-Saint-Denis… » de la zone (E.7)
 *   n'est vraie que si le dépôt y est.
 * - `planToGeo` : position géographique d'un point du plan du dépôt (inverse de `planPoint`,
 *   variante `depot`), pour passer l'épingle « Vous » du récit par la prop `points` de `PlanIdf`.
 */
import { findCity, PARIS_CENTER } from "@/components/scenes/kit/plan-idf/geo";
import { PLAN_CENTER, PLAN_RADIUS, resolveDepotPosition } from "@/components/scenes/kit/plan-idf/plan-geometry";
import { DEPOT_RADIUS_KM } from "@/components/scenes/kit/plan-idf/projection";
import type { PublicSiteInfo } from "@/server/site/public-info";

/** Code postal 93xxx dans l'adresse du dépôt, ou ville du dépôt connue du plan dans le 93. */
export function depotInSeineSaintDenis(depot: Pick<PublicSiteInfo["depot"], "label" | "city">): boolean {
  if (/(?:^|\D)93\d{3}(?:\D|$)/.test(depot.label ?? "")) return true;
  return findCity(depot.city)?.department === "93";
}

/** Point du plan du dépôt (repère 600 × 600) → latitude et longitude (projection linéaire). */
export function planToGeo(point: { x: number; y: number }, depot: PublicSiteInfo["depot"]): { lat: number; lng: number } {
  const center = resolveDepotPosition(depot) ?? PARIS_CENTER;
  const radius = PLAN_RADIUS.depot;
  const east = ((point.x - PLAN_CENTER) / radius) * DEPOT_RADIUS_KM;
  const north = (-(point.y - PLAN_CENTER) / radius) * DEPOT_RADIUS_KM;
  return {
    lat: center.lat + north / 110.574,
    lng: center.lng + east / (111.32 * Math.cos((center.lat * Math.PI) / 180)),
  };
}
