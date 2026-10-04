/**
 * Projection du « Plan RNB » (docs/09, H.3). Pure : aucune dépendance au navigateur.
 *
 * Le résultat est en coordonnées UNITAIRES, axe y vers le bas (comme en SVG) :
 * - `region` : centre Paris (48.8530, 2.3499), le bord du disque (rayon 1) est à 60 km.
 *   Compression radiale en racine carrée (les communes proches restent lisibles), l'angle
 *   est conservé (une ville au nord-est reste au nord-est).
 * - `depot` : linéaire, rayon 1 = 12 km autour du centre (le dépôt). Au-delà, |x| ou |y| > 1.
 *
 * Le composant `PlanIdf` multiplie ces coordonnées par son rayon. Aucune distance n'est jamais
 * affichée : le plan est schématique.
 */
import { PARIS_CENTER, type GeoPoint } from "./geo";

export type PlanVariant = "region" | "depot";

/** Rayon du disque régional (km). */
export const REGION_RADIUS_KM = 60;
/** Rayon du plan du dépôt (km). */
export const DEPOT_RADIUS_KM = 12;

const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LNG_EQUATOR = 111.32;

/** Écart en kilomètres (est, nord) entre `center` et le point. */
export function offsetKm(lat: number, lng: number, center: GeoPoint): { east: number; north: number } {
  const cosLat = Math.cos((center.lat * Math.PI) / 180);
  return {
    east: (lng - center.lng) * KM_PER_DEG_LNG_EQUATOR * cosLat,
    north: (lat - center.lat) * KM_PER_DEG_LAT,
  };
}

export function projectIdf(
  lat: number,
  lng: number,
  variant: PlanVariant,
  center?: { lat: number; lng: number },
): { x: number; y: number } {
  const origin = center ?? PARIS_CENTER;
  const { east, north } = offsetKm(lat, lng, origin);
  if (variant === "depot") {
    return { x: east / DEPOT_RADIUS_KM + 0, y: -north / DEPOT_RADIUS_KM + 0 };
  }
  const distance = Math.hypot(east, north);
  if (distance === 0) return { x: 0, y: 0 };
  const radius = Math.sqrt(Math.min(distance, REGION_RADIUS_KM) / REGION_RADIUS_KM);
  // `+ 0` : jamais de « -0 » (sortie stable, utile aux tests et aux attributs SVG).
  return { x: (east / distance) * radius + 0, y: (-north / distance) * radius + 0 };
}
