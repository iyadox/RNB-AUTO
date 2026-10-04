/**
 * Santé des services externes : un service qui échoue plusieurs fois de suite est mis de côté
 * quelques instants (coupe-circuit), et son état est enregistré pour la page « Services externes ».
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { providerStatus } from "@/server/db/schema";

const FAILURE_THRESHOLD = 3;
const COOL_DOWN_MS = 60_000;

type Health = { failures: number; openUntil: number };
const memory = new Map<string, Health>();

export function isProviderAvailable(id: string): boolean {
  const health = memory.get(id);
  return !health || health.openUntil < Date.now();
}

function persist(id: string, kind: string, ok: boolean, error?: string): void {
  // Enregistrement en arrière-plan : une erreur ici ne doit jamais bloquer un calcul.
  void (async () => {
    try {
      const db = await getDb();
      await db
        .insert(providerStatus)
        .values({
          provider: id,
          kind,
          lastSuccessAt: ok ? new Date() : null,
          lastFailureAt: ok ? null : new Date(),
          lastError: ok ? null : (error ?? null),
          consecutiveFailures: ok ? 0 : 1,
        })
        .onConflictDoUpdate({
          target: providerStatus.provider,
          set: ok
            ? { lastSuccessAt: new Date(), consecutiveFailures: 0 }
            : {
                lastFailureAt: new Date(),
                lastError: error ?? null,
                consecutiveFailures: sql`${providerStatus.consecutiveFailures} + 1`,
              },
        });
    } catch {
      // ignoré
    }
  })();
}

export function reportSuccess(id: string, kind: string): void {
  const health = memory.get(id);
  if (health && health.failures > 0) memory.set(id, { failures: 0, openUntil: 0 });
  persist(id, kind, true);
}

export function reportFailure(id: string, kind: string, error: string): void {
  const health = memory.get(id) ?? { failures: 0, openUntil: 0 };
  health.failures += 1;
  if (health.failures >= FAILURE_THRESHOLD) health.openUntil = Date.now() + COOL_DOWN_MS;
  memory.set(id, health);
  persist(id, kind, false, error);
}
