import { describe, expect, it } from "vitest";
import { easterSunday, findHoliday, nationalHolidays } from "./holidays";
import { addMinutesLocal, isValidDate, isoWeekdayOf, toParisLocal } from "./paris";

describe("jours fériés", () => {
  it("calcule Pâques", () => {
    expect(easterSunday(2025)).toBe("2025-04-20");
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
    expect(easterSunday(2038)).toBe("2038-04-25");
  });

  it("calcule les fériés mobiles de 2026", () => {
    const list = nationalHolidays(2026);
    const date = (code: string) => list.find((h) => h.code === code)?.date;
    expect(list).toHaveLength(11);
    expect(date("easter_monday")).toBe("2026-04-06");
    expect(date("ascension")).toBe("2026-05-14");
    expect(date("whit_monday")).toBe("2026-05-25");
  });

  it("tient compte des fériés désactivés et ajoutés", () => {
    const settings = { disabled: ["whit_monday"], custom: [{ date: "2026-12-24", label: "Veille de Noël" }] };
    expect(findHoliday("2026-05-25", settings)).toBeNull();
    expect(findHoliday("2026-12-25", settings)?.label).toBe("Noël");
    expect(findHoliday("2026-12-24", settings)?.label).toBe("Veille de Noël");
    expect(findHoliday("2026-10-04", settings)).toBeNull();
  });
});

describe("heure de Paris", () => {
  it("convertit un instant UTC en heure de Paris (été et hiver)", () => {
    expect(toParisLocal(new Date("2026-07-01T21:30:00Z"))).toEqual({ date: "2026-07-01", time: "23:30", isoWeekday: 3 });
    expect(toParisLocal(new Date("2026-12-31T23:30:00Z"))).toEqual({ date: "2027-01-01", time: "00:30", isoWeekday: 5 });
  });

  it("gère le passage à l'heure d'hiver (25 octobre 2026)", () => {
    expect(toParisLocal(new Date("2026-10-25T00:30:00Z")).time).toBe("02:30");
    expect(toParisLocal(new Date("2026-10-25T01:30:00Z")).time).toBe("02:30");
    expect(toParisLocal(new Date("2026-10-25T02:30:00Z")).time).toBe("03:30");
  });

  it("jour de la semaine et ajout de minutes", () => {
    expect(isoWeekdayOf("2026-10-04")).toBe(7);
    expect(addMinutesLocal({ date: "2026-10-04", time: "23:40", isoWeekday: 7 }, 35)).toEqual({
      date: "2026-10-05",
      time: "00:15",
      isoWeekday: 1,
    });
    expect(isValidDate("2026-02-29")).toBe(false);
    expect(isValidDate("2028-02-29")).toBe(true);
  });
});
