import { describe, expect, it } from "vitest";
import { parseOrsRoute, parseOsrmRoute, parsePhotonFeatures } from "./providers/fallbacks";
import { parseIgnFeatures, parseIgnRoute } from "./providers/ign";
import { SimulationGeocodingProvider, SimulationRoutingProvider, haversineKm } from "./providers/simulation";
import { ProviderError } from "./types";

describe("adaptateur IGN", () => {
  it("lit les adresses (GeoJSON de la Base Adresse Nationale)", () => {
    const results = parseIgnFeatures({
      features: [
        {
          geometry: { coordinates: [2.4397, 48.9077] },
          properties: { label: "145 Rue de Paris 93000 Bobigny", score: 0.97, postcode: "93000", city: "Bobigny", type: "housenumber" },
        },
        { geometry: { coordinates: [Number.NaN, 1] }, properties: { label: "invalide" } },
      ],
    });
    expect(results).toEqual([
      { label: "145 Rue de Paris 93000 Bobigny", lat: 48.9077, lng: 2.4397, postcode: "93000", city: "Bobigny", kind: "housenumber", score: 0.97 },
    ]);
  });

  it("lit un itinéraire et convertit les unités", () => {
    expect(parseIgnRoute({ distance: 12_345.6, duration: 900, distanceUnit: "meter", timeUnit: "second" })).toEqual({
      distanceMeters: 12_345.6,
      durationSeconds: 900,
    });
    expect(parseIgnRoute({ distance: 12.3, duration: 15, distanceUnit: "kilometer", timeUnit: "minute" })).toEqual({
      distanceMeters: 12_300,
      durationSeconds: 900,
    });
    expect(() => parseIgnRoute({})).toThrow(ProviderError);
  });
});

describe("adaptateurs de secours", () => {
  it("OSRM", () => {
    expect(parseOsrmRoute({ code: "Ok", routes: [{ distance: 5000, duration: 600 }] })).toEqual({ distanceMeters: 5000, durationSeconds: 600 });
    expect(() => parseOsrmRoute({ code: "NoRoute", routes: [] })).toThrow(ProviderError);
  });

  it("OpenRouteService", () => {
    expect(parseOrsRoute({ features: [{ properties: { summary: { distance: 7000, duration: 700 } } }] })).toEqual({
      distanceMeters: 7000,
      durationSeconds: 700,
    });
  });

  it("Photon : adresses françaises uniquement", () => {
    const results = parsePhotonFeatures({
      features: [
        { geometry: { coordinates: [2.41, 48.89] }, properties: { housenumber: "12", street: "Rue Hoche", postcode: "93500", city: "Pantin", countrycode: "FR" } },
        { geometry: { coordinates: [4.35, 50.85] }, properties: { name: "Bruxelles", countrycode: "BE" } },
      ],
    });
    expect(results.map((r) => r.label)).toEqual(["12 Rue Hoche, 93500 Pantin"]);
  });
});

describe("simulation (tests uniquement)", () => {
  it("trouve une commune et garde la rue saisie", async () => {
    const results = await new SimulationGeocodingProvider().search("12 rue Hoche, Pantin", { limit: 3 });
    expect(results[0]?.city).toBe("Pantin");
    expect(results[0]?.label).toBe("12 rue Hoche, 93500 Pantin");
  });

  it("calcule une distance approximative", async () => {
    const bobigny = { lat: 48.9077, lng: 2.4397 };
    const cergy = { lat: 49.0364, lng: 2.0761 };
    expect(haversineKm(bobigny, cergy)).toBeGreaterThan(29);
    const route = await new SimulationRoutingProvider().route(bobigny, cergy);
    expect(route.distanceMeters / 1000).toBeCloseTo(haversineKm(bobigny, cergy) * 1.3, 0);
  });
});
