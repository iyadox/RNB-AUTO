import { describe, expect, it } from "vitest";
import { spreadMarkers } from "./road-line";

describe("spreadMarkers (repères de la ligne de route)", () => {
  it("laisse en place des repères déjà espacés", () => {
    expect(spreadMarkers([0, 0.3, 0.7], 0.05)).toEqual([0, 0.3, 0.7]);
  });

  it("écarte deux repères tombés au même endroit au bout de la ligne (page courte)", () => {
    const [a, b] = spreadMarkers([1, 1], 0.05) as number[];
    expect(b).toBe(1);
    expect(a).toBeCloseTo(0.95);
  });

  it("garde l'écart minimal partout, sans sortir de 0 à 1", () => {
    const out = spreadMarkers([0, 0.92, 0.99, 1, 1], 0.05) as number[];
    for (let i = 1; i < out.length; i += 1) expect(out[i]! - out[i - 1]!).toBeGreaterThanOrEqual(0.05 - 1e-9);
    expect(Math.min(...out)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...out)).toBeLessThanOrEqual(1);
  });

  it("ignore une section absente sans décaler les autres", () => {
    expect(spreadMarkers([0.2, null, 0.6], 0.05)).toEqual([0.2, null, 0.6]);
  });
});
