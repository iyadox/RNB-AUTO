import { describe, expect, it } from "vitest";
import { dashes, depth, groundLine, project, ribbon, scaleAt, type Camera } from "./perspective";

const CAM: Camera = { vpX: 330, horizon: 300, k: 120, camH: 3.8, d0: 6 };

describe("perspective des scènes de /panne-autoroute", () => {
  it("place le premier plan à l'échelle 1 et fait tendre l'échelle vers 0 à l'horizon", () => {
    expect(depth(CAM, 0)).toBe(1);
    expect(scaleAt(CAM, 0)).toBe(120);
    expect(depth(CAM, 1e6)).toBeLessThan(1e-4);
  });

  it("fait converger toutes les lignes du sol vers un seul point de fuite", () => {
    for (const x of [-12, -4.8, 0, 3.2, 40]) {
      const far = project(CAM, x, 1e7);
      expect(far.x).toBeCloseTo(CAM.vpX, 0);
      expect(far.y).toBeCloseTo(CAM.horizon, 0);
    }
  });

  it("place le sol sous l'horizon et un objet plus haut que la caméra au-dessus", () => {
    expect(project(CAM, 0, 20).y).toBeGreaterThan(CAM.horizon);
    expect(project(CAM, 0, 20, CAM.camH + 2).y).toBeLessThan(CAM.horizon);
  });

  it("produit des tracés déterministes et fermés", () => {
    const a = ribbon(CAM, -1, 1, 0, 100);
    expect(a).toBe(ribbon(CAM, -1, 1, 0, 100));
    expect(a.startsWith("M")).toBe(true);
    expect(a.endsWith("Z")).toBe(true);
    expect(dashes(CAM, 0, 0.2, 3, 10, 0, 26).match(/M/g)).toHaveLength(2);
    expect(groundLine(CAM, 0, 0, 10, 4).split("L")).toHaveLength(5);
  });
});
