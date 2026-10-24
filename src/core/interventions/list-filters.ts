/**
 * Filtres de la liste des demandes, lisibles dans l'adresse de la page
 * (`/admin/demandes?statut=a-rappeler&periode=7-jours&origine=site&q=…`).
 */
import { z } from "zod";
import { IN_PROGRESS_STATUSES, OPEN_STATUSES, type InterventionStatus } from "./status";

export type StatusFilter = {
  slug: string;
  label: string;
  /** Statuts inclus ; null = tous. */
  statuses: readonly InterventionStatus[] | null;
};

export const STATUS_FILTERS: StatusFilter[] = [
  { slug: "en-cours", label: "À traiter et en cours", statuses: OPEN_STATUSES },
  { slug: "nouvelles", label: "Nouvelles", statuses: ["new"] },
  { slug: "a-rappeler", label: "À rappeler", statuses: ["to_call_back"] },
  { slug: "sur-la-route", label: "Acceptées et en route", statuses: IN_PROGRESS_STATUSES },
  { slug: "terminees", label: "Terminées", statuses: ["completed"] },
  { slug: "annulees", label: "Annulées", statuses: ["cancelled"] },
  { slug: "toutes", label: "Toutes", statuses: null },
];

export const PERIOD_FILTERS = [
  { slug: "tout", label: "Toutes dates", days: null },
  { slug: "aujourd-hui", label: "Aujourd'hui", days: 1 },
  { slug: "7-jours", label: "7 jours", days: 7 },
  { slug: "30-jours", label: "30 jours", days: 30 },
] as const;

export const SOURCE_FILTERS = [
  { slug: "toutes", label: "Site et appels", sources: null },
  { slug: "site", label: "Par le site", sources: ["web"] },
  { slug: "appel", label: "Par téléphone", sources: ["phone", "admin"] },
] as const;

export const PAGE_SIZE = 50;
export const MAX_LIMIT = 500;

export type ListFilters = {
  status: StatusFilter;
  period: (typeof PERIOD_FILTERS)[number];
  source: (typeof SOURCE_FILTERS)[number];
  search: string;
  limit: number;
};

const raw = z.object({
  statut: z.string().optional(),
  periode: z.string().optional(),
  origine: z.string().optional(),
  q: z.string().optional(),
  n: z.string().optional(),
});

function first(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

/** Lit les paramètres de l'adresse ; toute valeur inconnue revient à la valeur par défaut. */
export function parseListFilters(params: Record<string, unknown>): ListFilters {
  const parsed = raw.safeParse(Object.fromEntries(Object.entries(params).map(([k, v]) => [k, first(v)])));
  const p = parsed.success ? parsed.data : {};
  const limit = Number.parseInt(p.n ?? "", 10);
  return {
    status: STATUS_FILTERS.find((f) => f.slug === p.statut) ?? STATUS_FILTERS[0]!,
    period: PERIOD_FILTERS.find((f) => f.slug === p.periode) ?? PERIOD_FILTERS[0],
    source: SOURCE_FILTERS.find((f) => f.slug === p.origine) ?? SOURCE_FILTERS[0],
    search: (p.q ?? "").trim().slice(0, 80),
    limit: Number.isFinite(limit) ? Math.min(MAX_LIMIT, Math.max(PAGE_SIZE, limit)) : PAGE_SIZE,
  };
}

/** Paramètres d'adresse pour des filtres donnés (les valeurs par défaut sont omises). */
export function filtersQuery(filters: ListFilters, override: Partial<Record<"statut" | "periode" | "origine" | "q" | "n", string>> = {}): Record<string, string> {
  const query: Record<string, string> = {
    statut: filters.status.slug,
    periode: filters.period.slug,
    origine: filters.source.slug,
    q: filters.search,
    n: String(filters.limit),
    ...override,
  };
  const defaults: Record<string, string> = { statut: STATUS_FILTERS[0]!.slug, periode: "tout", origine: "toutes", q: "", n: String(PAGE_SIZE) };
  return Object.fromEntries(Object.entries(query).filter(([key, value]) => value !== defaults[key]));
}
