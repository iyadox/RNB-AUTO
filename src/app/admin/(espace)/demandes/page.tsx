import type { Metadata } from "next";
import Link from "next/link";
import { formatEurosShort, formatPhone, formatRelative } from "@/core/format";
import type { InterventionStatus } from "@/core/interventions/status";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState, LinkButton, PageHeader } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { countByStatus, listInterventions, type InterventionFilters } from "@/server/interventions/service";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = { title: "Demandes" };

/** Filtres lisibles dans l'adresse de la page. */
const FILTERS: { slug: string; label: string; status: NonNullable<InterventionFilters["status"]>; counts: InterventionStatus[] | null }[] = [
  { slug: "en-cours", label: "En cours", status: "active", counts: ["new", "to_call_back", "accepted", "en_route", "arrived", "loaded", "in_transit"] },
  { slug: "nouvelles", label: "Nouvelles", status: "new", counts: ["new"] },
  { slug: "a-rappeler", label: "À rappeler", status: "to_call_back", counts: ["to_call_back"] },
  { slug: "terminees", label: "Terminées", status: "completed", counts: ["completed"] },
  { slug: "annulees", label: "Annulées", status: "cancelled", counts: ["cancelled"] },
  { slug: "toutes", label: "Toutes", status: "all", counts: null },
];

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const filter = FILTERS.find((f) => f.slug === params.statut) ?? FILTERS[0]!;
  const search = (params.q ?? "").slice(0, 80);
  const db = await getDb();
  const [rows, counts, version] = await Promise.all([
    listInterventions(db, { status: filter.status, search, limit: 200 }),
    countByStatus(db),
    getLatestVersion(db),
  ]);
  const vehicleLabels = new Map((version?.snapshot.pricing.vehicles ?? []).map((v) => [v.code, v.label]));
  const countOf = (f: (typeof FILTERS)[number]) =>
    f.counts === null ? Object.values(counts).reduce((a, b) => a + b, 0) : f.counts.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Demandes"
        description="Toutes les demandes reçues par le site ou saisies pendant un appel."
        actions={
          <LinkButton href="/admin/demandes/nouvelle">
            <Icon name="plus" size={18} />
            Nouvelle demande
          </LinkButton>
        }
      />

      <nav aria-label="Filtrer les demandes" className="-mx-4 mb-4 overflow-x-auto px-4 pb-1">
        <ul className="flex w-max gap-2">
          {FILTERS.map((f) => {
            const active = f.slug === filter.slug;
            const n = countOf(f);
            return (
              <li key={f.slug}>
                <Link
                  href={{ pathname: "/admin/demandes", query: { statut: f.slug, ...(search ? { q: search } : {}) } }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-extrabold transition-colors",
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

      <form action="/admin/demandes" method="get" role="search" className="mb-5 flex gap-2">
        <input type="hidden" name="statut" value={filter.slug} />
        <label className="sr-only" htmlFor="q">
          Rechercher
        </label>
        <div className="flex flex-1 items-center gap-3 rounded-2xl border-2 border-asphalt-200 bg-white px-4 focus-within:border-asphalt-900">
          <Icon name="search" size={20} className="shrink-0 text-asphalt-400" />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Nom, téléphone, ville, immatriculation, référence…"
            className="h-12 w-full min-w-0 bg-transparent font-semibold outline-none placeholder:text-asphalt-400"
          />
        </div>
        <button type="submit" className="h-[3.25rem] shrink-0 rounded-2xl bg-asphalt-900 px-5 font-extrabold text-chalk hover:bg-asphalt-800">
          Chercher
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon="list" title={search ? "Aucune demande ne correspond" : "Aucune demande ici"}>
          {search ? "Essayez avec un autre mot (nom, ville, téléphone…)." : "Les demandes envoyées depuis le site apparaîtront ici."}
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-2">
          {rows.map((item) => {
            const status = item.status as InterventionStatus;
            const price = item.confirmedPriceCents ?? item.currentPriceCents;
            return (
              <li key={item.id} className="flex items-stretch gap-2 rounded-3xl border border-asphalt-200 bg-white hover:border-asphalt-400">
                <Link href={`/admin/demandes/${item.id}`} className="flex min-w-0 flex-1 items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold">{item.contactName}</span>
                      <StatusBadge status={status} />
                      {item.source === "phone" ? <span className="text-xs font-bold text-asphalt-400">appel</span> : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-asphalt-600">
                      {item.pickupCity ?? item.pickupAddress}
                      {item.dropoffKind === "on_site" ? " · sur place" : item.dropoffKind === "unknown" ? " · destination à préciser" : ` → ${item.dropoffCity ?? item.dropoffAddress ?? ""}`}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-asphalt-400">
                      {item.reference} · {vehicleLabels.get(item.vehicleCategory) ?? item.vehicleCategory} · {formatRelative(item.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold tabular">{price !== null ? formatEurosShort(price) : "—"}</p>
                    <p className="text-xs font-bold text-asphalt-400">{item.confirmedPriceCents !== null ? "confirmé" : price !== null ? "à confirmer" : "sans prix"}</p>
                  </div>
                </Link>
                <a
                  href={`tel:${item.contactPhone}`}
                  className="flex w-14 shrink-0 items-center justify-center rounded-r-3xl border-l border-asphalt-100 text-asphalt-700 hover:bg-signal-500 hover:text-asphalt-950"
                  aria-label={`Appeler ${item.contactName} au ${formatPhone(item.contactPhone)}`}
                >
                  <Icon name="phone" size={22} />
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
