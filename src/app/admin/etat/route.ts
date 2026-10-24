/**
 * Veille des nouvelles demandes : petit résumé interrogé régulièrement par l'espace de gestion
 * (compteur dans l'onglet, alerte discrète). Réservé aux comptes connectés, jamais mis en cache.
 */
import { getCurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { watchSummary } from "@/server/interventions/dashboard";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Session expirée" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const summary = await watchSummary(await getDb());
  return Response.json(summary, { headers: { "Cache-Control": "private, no-store" } });
}
