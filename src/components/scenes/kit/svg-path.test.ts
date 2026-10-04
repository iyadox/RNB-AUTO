import { describe, expect, it } from "vitest";
import { pathEnd, poseTransform, smoothPath } from "./svg-path";

describe("pathEnd", () => {
  it("suit les commandes absolues et relatives", () => {
    expect(pathEnd("M0 0 L10 0")).toEqual({ x: 10, y: 0, angle: 0 });
    expect(pathEnd("M0 0 l0 10")).toEqual({ x: 0, y: 10, angle: 90 });
    expect(pathEnd("M5 5 h10 v-10")).toMatchObject({ x: 15, y: -5, angle: -90 });
  });

  it("prend la tangente d'arrivée d'une courbe (dernier point de contrôle)", () => {
    const end = pathEnd("M0 0 C 10 0, 20 10, 20 20");
    expect(end.x).toBe(20);
    expect(end.y).toBe(20);
    expect(end.angle).toBe(90);
    expect(pathEnd("M0 0 C10 0 20 0 20 0").angle).toBe(0);
  });

  it("enchaîne des valeurs implicites et des courbes relatives", () => {
    expect(pathEnd("M0 0 10 0 10 10")).toMatchObject({ x: 10, y: 10, angle: 90 });
    expect(pathEnd("M0 0 c5 0 10 0 10 -10")).toMatchObject({ x: 10, y: -10, angle: -90 });
  });
});

describe("smoothPath", () => {
  it("passe par les points donnés", () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ]);
    expect(d.startsWith("M0 0C")).toBe(true);
    expect(d.endsWith("20 0")).toBe(true);
    expect(pathEnd(d)).toMatchObject({ x: 20, y: 0 });
  });

  it("ferme une boucle", () => {
    expect(smoothPath([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 8 }], true).endsWith("Z")).toBe(true);
  });
});

describe("poseTransform", () => {
  it("arrondit sans -0", () => {
    expect(poseTransform(1.04, -0.01, 0)).toBe("translate(1 0)");
    expect(poseTransform(1, 2, 45.25)).toBe("translate(1 2) rotate(45.3)");
  });
});
