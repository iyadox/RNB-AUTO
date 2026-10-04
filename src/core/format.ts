/** Mise en forme française des montants, distances, durées et dates. */

const eurosFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurosShortFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** 4550 → « 45,50 € » */
export function formatEuros(cents: number): string {
  return eurosFormatter.format(cents / 100);
}

/** 4500 → « 45 € » ; 4550 → « 45,50 € » */
export function formatEurosShort(cents: number): string {
  if (cents % 100 === 0) return eurosShortFormatter.format(cents / 100);
  return eurosFormatter.format(cents / 100);
}

/** Montant signé pour les détails de calcul : « +38,40 € » / « −10,00 € ». */
export function formatSignedEuros(cents: number): string {
  if (cents === 0) return formatEuros(0);
  const sign = cents > 0 ? "+" : "−";
  return `${sign}${formatEuros(Math.abs(cents))}`;
}

/** Valeur décimale pour un champ de saisie : 4550 → « 45,50 », 4500 → « 45 ». */
export function centsToInput(cents: number): string {
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2).replace(".", ",");
}

const numberFormatter = (decimals: number) =>
  new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: decimals });

/** 12.34 → « 12,3 km » */
export function formatKm(km: number, decimals = 1): string {
  return `${numberFormatter(decimals).format(km)} km`;
}

/** 105 → « 1 h 45 » ; 40 → « 40 min » */
export function formatMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** 2500 → « 25 % » ; 1250 → « 12,5 % » */
export function formatPercentBp(bp: number): string {
  return `${numberFormatter(2).format(bp / 100)} %`;
}

/** 2349 → « 2,349 €/L » */
export function formatFuelPrice(millis: number): string {
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(millis / 1000)} €/L`;
}

/** 13.5 → « 13,5 L/100 km » */
export function formatConsumption(litersPer100: number): string {
  return `${numberFormatter(1).format(litersPer100)} L/100 km`;
}

/** 14.0874 → « 14,09 L » */
export function formatLiters(liters: number): string {
  return `${numberFormatter(2).format(liters)} L`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

/** « 03/10/2026 à 14:20 » (heure de Paris) */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = dateTimeFormatter.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} à ${get("hour")}:${get("minute")}`;
}

/** « 03/10/2026 » (heure de Paris) */
export function formatDate(date: Date | string): string {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** « 14:20 » (heure de Paris) */
export function formatTime(date: Date | string): string {
  return timeFormatter.format(typeof date === "string" ? new Date(date) : date);
}

/** Libellé relatif court : « à l'instant », « il y a 12 min », « il y a 3 h », sinon la date. */
export function formatRelative(date: Date | string, now: Date = new Date()): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMin = Math.round((now.getTime() - d.getTime()) / 60_000);
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  return formatDateTime(d);
}

export const WEEKDAY_LABELS: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

/** Numéro de téléphone français lisible : « 06 12 34 56 78 ». */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  if (digits.length === 11 && digits.startsWith("33")) {
    return `0${digits.slice(2)}`.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  return phone.trim();
}

/** Numéro au format international pour les liens tel: (+33…). */
export function phoneToE164(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  const only = digits.replace(/\D/g, "");
  if (only.length === 10 && only.startsWith("0")) return `+33${only.slice(1)}`;
  if (only.length === 11 && only.startsWith("33")) return `+${only}`;
  return null;
}
