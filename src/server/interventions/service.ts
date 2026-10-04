/** Demandes d'intervention : création, statuts, prix confirmé, ajustements, journal. */
import { and, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { phoneToE164 } from "@/core/format";
import {
  canTransition,
  isTerminal,
  TIMESTAMP_FIELDS,
  type InterventionStatus,
} from "@/core/interventions/status";
import { applyAdjustments, type ManualAdjustment, type PricingConfig, type QuoteResult } from "@/core/pricing";
import type { QuoteRequestInput } from "@/core/quotes/types";
import {
  counters,
  customers,
  interventionAdjustments,
  interventionEvents,
  interventions,
  quotes,
} from "@/server/db/schema";
import type { DbLike } from "@/server/settings/repository";
import { getVersionById } from "@/server/settings/versions";

export type Intervention = typeof interventions.$inferSelect;
export type QuoteRow = typeof quotes.$inferSelect;
export type Actor = { userId: string | null; label: string };

async function nextReference(db: DbLike): Promise<string> {
  const year = new Date().getFullYear();
  const [row] = await db
    .insert(counters)
    .values({ key: `intervention:${year}`, value: 1 })
    .onConflictDoUpdate({ target: counters.key, set: { value: sql`${counters.value} + 1` } })
    .returning({ value: counters.value });
  return `RNB-${year}-${String(row?.value ?? 1).padStart(5, "0")}`;
}

async function findOrCreateCustomer(db: DbLike, contact: { name: string; phone: string; email: string | null }) {
  const [existing] = await db.select().from(customers).where(eq(customers.phone, contact.phone)).limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(customers)
    .values({ name: contact.name, phone: contact.phone, email: contact.email })
    .returning({ id: customers.id });
  return created?.id ?? null;
}

export async function addEvent(
  db: DbLike,
  interventionId: string,
  actor: Actor,
  event: { type: string; message?: string; fromStatus?: string | null; toStatus?: string | null; data?: Record<string, unknown> },
) {
  await db.insert(interventionEvents).values({
    interventionId,
    byUserId: actor.userId,
    byLabel: actor.label,
    type: event.type,
    message: event.message ?? null,
    fromStatus: event.fromStatus ?? null,
    toStatus: event.toStatus ?? null,
    data: event.data ?? null,
  });
}

/** Crée l'intervention à partir d'une estimation enregistrée (site, appel, simulateur). */
export async function createInterventionFromQuote(
  db: DbLike,
  quote: QuoteRow,
  params: {
    source: "web" | "phone" | "admin";
    contact: { name: string; phone: string; email: string | null };
    vehicle: { brand: string | null; model: string | null; plate: string | null };
    comment: string | null;
    actor: Actor;
    status?: InterventionStatus;
  },
): Promise<Intervention> {
  const input = quote.input as QuoteRequestInput;
  const phone = phoneToE164(params.contact.phone) ?? params.contact.phone;
  const customerId = await findOrCreateCustomer(db, { ...params.contact, phone });
  const reference = await nextReference(db);
  const dropoff = input.dropoff;
  const [created] = await db
    .insert(interventions)
    .values({
      reference,
      status: params.status ?? "new",
      source: params.source,
      customerId,
      contactName: params.contact.name,
      contactPhone: phone,
      contactEmail: params.contact.email,
      pickupAddress: input.pickup.label,
      pickupLat: input.pickup.lat,
      pickupLng: input.pickup.lng,
      pickupPostcode: input.pickup.postcode,
      pickupCity: input.pickup.city,
      pickupAfterRegulatedRoad: input.pickup.afterRegulatedRoad,
      handoverNote: input.pickup.handoverNote,
      dropoffKind: dropoff.kind,
      dropoffAddress: dropoff.kind === "address" ? dropoff.place.label : null,
      dropoffLat: dropoff.kind === "address" ? dropoff.place.lat : null,
      dropoffLng: dropoff.kind === "address" ? dropoff.place.lng : null,
      dropoffPostcode: dropoff.kind === "address" ? dropoff.place.postcode : null,
      dropoffCity: dropoff.kind === "address" ? dropoff.place.city : null,
      vehicleCategory: input.vehicleCategory,
      vehicleBrand: params.vehicle.brand,
      vehicleModel: params.vehicle.model,
      vehiclePlate: params.vehicle.plate,
      situations: input.situations,
      clientComment: params.comment,
      currentQuoteId: quote.id,
      estimatedPriceCents: quote.clientPriceTtcCents,
      acceptedAt: params.status === "accepted" ? new Date() : null,
    })
    .returning();
  if (!created) throw new Error("Impossible de créer la demande.");
  await db.update(quotes).set({ interventionId: created.id, status: "used" }).where(eq(quotes.id, quote.id));
  await addEvent(db, created.id, params.actor, {
    type: "created",
    toStatus: created.status,
    message:
      params.source === "web"
        ? "Demande reçue depuis le site."
        : params.source === "phone"
          ? "Demande saisie pendant un appel."
          : "Demande créée dans l'administration.",
  });
  return created;
}

export type InterventionFilters = { status?: InterventionStatus | "active" | "all"; search?: string; limit?: number };

export async function listInterventions(db: DbLike, filters: InterventionFilters = {}) {
  const conditions: SQL[] = [];
  if (!filters.status || filters.status === "active") {
    conditions.push(sql`${interventions.status} not in ('completed', 'cancelled')`);
  } else if (filters.status !== "all") {
    conditions.push(eq(interventions.status, filters.status));
  }
  const search = filters.search?.trim();
  if (search) {
    const like = `%${search.replace(/[%_]/g, "")}%`;
    const digits = search.replace(/\D/g, "");
    const searchConditions: SQL[] = [
      ilike(interventions.reference, like),
      ilike(interventions.contactName, like),
      ilike(interventions.pickupAddress, like),
      ilike(interventions.dropoffAddress, like),
      ilike(interventions.vehicleBrand, like),
      ilike(interventions.vehicleModel, like),
      ilike(interventions.vehiclePlate, like),
    ];
    if (digits.length >= 4) searchConditions.push(ilike(interventions.contactPhone, `%${digits.slice(-9)}%`));
    const combined = or(...searchConditions);
    if (combined) conditions.push(combined);
  }
  return db
    .select()
    .from(interventions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(interventions.createdAt))
    .limit(filters.limit ?? 100);
}

export async function countByStatus(db: DbLike): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: interventions.status, n: sql<number>`count(*)::int` })
    .from(interventions)
    .groupBy(interventions.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

export async function getIntervention(db: DbLike, id: string): Promise<Intervention | null> {
  const [row] = await db.select().from(interventions).where(eq(interventions.id, id)).limit(1);
  return row ?? null;
}

export async function getInterventionDetail(db: DbLike, id: string) {
  const intervention = await getIntervention(db, id);
  if (!intervention) return null;
  const [quoteRows, adjustments, events] = await Promise.all([
    db.select().from(quotes).where(eq(quotes.interventionId, id)).orderBy(desc(quotes.revision), desc(quotes.createdAt)),
    db.select().from(interventionAdjustments).where(eq(interventionAdjustments.interventionId, id)).orderBy(interventionAdjustments.createdAt),
    db.select().from(interventionEvents).where(eq(interventionEvents.interventionId, id)).orderBy(desc(interventionEvents.at)),
  ]);
  const current = quoteRows.find((q) => q.id === intervention.currentQuoteId) ?? quoteRows[0] ?? null;
  let pricing: PricingConfig | null = null;
  if (current?.configVersionId) {
    const version = await getVersionById(db, current.configVersionId);
    pricing = version?.snapshot.pricing ?? null;
  }
  const manual: ManualAdjustment[] = adjustments.map((a) => ({
    effect: a.effect as ManualAdjustment["effect"],
    mode: a.mode as ManualAdjustment["mode"],
    value: a.value,
    reason: a.reason,
  }));
  const adjusted =
    current?.result && pricing ? applyAdjustments(current.result as QuoteResult, manual, pricing) : null;
  return { intervention, quotes: quoteRows, current, pricing, adjustments, adjusted, events };
}

export class InterventionError extends Error {}

export async function changeStatus(
  db: DbLike,
  id: string,
  to: InterventionStatus,
  actor: Actor,
  options: { force?: boolean; cancelReason?: string | null } = {},
): Promise<Intervention> {
  const intervention = await getIntervention(db, id);
  if (!intervention) throw new InterventionError("Demande introuvable.");
  const from = intervention.status as InterventionStatus;
  if (!canTransition(from, to, options.force ?? false)) {
    throw new InterventionError(isTerminal(from) ? "Cette demande est déjà clôturée." : "Ce changement de statut n'est pas possible.");
  }
  if (to === "cancelled" && !options.cancelReason) throw new InterventionError("Indiquez le motif d'annulation.");
  const timestampField = TIMESTAMP_FIELDS[to];
  const patch: Partial<Intervention> = { status: to, updatedAt: new Date() };
  if (timestampField) (patch as Record<string, unknown>)[timestampField] = new Date();
  if (to === "cancelled") patch.cancelReason = options.cancelReason ?? null;
  // Accepter fige le prix s'il n'a pas encore été confirmé.
  if (to === "accepted" && intervention.confirmedPriceCents === null) {
    const detail = await getInterventionDetail(db, id);
    const price = detail?.adjusted?.priceTtcCents ?? detail?.current?.priceTtcCents ?? null;
    if (price !== null) {
      patch.confirmedPriceCents = price;
      patch.confirmedAt = new Date();
      patch.confirmedBy = actor.userId;
    }
  }
  const [updated] = await db.update(interventions).set(patch).where(eq(interventions.id, id)).returning();
  await addEvent(db, id, actor, {
    type: "status",
    fromStatus: from,
    toStatus: to,
    message: to === "cancelled" ? `Motif : ${options.cancelReason}` : options.force ? "Étape(s) sautée(s) avec confirmation." : undefined,
  });
  if (!updated) throw new InterventionError("Mise à jour impossible.");
  return updated;
}

export async function confirmPrice(db: DbLike, id: string, actor: Actor): Promise<number> {
  const detail = await getInterventionDetail(db, id);
  if (!detail) throw new InterventionError("Demande introuvable.");
  const price = detail.adjusted?.priceTtcCents ?? detail.current?.priceTtcCents;
  if (price === null || price === undefined) throw new InterventionError("Aucun prix calculé : recalculez d'abord.");
  await db
    .update(interventions)
    .set({ confirmedPriceCents: price, confirmedAt: new Date(), confirmedBy: actor.userId, updatedAt: new Date() })
    .where(eq(interventions.id, id));
  await addEvent(db, id, actor, { type: "price", message: "Prix confirmé.", data: { priceTtcCents: price } });
  return price;
}

export async function addAdjustment(db: DbLike, id: string, adjustment: ManualAdjustment, actor: Actor) {
  await db.insert(interventionAdjustments).values({ interventionId: id, ...adjustment, createdBy: actor.userId });
  await db.update(interventions).set({ confirmedPriceCents: null, confirmedAt: null, updatedAt: new Date() }).where(eq(interventions.id, id));
  await addEvent(db, id, actor, { type: "adjustment", message: adjustment.reason, data: { ...adjustment } });
}

export async function removeAdjustment(db: DbLike, interventionId: string, adjustmentId: string, actor: Actor) {
  const [removed] = await db
    .delete(interventionAdjustments)
    .where(and(eq(interventionAdjustments.id, adjustmentId), eq(interventionAdjustments.interventionId, interventionId)))
    .returning();
  if (removed) {
    await db.update(interventions).set({ confirmedPriceCents: null, confirmedAt: null, updatedAt: new Date() }).where(eq(interventions.id, interventionId));
    await addEvent(db, interventionId, actor, { type: "adjustment", message: `Ajustement retiré : ${removed.reason}` });
  }
}

export async function setInternalNotes(db: DbLike, id: string, notes: string, actor: Actor) {
  await db.update(interventions).set({ internalNotes: notes, updatedAt: new Date() }).where(eq(interventions.id, id));
  await addEvent(db, id, actor, { type: "note", message: "Notes internes mises à jour." });
}

/** Rattache une nouvelle révision d'estimation (recalcul, changement de situation). */
export async function attachQuoteRevision(db: DbLike, interventionId: string, quoteId: string, actor: Actor, message: string) {
  await db.update(quotes).set({ status: "superseded" }).where(and(eq(quotes.interventionId, interventionId), eq(quotes.status, "used")));
  await db.update(quotes).set({ interventionId, status: "used" }).where(eq(quotes.id, quoteId));
  await db
    .update(interventions)
    .set({ currentQuoteId: quoteId, confirmedPriceCents: null, confirmedAt: null, updatedAt: new Date() })
    .where(eq(interventions.id, interventionId));
  await addEvent(db, interventionId, actor, { type: "recalculated", message });
}

export async function nextRevisionNumber(db: DbLike, interventionId: string): Promise<number> {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${quotes.revision}), 0)::int` })
    .from(quotes)
    .where(eq(quotes.interventionId, interventionId));
  return (row?.max ?? 0) + 1;
}

/** Estimations expirées jamais utilisées : supprimées au bout de 30 jours (données personnelles). */
export async function purgeOldEstimates(db: DbLike) {
  await db
    .delete(quotes)
    .where(and(isNull(quotes.interventionId), inArray(quotes.status, ["estimated", "expired"]), sql`${quotes.createdAt} < now() - interval '30 days'`));
}
