/** Données du tableau de bord et de la veille des nouvelles demandes (espace de gestion). */
import { and, asc, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { parisMidnight, periodStart } from "@/core/calendar/periods";
import { earliestNeededDate, summarizeRevenue, type RevenueSummary } from "@/core/interventions/revenue";
import { IN_PROGRESS_STATUSES, OPEN_STATUSES, WAITING_STATUSES } from "@/core/interventions/status";
import { interventions } from "@/server/db/schema";
import type { DbLike } from "@/server/settings/repository";
import { countByStatus, type Intervention } from "./service";

export type DashboardData = {
  counts: Record<string, number>;
  waiting: number;
  inProgress: number;
  createdToday: number;
  revenue: RevenueSummary;
  /** Prix confirmés des interventions encore en cours (à encaisser). */
  pendingConfirmedCents: number;
  pendingConfirmedCount: number;
  open: Intervention[];
  recent: Intervention[];
};

export async function loadDashboard(db: DbLike, now: Date = new Date()): Promise<DashboardData> {
  const dayStart = periodStart(now, "day");
  const since = parisMidnight(earliestNeededDate(now));
  const [counts, todayRows, completed, pending, waitingRows, progressRows, recent] = await Promise.all([
    countByStatus(db),
    db.select({ n: sql<number>`count(*)::int` }).from(interventions).where(gte(interventions.createdAt, dayStart)),
    db
      .select({ completedAt: interventions.completedAt, confirmedPriceCents: interventions.confirmedPriceCents })
      .from(interventions)
      .where(and(eq(interventions.status, "completed"), isNotNull(interventions.completedAt), gte(interventions.completedAt, since))),
    db
      .select({
        cents: sql<number>`coalesce(sum(${interventions.confirmedPriceCents}), 0)::int`,
        n: sql<number>`count(${interventions.confirmedPriceCents})::int`,
      })
      .from(interventions)
      .where(inArray(interventions.status, [...IN_PROGRESS_STATUSES])),
    // Les demandes en attente : la plus ancienne d'abord (c'est elle qui attend depuis le plus longtemps).
    db.select().from(interventions).where(inArray(interventions.status, [...WAITING_STATUSES])).orderBy(asc(interventions.createdAt)).limit(12),
    db.select().from(interventions).where(inArray(interventions.status, [...IN_PROGRESS_STATUSES])).orderBy(desc(interventions.updatedAt)).limit(12),
    db.select().from(interventions).orderBy(desc(interventions.createdAt)).limit(5),
  ]);
  const sum = (statuses: readonly string[]) => statuses.reduce((total, status) => total + (counts[status] ?? 0), 0);
  return {
    counts,
    waiting: sum(WAITING_STATUSES),
    inProgress: sum(IN_PROGRESS_STATUSES),
    createdToday: todayRows[0]?.n ?? 0,
    revenue: summarizeRevenue(completed, now),
    pendingConfirmedCents: pending[0]?.cents ?? 0,
    pendingConfirmedCount: pending[0]?.n ?? 0,
    open: [...waitingRows, ...progressRows],
    recent,
  };
}

export type WatchSummary = {
  /** Demandes au statut « Nouvelle demande ». */
  newCount: number;
  /** Nouvelles + à rappeler. */
  waitingCount: number;
  openCount: number;
  latest: { id: string; reference: string; createdAt: string; contactName: string; place: string } | null;
};

/** Résumé léger, interrogé régulièrement par l'espace de gestion pour signaler une nouvelle demande. */
export async function watchSummary(db: DbLike): Promise<WatchSummary> {
  const [counts, latestRows] = await Promise.all([
    countByStatus(db),
    db
      .select({
        id: interventions.id,
        reference: interventions.reference,
        createdAt: interventions.createdAt,
        contactName: interventions.contactName,
        pickupCity: interventions.pickupCity,
        pickupAddress: interventions.pickupAddress,
      })
      .from(interventions)
      .where(eq(interventions.status, "new"))
      .orderBy(desc(interventions.createdAt))
      .limit(1),
  ]);
  const latest = latestRows[0];
  const sum = (statuses: readonly string[]) => statuses.reduce((total, status) => total + (counts[status] ?? 0), 0);
  return {
    newCount: counts.new ?? 0,
    waitingCount: sum(WAITING_STATUSES),
    openCount: sum(OPEN_STATUSES),
    latest: latest
      ? {
          id: latest.id,
          reference: latest.reference,
          createdAt: latest.createdAt.toISOString(),
          contactName: latest.contactName,
          place: latest.pickupCity ?? latest.pickupAddress,
        }
      : null,
  };
}
