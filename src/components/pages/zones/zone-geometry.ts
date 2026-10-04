/**
 * Géométrie des zones de /zones-d-intervention sur le « Plan RNB » régional (repère 600 × 600,
 * même projection que `PlanIdf`). Pur : aucune dépendance au navigateur, aucune distance.
 *
 * - `paris` : intérieur du périphérique ;
 * - `petite-couronne` : entre le périphérique et la limite de la petite couronne ;
 * - `grande-couronne` : entre la petite couronne et le bord du disque ;
 * - `93` : halo autour du dépôt (le plan ne trace pas les limites des départements).
 */
import { planPoint, PLAN_SIZE, resolveDepotPosition } from "@/components/scenes/kit/plan-idf/plan-idf";
import { CITIES, PERIPHERIQUE, PETITE_COURONNE, type Department } from "@/components/scenes/kit/plan-idf/geo";
import { pathEnd, smoothPath, type Point } from "@/components/scenes/kit/svg-path";
import type { PublicSiteInfo } from "@/server/site/public-info";
import type { AreaZone } from "./areas";

/** Rayon du disque régional dans le repère du plan (valeur de `PlanIdf`). */
export const REGION_R = 272;
const C = PLAN_SIZE / 2;

const r1 = (n: number) => Math.round(n * 10) / 10;
const circle = (r: number) => `M${C - r} ${C}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const DEPARTMENTS: Record<AreaZone, readonly Department[]> = {
  "93": ["93"],
  paris: ["75"],
  "petite-couronne": ["92", "94"],
  "grande-couronne": ["77", "78", "91", "95"],
};

/** Ville vers laquelle part le trajet « aller » dessiné quand la zone s'allume. */
const TARGET: Record<AreaZone, string> = {
  "93": "Noisy-le-Grand",
  paris: "Paris",
  "petite-couronne": "Créteil",
  "grande-couronne": "Versailles",
};

export type ZoneShape = {
  zone: AreaZone;
  /** Surface allumée (règle evenodd pour les anneaux), ou `null` pour le 93 (halo). */
  area: string | null;
  /** Communes du plan qui appartiennent à la zone. */
  cities: { name: string; p: Point }[];
  /** Trajet « aller » depuis le dépôt, et pose de la dépanneuse à l'arrivée. */
  route: { d: string; end: { x: number; y: number; angle: number } } | null;
  /** Cadrage de la vignette mobile (viewBox). */
  viewBox: string;
};

export type ZoneGeometry = { depot: Point | null; shapes: ZoneShape[] };

export function zoneGeometry(depot: PublicSiteInfo["depot"]): ZoneGeometry {
  const project = (lat: number, lng: number) => planPoint(lat, lng, "region", depot);
  const periph = smoothPath(
    PERIPHERIQUE.map((p) => project(p.lat, p.lng)),
    true,
    0.42,
  );
  const petite = smoothPath(
    PETITE_COURONNE.map((p) => project(p.lat, p.lng)),
    true,
  );
  const depotGeo = resolveDepotPosition(depot);
  const depotPoint = depotGeo ? project(depotGeo.lat, depotGeo.lng) : null;

  const area: Record<AreaZone, string | null> = {
    "93": null,
    paris: periph,
    "petite-couronne": `${petite}${periph}`,
    "grande-couronne": `${circle(REGION_R)}${petite}`,
  };

  const viewBox: Record<AreaZone, string> = {
    "93": depotPoint ? `${r1(depotPoint.x - 110)} ${r1(depotPoint.y - 110)} 220 220` : "150 150 300 300",
    paris: "190 190 220 220",
    "petite-couronne": "110 110 380 380",
    "grande-couronne": "14 14 572 572",
  };

  const shapes = (Object.keys(DEPARTMENTS) as AreaZone[]).map((zone): ZoneShape => {
    const cities = CITIES.filter((city) => DEPARTMENTS[zone].includes(city.department) && city.name !== depotCityName(depot))
      .map((city) => ({ name: city.name, p: project(city.lat, city.lng) }))
      .filter(({ p }) => !depotPoint || Math.hypot(p.x - depotPoint.x, p.y - depotPoint.y) > 15);
    const target = CITIES.find((city) => city.name === TARGET[zone]);
    let route: ZoneShape["route"] = null;
    if (depotPoint && target) {
      const to = project(target.lat, target.lng);
      // Courbe douce : un point de passage décalé sur la perpendiculaire (aucune vraie route).
      const mx = (depotPoint.x + to.x) / 2;
      const my = (depotPoint.y + to.y) / 2;
      const dx = to.x - depotPoint.x;
      const dy = to.y - depotPoint.y;
      const len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(40, len * 0.18);
      const via = { x: mx - (dy / len) * bend, y: my + (dx / len) * bend };
      // La dépanneuse s'arrête juste avant la commune (son point reste visible).
      const ux = to.x - via.x;
      const uy = to.y - via.y;
      const ul = Math.hypot(ux, uy) || 1;
      const stop = { x: to.x - (ux / ul) * 20, y: to.y - (uy / ul) * 20 };
      const d = smoothPath([depotPoint, via, stop]);
      route = { d, end: pathEnd(d) };
    }
    return { zone, area: area[zone], cities, route, viewBox: viewBox[zone] };
  });

  return { depot: depotPoint, shapes };
}

function depotCityName(depot: PublicSiteInfo["depot"]): string | null {
  return depot.city ? (CITIES.find((city) => city.name.toLowerCase() === depot.city!.toLowerCase())?.name ?? null) : null;
}
