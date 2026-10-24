/**
 * Lecture du suivi client : demande retrouvée par son lien, historique des statuts, photos déjà
 * envoyées. Renvoie uniquement la vue publique (`TrackingView`), jamais la ligne de la base.
 */
import { count, eq, sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import { interventionPhotos } from "@/server/db/schema";
import { getStatusHistory } from "@/server/interventions/service";
import { getPublicCatalog } from "@/server/site/catalog";
import { findTrackedIntervention } from "./token";
import { buildTrackingView, type TrackingView } from "./view";

export type TrackingPageData =
  | {
      ok: true;
      view: TrackingView;
      /** Photos envoyées par le client (texte « 2 déjà reçues »). */
      clientPhotos: number;
      /** Toutes les photos de la demande (client et RNB AUTO) : c'est ce total que limite le maximum. */
      totalPhotos: number;
    }
  | { ok: false; reason: "invalid" | "expired" | "unavailable" };

export async function loadTracking(reference: string, token: string): Promise<TrackingPageData> {
  try {
    const db = await getDb();
    const found = await findTrackedIntervention(db, reference, token);
    if (!found.ok) return found;
    const it = found.intervention;
    const [history, catalog, photos] = await Promise.all([
      getStatusHistory(db, it.id),
      getPublicCatalog(),
      db
        .select({ total: count(), client: sql<number>`count(*) filter (where ${interventionPhotos.uploadedBy} = 'client')`.mapWith(Number) })
        .from(interventionPhotos)
        .where(eq(interventionPhotos.interventionId, it.id)),
    ]);
    const view = buildTrackingView(
      {
        reference: it.reference,
        status: it.status,
        dropoffKind: it.dropoffKind,
        pickupCity: it.pickupCity,
        pickupPostcode: it.pickupPostcode,
        pickupAfterRegulatedRoad: it.pickupAfterRegulatedRoad,
        dropoffCity: it.dropoffCity,
        dropoffPostcode: it.dropoffPostcode,
        vehicleLabel: catalog.vehicles.find((v) => v.code === it.vehicleCategory)?.label ?? null,
        estimatedPriceCents: it.estimatedPriceCents,
        confirmedPriceCents: it.confirmedPriceCents,
        createdAt: it.createdAt,
        updatedAt: it.updatedAt,
        completedAt: it.completedAt,
        cancelledAt: it.cancelledAt,
      },
      history,
    );
    return { ok: true, view, clientPhotos: photos[0]?.client ?? 0, totalPhotos: photos[0]?.total ?? 0 };
  } catch (error) {
    console.error("[suivi]", error);
    return { ok: false, reason: "unavailable" };
  }
}
