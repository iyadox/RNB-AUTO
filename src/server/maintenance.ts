/**
 * Entretien automatique : suppression des données qui ne doivent plus être gardées (voir la page
 * « Confidentialité »), nettoyage technique et prix du carburant en mode automatique.
 * Lancé par la tâche planifiée (/api/maintenance) ou, à défaut, lors d'une visite de l'administration.
 */
import { and, eq, lt, sql } from "drizzle-orm";
import { counters, fuelPrices, rateLimits, routeCache, sessions } from "@/server/db/schema";
import { refreshFuelPrice } from "@/server/fuel/service";
import { purgeOldEstimates } from "@/server/interventions/service";
import { purgeOldPhotos } from "@/server/photos/service";
import type { DbLike } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

const KEY = "maintenance:last-run-minute";
/** Intervalle minimal entre deux entretiens déclenchés par une visite. */
const INTERVAL_MINUTES = 6 * 60;

export type MaintenanceReport = { ran: boolean; steps: Record<string, string> };

/** Réserve le créneau d'entretien (un seul serveur à la fois). */
async function claim(db: DbLike, force: boolean): Promise<boolean> {
  const nowMinute = Math.floor(Date.now() / 60_000);
  const [row] = await db
    .insert(counters)
    .values({ key: KEY, value: nowMinute })
    .onConflictDoUpdate({
      target: counters.key,
      set: { value: nowMinute },
      setWhere: force ? undefined : lt(counters.value, nowMinute - INTERVAL_MINUTES),
    })
    .returning({ value: counters.value });
  return row !== undefined;
}

export async function runMaintenance(db: DbLike, options: { force?: boolean } = {}): Promise<MaintenanceReport> {
  if (!(await claim(db, options.force ?? false))) return { ran: false, steps: {} };
  const steps: Record<string, string> = {};
  const step = async (name: string, task: () => Promise<string>) => {
    try {
      steps[name] = await task();
    } catch (error) {
      steps[name] = `erreur : ${error instanceof Error ? error.message : "inconnue"}`;
    }
  };

  await step("estimations", async () => {
    await purgeOldEstimates(db);
    return "ok";
  });
  await step("photos", async () => `${await purgeOldPhotos(db)} supprimée(s)`);
  await step("sessions", async () => {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    return "ok";
  });
  await step("compteurs", async () => {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(Date.now() - 24 * 3_600_000)));
    return "ok";
  });
  await step("itinéraires", async () => {
    await db.delete(routeCache).where(lt(routeCache.createdAt, new Date(Date.now() - 30 * 24 * 3_600_000)));
    return "ok";
  });
  await step("carburant", async () => {
    const version = await getLatestVersion(db);
    if (!version || version.snapshot.fuel.mode !== "auto") return "mode manuel";
    const [recent] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(fuelPrices)
      .where(and(eq(fuelPrices.status, "accepted"), sql`${fuelPrices.fetchedAt} > now() - interval '5 hours'`));
    if ((recent?.n ?? 0) > 0) return "prix récent";
    return (await refreshFuelPrice(db, version.snapshot)).message;
  });
  return { ran: true, steps };
}
