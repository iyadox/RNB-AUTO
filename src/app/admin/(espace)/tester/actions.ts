"use server";

/**
 * Simulateur « Tester mes tarifs » et saisie d'une demande pendant un appel.
 * Chaque action vérifie la session. Le calcul est toujours fait par le serveur.
 */
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { computeQuote, type PricingConfig, type QuoteResult } from "@/core/pricing";
import type { ClientEstimate } from "@/core/quotes/client-view";
import { contactSchema, quoteRequestSchema, vehicleDetailsSchema } from "@/core/quotes/schema";
import { SERVICE_HIDDEN_REASON_MESSAGES, type QuoteContext, type QuoteRequestInput, type ReferenceScenario } from "@/core/quotes/types";
import { AuthError, requireAdminAction } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { referenceTrips } from "@/server/db/schema";
import { changeStatus, createInterventionFromQuote } from "@/server/interventions/service";
import { createEstimate, getQuote } from "@/server/quotes/service";
import { getVersionById } from "@/server/settings/versions";

/** Valeurs d'essai : jamais enregistrées, seulement comparées au calcul réel. */
const trialSchema = z.object({
  minimumCents: z.number().int().min(0).max(500_000).optional(),
  fuelPriceMillis: z.number().int().min(100).max(10_000).optional(),
  rules: z.array(z.object({ code: z.string().regex(/^[a-z0-9_.]{1,80}$/), value: z.number().int().min(0).max(500_000) })).max(30),
});

export type TrialValues = z.infer<typeof trialSchema>;

const simulateSchema = z.object({
  request: quoteRequestSchema,
  trial: trialSchema.nullable(),
  source: z.enum(["simulator", "phone", "recalc"]),
});

export type SimulationView = {
  quoteId: string | null;
  input: QuoteRequestInput;
  context: QuoteContext | null;
  result: QuoteResult | null;
  client: ClientEstimate;
  serviceMessage: string | null;
  versionNumber: number;
  minimum: PricingConfig["minimumPrice"] | null;
  trialResult: QuoteResult | null;
};

/** Applique les valeurs d'essai à une copie des tarifs, selon le type de chaque règle. */
function applyTrial(config: PricingConfig, trial: TrialValues): PricingConfig {
  const next = structuredClone(config);
  if (trial.minimumCents !== undefined) next.minimumPrice = { enabled: trial.minimumCents > 0, amountCents: trial.minimumCents };
  for (const { code, value } of trial.rules) {
    const rule = next.rules.find((r) => r.code === code);
    if (!rule) continue;
    const calc = rule.calculation;
    if (calc.kind === "fixed") rule.calculation = { ...calc, amountCents: value };
    else if (calc.kind === "per_km") rule.calculation = { ...calc, centsPerKm: value };
    else if (calc.kind === "percent") rule.calculation = { ...calc, rateBp: value };
    else continue;
    rule.enabled = value > 0;
  }
  return next;
}

export async function simulateAction(raw: unknown): Promise<{ ok: true; view: SimulationView } | { ok: false; message: string }> {
  try {
    const user = await requireAdminAction();
    const parsed = simulateSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Informations incomplètes." };
    const { request, trial, source } = parsed.data;
    const outcome = await createEstimate(request as QuoteRequestInput, { channel: "admin", source, userId: user.id });

    const db = await getDb();
    const version = await getVersionById(db, outcome.version.id);
    let trialResult: QuoteResult | null = null;
    if (trial && outcome.result && outcome.context?.legs) {
      if (version) {
        const legs = outcome.context.legs;
        trialResult = computeQuote(
          {
            serviceKind: outcome.input.dropoff.kind === "on_site" ? "on_site" : "tow",
            vehicleCategory: outcome.input.vehicleCategory,
            situations: outcome.input.situations,
            legs: {
              emptyOut: { km: legs.emptyOut.km, minutes: legs.emptyOut.minutes },
              loaded: legs.loaded ? { km: legs.loaded.km, minutes: legs.loaded.minutes } : null,
              emptyBack: { km: legs.emptyBack.km, minutes: legs.emptyBack.minutes },
            },
            local: {
              isoWeekday: outcome.context.local.isoWeekday,
              time: outcome.context.local.time,
              publicHoliday: outcome.context.local.publicHoliday,
            },
            fuelPriceTtcMillis: trial.fuelPriceMillis ?? outcome.context.fuel.priceTtcMillis,
            channel: "admin",
            pickupPostcode: outcome.input.pickup.postcode,
          },
          applyTrial(version.snapshot.pricing, trial),
        );
      }
    }

    return {
      ok: true,
      view: {
        quoteId: outcome.quoteId,
        input: outcome.input,
        context: outcome.context,
        result: outcome.result,
        client: outcome.client,
        serviceMessage: outcome.serviceReason ? SERVICE_HIDDEN_REASON_MESSAGES[outcome.serviceReason] : null,
        versionNumber: outcome.version.versionNumber,
        minimum: version?.snapshot.pricing.minimumPrice ?? null,
        trialResult,
      },
    };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: error.message };
    console.error("[simulateur]", error);
    return { ok: false, message: "Le calcul n'a pas pu aboutir. Vérifiez les adresses ou saisissez les kilomètres à la main." };
  }
}

const phoneRequestSchema = z.object({
  quoteId: z.uuid(),
  contact: contactSchema,
  vehicle: vehicleDetailsSchema,
  comment: z.string().trim().max(1000),
  accept: z.boolean(),
});

export async function createPhoneRequestAction(raw: unknown): Promise<{ ok: true; id: string; reference: string } | { ok: false; message: string; fieldErrors?: Record<string, string> }> {
  try {
    const user = await requireAdminAction();
    const parsed = phoneRequestSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
      return { ok: false, message: "Vérifiez les coordonnées du client.", fieldErrors };
    }
    const data = parsed.data;
    const db = await getDb();
    const quote = await getQuote(db, data.quoteId);
    if (!quote || quote.interventionId) return { ok: false, message: "Ce calcul a déjà servi ou n'existe plus : recalculez." };
    const actor = { userId: user.id, label: user.name };
    const intervention = await db.transaction(async (tx) => {
      const created = await createInterventionFromQuote(tx, quote, {
        source: "phone",
        contact: { name: data.contact.name, phone: data.contact.phone, email: data.contact.email || null },
        vehicle: { brand: data.vehicle.brand || null, model: data.vehicle.model || null, plate: data.vehicle.plate ? data.vehicle.plate.toUpperCase() : null },
        comment: data.comment || null,
        actor,
      });
      if (data.accept) await changeStatus(tx, created.id, "accepted", actor);
      return created;
    });
    revalidatePath("/admin");
    return { ok: true, id: intervention.id, reference: intervention.reference };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: error.message };
    console.error("[demande téléphone]", error);
    return { ok: false, message: "La demande n'a pas pu être créée. Réessayez." };
  }
}

export async function saveReferenceTripAction(raw: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await requireAdminAction();
    const parsed = z.object({ quoteId: z.uuid(), name: z.string().trim().min(3).max(120) }).safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Donnez un nom à ce trajet type." };
    const db = await getDb();
    const quote = await getQuote(db, parsed.data.quoteId);
    const context = quote?.context as QuoteContext | null;
    const input = quote?.input as QuoteRequestInput | undefined;
    if (!quote || !context?.legs || !input) return { ok: false, message: "Ce calcul ne contient pas de trajets." };
    const scenario: ReferenceScenario = {
      serviceKind: input.dropoff.kind === "on_site" ? "on_site" : "tow",
      vehicleCategory: input.vehicleCategory,
      situations: input.situations,
      legs: {
        emptyOut: { km: context.legs.emptyOut.km, minutes: context.legs.emptyOut.minutes },
        loaded: context.legs.loaded ? { km: context.legs.loaded.km, minutes: context.legs.loaded.minutes } : null,
        emptyBack: { km: context.legs.emptyBack.km, minutes: context.legs.emptyBack.minutes },
      },
      isoWeekday: context.local.isoWeekday,
      time: context.local.time,
      holiday: context.local.publicHoliday !== null,
    };
    await db.insert(referenceTrips).values({ name: parsed.data.name, scenario, sortOrder: 1000 });
    revalidatePath("/admin/tester");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, message: error.message };
    return { ok: false, message: "Enregistrement impossible." };
  }
}

export async function deleteReferenceTripAction(id: string): Promise<{ ok: boolean }> {
  try {
    await requireAdminAction();
    if (!z.uuid().safeParse(id).success) return { ok: false };
    const db = await getDb();
    await db.update(referenceTrips).set({ active: false }).where(eq(referenceTrips.id, id));
    revalidatePath("/admin/tester");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
