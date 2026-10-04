/**
 * Jours fériés nationaux (France métropolitaine), calculés automatiquement pour n'importe quelle année.
 * L'administration peut en désactiver certains et ajouter ses propres dates.
 */

export const HOLIDAY_CODES = [
  "new_year",
  "easter_monday",
  "labour_day",
  "victory_1945",
  "ascension",
  "whit_monday",
  "bastille_day",
  "assumption",
  "all_saints",
  "armistice",
  "christmas",
] as const;

export type HolidayCode = (typeof HOLIDAY_CODES)[number];

export const HOLIDAY_LABELS: Record<HolidayCode, string> = {
  new_year: "Jour de l'an",
  easter_monday: "Lundi de Pâques",
  labour_day: "Fête du Travail",
  victory_1945: "Victoire 1945",
  ascension: "Ascension",
  whit_monday: "Lundi de Pentecôte",
  bastille_day: "Fête nationale",
  assumption: "Assomption",
  all_saints: "Toussaint",
  armistice: "Armistice 1918",
  christmas: "Noël",
};

export type Holiday = { code: HolidayCode | "custom"; date: string; label: string };

export type HolidaysSettings = {
  /** Fériés nationaux à ignorer (ex. si RNB AUTO ne majore pas le lundi de Pentecôte). */
  disabled: string[];
  /** Dates ajoutées par l'administration (AAAA-MM-JJ). */
  custom: { date: string; label: string }[];
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return isoDate(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

/** Date de Pâques (calendrier grégorien, algorithme de Meeus/Jones/Butcher). */
export function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return isoDate(year, month, day);
}

/** Les 11 jours fériés nationaux d'une année, triés par date. */
export function nationalHolidays(year: number): Holiday[] {
  const easter = easterSunday(year);
  const list: Holiday[] = [
    { code: "new_year", date: isoDate(year, 1, 1), label: HOLIDAY_LABELS.new_year },
    { code: "easter_monday", date: addDays(easter, 1), label: HOLIDAY_LABELS.easter_monday },
    { code: "labour_day", date: isoDate(year, 5, 1), label: HOLIDAY_LABELS.labour_day },
    { code: "victory_1945", date: isoDate(year, 5, 8), label: HOLIDAY_LABELS.victory_1945 },
    { code: "ascension", date: addDays(easter, 39), label: HOLIDAY_LABELS.ascension },
    { code: "whit_monday", date: addDays(easter, 50), label: HOLIDAY_LABELS.whit_monday },
    { code: "bastille_day", date: isoDate(year, 7, 14), label: HOLIDAY_LABELS.bastille_day },
    { code: "assumption", date: isoDate(year, 8, 15), label: HOLIDAY_LABELS.assumption },
    { code: "all_saints", date: isoDate(year, 11, 1), label: HOLIDAY_LABELS.all_saints },
    { code: "armistice", date: isoDate(year, 11, 11), label: HOLIDAY_LABELS.armistice },
    { code: "christmas", date: isoDate(year, 12, 25), label: HOLIDAY_LABELS.christmas },
  ];
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

/** Renvoie le jour férié correspondant à une date (AAAA-MM-JJ), en tenant compte des réglages. */
export function findHoliday(date: string, settings: HolidaysSettings): Holiday | null {
  const year = Number(date.slice(0, 4));
  const national = nationalHolidays(year).find(
    (h) => h.date === date && !settings.disabled.includes(h.code),
  );
  if (national) return national;
  const custom = settings.custom.find((c) => c.date === date);
  return custom ? { code: "custom", date: custom.date, label: custom.label } : null;
}

/** Fériés à venir (nationaux actifs + ajoutés), pour l'affichage dans l'administration. */
export function upcomingHolidays(fromDate: string, settings: HolidaysSettings, count = 6): Holiday[] {
  const year = Number(fromDate.slice(0, 4));
  const all = [...nationalHolidays(year), ...nationalHolidays(year + 1)]
    .filter((h) => !settings.disabled.includes(h.code))
    .concat(settings.custom.map((c) => ({ code: "custom" as const, date: c.date, label: c.label })))
    .filter((h) => h.date >= fromDate)
    .sort((a, b) => a.date.localeCompare(b.date));
  return all.slice(0, count);
}
