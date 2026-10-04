import { describe, expect, it } from "vitest";
import { CITIES, MARNE, OURCQ, PARIS_CENTER, SEINE, findCity } from "./geo";
import { projectIdf } from "./projection";

const city = (name: string) => {
  const found = findCity(name);
  if (!found) throw new Error(`Ville absente : ${name}`);
  return found;
};
const region = (name: string) => {
  const c = city(name);
  return projectIdf(c.lat, c.lng, "region");
};

describe("projectIdf · region", () => {
  it("place Paris au centre", () => {
    const p = projectIdf(PARIS_CENTER.lat, PARIS_CENTER.lng, "region");
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });

  it("place chaque ville dans le bon quadrant par rapport à Paris (y vers le bas)", () => {
    // Nord : y < 0 ; est : x > 0.
    const expected: Record<string, { east: boolean | null; north: boolean | null }> = {
      Bobigny: { east: true, north: true },
      "Saint-Denis": { east: null, north: true },
      Montreuil: { east: true, north: null },
      Pantin: { east: true, north: true },
      Drancy: { east: true, north: true },
      Bondy: { east: true, north: true },
      "Aulnay-sous-Bois": { east: true, north: true },
      "Noisy-le-Grand": { east: true, north: false },
      Roissy: { east: true, north: true },
      Créteil: { east: true, north: false },
      Argenteuil: { east: false, north: true },
      Versailles: { east: false, north: false },
      Cergy: { east: false, north: true },
      Évry: { east: true, north: false },
      Meaux: { east: true, north: true },
    };
    for (const [name, quadrant] of Object.entries(expected)) {
      const p = region(name);
      if (quadrant.east !== null) expect(p.x > 0, `${name} est/ouest`).toBe(quadrant.east);
      if (quadrant.north !== null) expect(p.y < 0, `${name} nord/sud`).toBe(quadrant.north);
    }
    // Saint-Denis est franchement au nord ; Montreuil franchement à l'est.
    expect(Math.abs(region("Saint-Denis").y)).toBeGreaterThan(Math.abs(region("Saint-Denis").x));
    expect(Math.abs(region("Montreuil").x)).toBeGreaterThan(Math.abs(region("Montreuil").y));
  });

  it("place le dépôt de Bobigny au nord-est de Paris", () => {
    const p = region("Bobigny");
    expect(p.x).toBeGreaterThan(0);
    expect(p.y).toBeLessThan(0);
    const angle = (Math.atan2(-p.y, p.x) * 180) / Math.PI;
    expect(angle).toBeGreaterThan(20);
    expect(angle).toBeLessThan(70);
  });

  it("conserve l'angle et comprime la distance en racine carrée jusqu'à 60 km", () => {
    // 15 km plein est → √(15/60) = 0,5 ; 60 km et au-delà → bord du disque.
    const kmPerDegLng = 111.32 * Math.cos((PARIS_CENTER.lat * Math.PI) / 180);
    const at = (km: number) => projectIdf(PARIS_CENTER.lat, PARIS_CENTER.lng + km / kmPerDegLng, "region");
    expect(at(15).x).toBeCloseTo(0.5, 5);
    expect(at(15).y).toBeCloseTo(0, 5);
    expect(at(60).x).toBeCloseTo(1, 5);
    expect(at(140).x).toBeCloseTo(1, 5);
    // Monotone, et les communes proches sont écartées (lisibles).
    expect(at(5).x).toBeGreaterThan(5 / 60);
    expect(at(5).x).toBeLessThan(at(10).x);
  });

  it("garde toutes les villes, rivières et le canal dans le disque", () => {
    for (const point of [...CITIES, ...SEINE, ...MARNE, ...OURCQ]) {
      const p = projectIdf(point.lat, point.lng, "region");
      expect(Math.hypot(p.x, p.y)).toBeLessThanOrEqual(1 + 1e-9);
    }
  });
});

describe("projectIdf · depot", () => {
  const depot = { lat: 48.9077, lng: 2.4397 };

  it("est linéaire, rayon 1 à 12 km autour du dépôt", () => {
    expect(projectIdf(depot.lat, depot.lng, "depot", depot)).toEqual({ x: 0, y: 0 });
    const kmPerDegLat = 110.574;
    const north6 = projectIdf(depot.lat + 6 / kmPerDegLat, depot.lng, "depot", depot);
    expect(north6.x).toBeCloseTo(0, 6);
    expect(north6.y).toBeCloseTo(-0.5, 6);
    const north24 = projectIdf(depot.lat + 24 / kmPerDegLat, depot.lng, "depot", depot);
    expect(north24.y).toBeCloseTo(-2, 6);
  });

  it("met Paris au sud-ouest du dépôt et Bondy à l'est", () => {
    const paris = projectIdf(PARIS_CENTER.lat, PARIS_CENTER.lng, "depot", depot);
    expect(paris.x).toBeLessThan(0);
    expect(paris.y).toBeGreaterThan(0);
    const bondy = city("Bondy");
    expect(projectIdf(bondy.lat, bondy.lng, "depot", depot).x).toBeGreaterThan(0);
  });
});

describe("findCity", () => {
  it("ignore les accents et les majuscules", () => {
    expect(findCity("EVRY")?.name).toBe("Évry");
    expect(findCity(" bobigny ")?.name).toBe("Bobigny");
    expect(findCity("Lyon")).toBeNull();
    expect(findCity(null)).toBeNull();
  });
});
