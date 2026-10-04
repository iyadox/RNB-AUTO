import { describe, expect, it } from "vitest";
import { formatMinutes } from "./format";
import { parseEurosToCents, percentOf, roundHalfAwayFromZero, roundToStep, ttcToHt } from "./money";

describe("montants", () => {
  it("arrondi commercial", () => {
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
    expect(roundHalfAwayFromZero(2113.5)).toBe(2114);
    expect(roundHalfAwayFromZero(12.3 * 220)).toBe(2706);
  });

  it("pourcentages en points de base", () => {
    expect(percentOf(19_200, 2000)).toBe(3840);
    expect(percentOf(999, 1250)).toBe(125);
  });

  it("arrondi au pas", () => {
    expect(roundToStep(8713, 100, "nearest")).toBe(8700);
    expect(roundToStep(8713, 1000, "nearest")).toBe(9000);
    expect(roundToStep(8400, 1000, "nearest")).toBe(8000);
    expect(roundToStep(8400, 1000, "up")).toBe(9000);
    expect(roundToStep(8750, 500, "nearest")).toBe(9000);
    expect(roundToStep(9000, 1000, "up")).toBe(9000);
  });

  it("TTC → HT", () => {
    expect(ttcToHt(27_000, 2000)).toBe(22_500);
    expect(ttcToHt(4500, 2000)).toBe(3750);
  });

  it("lit les saisies en euros", () => {
    expect(parseEurosToCents("45")).toBe(4500);
    expect(parseEurosToCents("45,5")).toBe(4550);
    expect(parseEurosToCents("1 234,56 €")).toBe(123_456);
    expect(parseEurosToCents("2.20")).toBe(220);
    expect(parseEurosToCents("abc")).toBeNull();
    expect(parseEurosToCents("4,555")).toBeNull();
    expect(formatMinutes(105)).toBe("1 h 45");
  });
});
