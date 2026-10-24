/**
 * Débuts de période (jour, semaine, mois) à l'heure de Paris, quel que soit le fuseau du serveur.
 * Utilisé par le tableau de bord (chiffre d'affaires du jour, de la semaine, du mois).
 */
import { isoWeekdayOf, toParisLocal } from "./paris";

export type Period = "day" | "week" | "month";

/** Décalage de Paris par rapport à UTC à cet instant, en minutes (60 l'hiver, 120 l'été). */
export function parisOffsetMinutes(instant: Date): number {
  const local = toParisLocal(instant);
  const [y, m, d] = local.date.split("-").map(Number) as [number, number, number];
  const [hh, mm] = local.time.split(":").map(Number) as [number, number];
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  const truncated = Math.floor(instant.getTime() / 60_000) * 60_000;
  return Math.round((asUtc - truncated) / 60_000);
}

/** Instant de minuit (heure de Paris) pour une date AAAA-MM-JJ. */
export function parisMidnight(date: string): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const guess = Date.UTC(y, m - 1, d);
  // Deux passes : le décalage peut changer entre l'estimation et le résultat (changement d'heure).
  let instant = guess - parisOffsetMinutes(new Date(guess)) * 60_000;
  instant = guess - parisOffsetMinutes(new Date(instant)) * 60_000;
  return new Date(instant);
}

/** Date AAAA-MM-JJ décalée d'un nombre de jours (calendrier pur). */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

/** Date locale (AAAA-MM-JJ) du début de la période qui contient `now`. */
export function periodStartDate(now: Date, period: Period): string {
  const today = toParisLocal(now).date;
  if (period === "day") return today;
  if (period === "week") return shiftDate(today, 1 - isoWeekdayOf(today));
  return `${today.slice(0, 8)}01`;
}

/** Instant du début de la période (lundi pour la semaine, le 1er pour le mois), heure de Paris. */
export function periodStart(now: Date, period: Period): Date {
  return parisMidnight(periodStartDate(now, period));
}

/** Date locale de Paris d'un instant (AAAA-MM-JJ). */
export function parisDate(instant: Date): string {
  return toParisLocal(instant).date;
}
