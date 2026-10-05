import { describe, expect, it } from "vitest";
import { roundedRectPath } from "./svg-merge";

describe("roundedRectPath", () => {
  it("part de (x + rx, y) et tourne dans le sens horaire, comme <rect>", () => {
    expect(roundedRectPath(10, 20, 56, 50, 3)).toBe(
      "M13 20H63A3 3 0 0 1 66 23V67A3 3 0 0 1 63 70H13A3 3 0 0 1 10 67V23A3 3 0 0 1 13 20Z",
    );
  });

  it("borne le rayon à la moitié du plus petit côté", () => {
    expect(roundedRectPath(0, 0, 5, 3, 4)).toBe(roundedRectPath(0, 0, 5, 3, 1.5));
  });

  it("sans rayon : un simple rectangle", () => {
    expect(roundedRectPath(1, 2, 3, 4)).toBe("M1 2H4V6H1Z");
  });
});
