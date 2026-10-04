import { minutesOfDay } from "@/core/calendar/paris";
import type { Condition, EngineInput, LegKey } from "./types";

/** Données sur lesquelles portent les conditions des règles. */
export type ConditionFacts = {
  input: EngineInput;
  km: Record<LegKey, number> & { total: number };
};

/**
 * Plage horaire : début inclus, fin exclue. Si la fin est avant le début, la plage passe minuit
 * (22:00 → 06:00 couvre 22:00…23:59 et 00:00…05:59). Début = fin signifie « toute la journée ».
 */
export function isTimeInRange(time: string, start: string, end: string): boolean {
  const t = minutesOfDay(time);
  const s = minutesOfDay(start);
  const e = minutesOfDay(end);
  if (s === e) return true;
  if (s < e) return t >= s && t < e;
  return t >= s || t < e;
}

export function evaluateCondition(condition: Condition, facts: ConditionFacts): boolean {
  const { input } = facts;
  switch (condition.type) {
    case "time_between":
      return isTimeInRange(input.local.time, condition.start, condition.end);
    case "weekday_in":
      return condition.days.includes(input.local.isoWeekday);
    case "public_holiday":
      return input.local.publicHoliday !== null;
    case "vehicle_in":
      return condition.categories.includes(input.vehicleCategory);
    case "situation_any":
      return condition.codes.some((code) => input.situations.includes(code));
    case "distance": {
      const km = condition.leg === "total" ? facts.km.total : facts.km[condition.leg];
      return condition.operator === "gt" ? km > condition.km : km <= condition.km;
    }
    case "service_kind":
      return input.serviceKind === condition.kind;
    case "pickup_postcode_in":
      return input.pickupPostcode != null && condition.postcodes.includes(input.pickupPostcode);
  }
}

/** Toutes les conditions doivent être vraies (liste vide = toujours vrai). */
export function matchesAll(conditions: Condition[], facts: ConditionFacts): boolean {
  return conditions.every((condition) => evaluateCondition(condition, facts));
}
