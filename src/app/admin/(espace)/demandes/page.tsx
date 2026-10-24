import type { Metadata } from "next";
import Link from "next/link";
import { parisDate, parisMidnight, periodStartDate, shiftDate } from "@/core/calendar/periods";
import { filtersQuery, parseListFilters, PAGE_SIZE, PERIOD_FILTERS, SOURCE_FILTERS, STATUS_FILTERS } from "@/core/interventions/list-filters";
import { AutoSubmitSelect } from "@/components/admin/auto-submit-select";
import { RequestCard } from "@/components/admin/request-card";
import { EmptyState, LinkButton, PageHeader } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { countByStatus, countInterventions, listInterventions, type Intervention } from "@/server/interventions/service";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = { title: "Demandes" };

const dayFormatter = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });
const dayYearFormatter = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Regroupe les demandes par jour (heure de Paris) : « Aujourd'hui », « Hier », « lundi 19 octobre »… */
function groupByDay(rows: Intervention[], now: Date) {
  const today = parisDate(now);
  const yesterday = shiftDate(today, -1);
  const groups: { key: string; label: string; rows: Intervention[] }[] = [];
  for (const row of rows) {
    const date = parisDate(row.createdAt);
    let group = groups.at(-1);
    if (!group || group.key !== date) {
      const label =
        date === today
          ? "Aujourd'hui"
          : date === yesterday
            ? "Hier"
            : (date.slice(0, 4) === today.slice(0, 4) ? dayFormatter : dayYearFormatter).format(row.createdAt);
      group = { key: date, label, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

export default async function RequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const filters = parseListFilters(await searchParams);
  const now = new Date();
  // Minuit (heure de Paris) du premier jour de la période, juste même lors d'un changement d'heure.
  const since = filters.period.days === null ? null : parisMidnight(shiftDate(periodStartDate(now, "day"), -(filters.period.days - 1)));
  const query = { statuses: filters.status.statuses, since, sources: filters.source.sources, search: filters.search };
  const db = await getDb();
  const [rows, total, counts, version] = await Promise.all([
    listInterventions(db, { ...query, limit: filters.limit }),
    countInterventions(db, query),
    countByStatus(db),
    getLatestVersion(db),
  ]);
  const vehicleLabels = new Map((version?.snapshot.pricing.vehicles ?? []).map((v) => [v.code, v.label]));
  const countOf = (statuses: readonly string[] | null) =>
    statuses === null ? Object.values(counts).reduce((a, b) => a + b, 0) : statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);
  const refined = filters.period.slug !== "tout" || filters.source.slug !== "toutes" || filters.search !== "";
  const groups = groupByDay(rows, now);

  return (
    <>
      <PageHeader
        title="Demandes"
        description="Toutes les demandes reçues par le site ou saisies pendant un appel."
        actions={
          <div className="hidden lg:block">
            <LinkButton href="/admin/demandes/nouvelle">
              <Icon name="plus" size={18} />
              Nouvelle demande
            </LinkButton>
          </div>
        }
      />

      <nav aria-label="Filtrer par étape" className="-mx-4 mb-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        <ul className="flex w-max gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = f.slug === filters.status.slug;
            const n = countOf(f.statuses);
            return (
              <li key={f.slug}>
                <Link
                  href={{ pathname: "/admin/demandes", query: filtersQuery(filters, { statut: f.slug, n: String(PAGE_SIZE) }) }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-2 whitespace-nowrap rounded-2xl px-4 text-sm font-extrabold transition-colors",
                    active ? "bg-asphalt-900 text-chalk" : "bg-white text-asphalt-700 ring-1 ring-asphalt-200 hover:ring-asphalt-400",
                  )}
                >
                  {f.label}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs tabular", active ? "bg-signal-500 text-asphalt-950" : "bg-asphalt-100 text-asphalt-600")}>{n}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form action="/admin/demandes" method="get" role="search" className="mb-5 grid gap-2 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <input type="hidden" name="statut" value={filters.status.slug} />
        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border-2 border-asphalt-200 bg-white px-4 focus-within:border-asphalt-900">
            <Icon name="search" size={20} className="shrink-0 text-asphalt-400" />
            <label className="sr-only" htmlFor="q">
              Rechercher une demande
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.search}
              placeholder="Nom, téléphone, ville, plaque…"
              className="h-12 w-full min-w-0 bg-transparent font-semibold outline-none placeholder:text-asphalt-400"
            />
          </div>
          <button type="submit" className="h-[3.25rem] shrink-0 rounded-2xl bg-asphalt-900 px-4 font-extrabold text-chalk hover:bg-asphalt-800 sm:px-5">
            Chercher
          </button>
        </div>
        <div className="flex gap-2">
          <AutoSubmitSelect name="periode" label="Période" value={filters.period.slug} options={PERIOD_FILTERS} />
          <AutoSubmitSelect name="origine" label="Origine" value={filters.source.slug} options={SOURCE_FILTERS} />
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-bold text-asphalt-600" aria-live="polite">
          {total === 0 ? "Aucune demande" : `${total} demande${total > 1 ? "s" : ""}`}
          {filters.search ? ` pour « ${filters.search} »` : ""}
        </p>
        {refined ? (
          <Link href={{ pathname: "/admin/demandes", query: filtersQuery(filters, { q: "", periode: "tout", origine: "toutes", n: String(PAGE_SIZE) }) }} className="flex items-center gap-1 font-bold text-asphalt-600 hover:text-asphalt-900">
            <Icon name="x" size={14} />
            Effacer la recherche
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="list" title={refined ? "Aucune demande ne correspond" : "Aucune demande ici"}>
          {refined ? "Essayez avec un autre mot (nom, ville, téléphone…) ou une autre période." : "Les demandes envoyées depuis le site apparaîtront ici, avec une alerte."}
        </EmptyState>
      ) : (
        <div className="grid gap-6">
          {groups.map((group) => (
            <section key={group.key} aria-label={group.label}>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-extrabold uppercase tracking-wider text-asphalt-500">
                <span className="first-letter:uppercase">{group.label}</span>
                <span className="h-px flex-1 bg-asphalt-200" aria-hidden="true" />
                <span className="tabular">{group.rows.length}</span>
              </h2>
              <ul className="grid gap-2.5">
                {group.rows.map((item) => (
                  <RequestCard key={item.id} item={item} vehicleLabel={vehicleLabels.get(item.vehicleCategory)} timeStyle="clock" />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {total > rows.length ? (
        <div className="mt-6 text-center">
          <LinkButton href={`/admin/demandes?${new URLSearchParams(filtersQuery(filters, { n: String(filters.limit + PAGE_SIZE) })).toString()}`} variant="secondary">
            Afficher plus ({total - rows.length} de plus)
          </LinkButton>
        </div>
      ) : null}
    </>
  );
}
