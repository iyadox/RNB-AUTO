/**
 * Chiffre d'affaires du tableau de bord, calculé uniquement sur les prix CONFIRMÉS des
 * interventions terminées (date de fin, heure de Paris). Logique pure : testée sans base.
 */
import { parisDate, periodStartDate, shiftDate, type Period } from "@/core/calendar/periods";

export type CompletedRow = { completedAt: Date | null; confirmedPriceCents: number | null };

export type PeriodTotal = { cents: number; count: number; unpriced: number };

export type RevenueSummary = Record<Period, PeriodTotal> & {
  /** Les 7 derniers jours (le plus ancien d'abord), pour le petit graphique. */
  lastDays: { date: string; cents: number; count: number }[];
};

function emptyTotal(): PeriodTotal {
  return { cents: 0, count: 0, unpriced: 0 };
}

export function summarizeRevenue(rows: CompletedRow[], now: Date, days = 7): RevenueSummary {
  const starts: Record<Period, string> = {
    day: periodStartDate(now, "day"),
    week: periodStartDate(now, "week"),
    month: periodStartDate(now, "month"),
  };
  const today = starts.day;
  const summary: RevenueSummary = { day: emptyTotal(), week: emptyTotal(), month: emptyTotal(), lastDays: [] };
  const byDay = new Map<string, { cents: number; count: number }>();
  for (let i = days - 1; i >= 0; i -= 1) byDay.set(shiftDate(today, -i), { cents: 0, count: 0 });

  for (const row of rows) {
    if (!row.completedAt) continue;
    const date = parisDate(row.completedAt);
    if (date > today) continue;
    const cents = row.confirmedPriceCents ?? 0;
    for (const period of ["day", "week", "month"] as const) {
      if (date >= starts[period]) {
        summary[period].count += 1;
        summary[period].cents += cents;
        if (row.confirmedPriceCents === null) summary[period].unpriced += 1;
      }
    }
    const bucket = byDay.get(date);
    if (bucket) {
      bucket.cents += cents;
      bucket.count += 1;
    }
  }
  summary.lastDays = [...byDay.entries()].map(([date, value]) => ({ date, ...value }));
  return summary;
}

/** Date de début de la plus ancienne période utile (pour limiter la requête). */
export function earliestNeededDate(now: Date, days = 7): string {
  const month = periodStartDate(now, "month");
  const week = periodStartDate(now, "week");
  const series = shiftDate(periodStartDate(now, "day"), -(days - 1));
  return [month, week, series].sort()[0]!;
}
