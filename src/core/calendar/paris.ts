/**
 * Heure locale de Paris, indépendante du fuseau du serveur (les serveurs tournent souvent en UTC).
 * Les changements d'heure (été/hiver) sont gérés par l'API Intl du moteur JavaScript.
 */

export const PARIS_TIME_ZONE = "Europe/Paris";

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type LocalMoment = {
  /** AAAA-MM-JJ */
  date: string;
  /** HH:MM */
  time: string;
  /** 1 = lundi … 7 = dimanche */
  isoWeekday: IsoWeekday;
};

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: PARIS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Instant → date, heure et jour de la semaine à Paris. */
export function toParisLocal(instant: Date): LocalMoment {
  const parts = partsFormatter.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "00";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  return { date, time: `${get("hour")}:${get("minute")}`, isoWeekday: isoWeekdayOf(date) };
}

/** Jour de la semaine ISO d'une date AAAA-MM-JJ (le fuseau n'intervient pas). */
export function isoWeekdayOf(date: string): IsoWeekday {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = dimanche
  return (jsDay === 0 ? 7 : jsDay) as IsoWeekday;
}

/** « 22:30 » → 1350 minutes depuis minuit. */
export function minutesOfDay(time: string): number {
  const [h, m] = time.split(":").map(Number) as [number, number];
  return h * 60 + m;
}

/** Ajoute des minutes à un moment local (utile pour l'heure d'arrivée estimée). */
export function addMinutesLocal(moment: LocalMoment, minutes: number): LocalMoment {
  const total = minutesOfDay(moment.time) + Math.round(minutes);
  const dayShift = Math.floor(total / 1440);
  const inDay = ((total % 1440) + 1440) % 1440;
  const [y, m, d] = moment.date.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(y, m - 1, d + dayShift));
  const date = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
  const time = `${String(Math.floor(inDay / 60)).padStart(2, "0")}:${String(inDay % 60).padStart(2, "0")}`;
  return { date, time, isoWeekday: isoWeekdayOf(date) };
}

/** Vérifie le format HH:MM (00:00 à 23:59). */
export function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

/** Vérifie le format AAAA-MM-JJ et l'existence de la date. */
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d));
  return utc.getUTCFullYear() === y && utc.getUTCMonth() === m - 1 && utc.getUTCDate() === d;
}
