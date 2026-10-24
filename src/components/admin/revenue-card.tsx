/**
 * Chiffre d'affaires du tableau de bord : jour, semaine, mois et les 7 derniers jours.
 * Calculé uniquement sur les prix confirmés des interventions terminées.
 */
import { isoWeekdayOf } from "@/core/calendar/paris";
import { formatEurosShort } from "@/core/format";
import type { RevenueSummary } from "@/core/interventions/revenue";
import { cn } from "@/components/ui/cn";

const SHORT_DAYS = ["", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];
const LONG_DAYS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function dayLabel(date: string, long = false): string {
  const [, m, d] = date.split("-");
  const weekday = isoWeekdayOf(date);
  return long ? `${LONG_DAYS[weekday]} ${Number(d)}/${m}` : SHORT_DAYS[weekday]!;
}

function Figure({ label, cents, count }: { label: string; cents: number; count: number }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wider text-asphalt-300">{label}</p>
      <p className="mt-1 truncate text-2xl font-extrabold tabular text-chalk sm:text-3xl">{formatEurosShort(cents)}</p>
      <p className="text-xs text-asphalt-300">
        {count} terminée{count > 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function RevenueCard({ revenue, pendingCents, pendingCount }: { revenue: RevenueSummary; pendingCents: number; pendingCount: number }) {
  const max = Math.max(...revenue.lastDays.map((d) => d.cents), 1);
  const unpriced = revenue.month.unpriced;
  return (
    <section aria-labelledby="ca-titre" className="rounded-3xl bg-asphalt-900 p-5 text-chalk sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="ca-titre" className="text-lg font-extrabold">
          Chiffre d&apos;affaires
        </h2>
        <p className="text-xs font-semibold text-asphalt-300">prix confirmés</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Figure label="Aujourd'hui" cents={revenue.day.cents} count={revenue.day.count} />
        <Figure label="Semaine" cents={revenue.week.cents} count={revenue.week.count} />
        <Figure label="Mois" cents={revenue.month.cents} count={revenue.month.count} />
      </div>

      <figure className="mt-6">
        <figcaption className="text-xs font-bold uppercase tracking-wider text-asphalt-300">7 derniers jours</figcaption>
        {revenue.lastDays.every((day) => day.count === 0) ? (
          <p className="mt-3 rounded-2xl border border-dashed border-asphalt-700 px-4 py-5 text-center text-sm text-asphalt-300">
            Aucune intervention terminée ces 7 derniers jours. Le graphique se remplira tout seul.
          </p>
        ) : (
          <>
            <div className="mt-3 grid h-28 grid-cols-7 items-end gap-0.5" aria-hidden="true">
              {revenue.lastDays.map((day, index) => {
                const last = index === revenue.lastDays.length - 1;
                const height = day.cents > 0 ? Math.max(6, Math.round((day.cents / max) * 100)) : 0;
                return (
                  <div key={day.date} className="group relative flex h-full flex-col items-center justify-end px-1" title={`${dayLabel(day.date, true)} : ${formatEurosShort(day.cents)} (${day.count})`}>
                    {day.cents > 0 && (last || day.cents === max) ? (
                      <span className="mb-1 text-[0.65rem] font-extrabold tabular text-chalk">{formatEurosShort(day.cents)}</span>
                    ) : null}
                    <span
                      className={cn("w-full max-w-9 rounded-t-[4px]", day.cents > 0 ? "bg-signal-500" : "bg-asphalt-700")}
                      style={{ height: day.cents > 0 ? `${height}%` : "2px" }}
                    />
                    <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-white px-2 py-1 text-xs font-bold text-asphalt-950 shadow group-hover:block">
                      {formatEurosShort(day.cents)} · {day.count}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-0.5 border-t border-asphalt-700 pt-1.5 text-center text-[0.7rem] font-bold text-asphalt-300" aria-hidden="true">
              {revenue.lastDays.map((day, index) => (
                <span key={day.date} className={index === revenue.lastDays.length - 1 ? "text-signal-400" : undefined}>
                  {index === revenue.lastDays.length - 1 ? "auj." : dayLabel(day.date)}
                </span>
              ))}
            </div>
          </>
        )}
        <table className="sr-only">
          <caption>Chiffre d&apos;affaires des 7 derniers jours</caption>
          <tbody>
            {revenue.lastDays.map((day) => (
              <tr key={day.date}>
                <th scope="row">{dayLabel(day.date, true)}</th>
                <td>{formatEurosShort(day.cents)}</td>
                <td>{day.count} terminée(s)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>

      <div className="mt-5 grid gap-1.5 border-t border-asphalt-700 pt-4 text-sm text-asphalt-200">
        <p>
          <strong className="text-chalk tabular">{formatEurosShort(pendingCents)}</strong> confirmés sur {pendingCount} intervention{pendingCount > 1 ? "s" : ""} en cours.
        </p>
        {unpriced > 0 ? (
          <p className="text-signal-300">
            {unpriced} intervention{unpriced > 1 ? "s" : ""} terminée{unpriced > 1 ? "s" : ""} ce mois sans prix confirmé (non comptée{unpriced > 1 ? "s" : ""}).
          </p>
        ) : null}
      </div>
    </section>
  );
}
