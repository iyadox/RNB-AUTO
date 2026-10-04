"use server";

/**
 * Actions du parcours de demande. Le navigateur envoie des CHOIX, jamais un prix :
 * le serveur recalcule tout et vérifie chaque donnée.
 */
import { after } from "next/server";
import { z } from "zod";
import { phoneToE164 } from "@/core/format";
import type { ClientEstimate } from "@/core/quotes/client-view";
import { publicQuoteRequestSchema, submitRequestSchema } from "@/core/quotes/schema";
import type { QuoteRequestInput } from "@/core/quotes/types";
import { getDb } from "@/server/db/client";
import { createInterventionFromQuote } from "@/server/interventions/service";
import { notifyNewRequest } from "@/server/notifications/service";
import { issuePhotoToken } from "@/server/photos/service";
import { createEstimate, getQuote } from "@/server/quotes/service";
import { rateLimitByIp } from "@/server/security/rate-limit";
import { getPublicCatalog } from "@/server/site/catalog";

export type EstimateActionResult = { ok: true; estimate: ClientEstimate } | { ok: false; error: string };

export async function estimateAction(raw: unknown): Promise<EstimateActionResult> {
  const limit = await rateLimitByIp("estimation", 30, 600);
  if (!limit.ok) return { ok: false, error: "Trop d'estimations en peu de temps. Réessayez dans quelques minutes ou appelez-nous." };
  const parsed = publicQuoteRequestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Informations incomplètes." };
  try {
    const outcome = await createEstimate(parsed.data as QuoteRequestInput, { channel: "online", source: "web" });
    return { ok: true, estimate: outcome.client };
  } catch (error) {
    console.error("[estimation]", error);
    return { ok: false, error: "L'estimation n'a pas pu être calculée. Vous pouvez quand même nous appeler ou écrire sur WhatsApp." };
  }
}

export type SubmitActionResult =
  | { status: "created"; reference: string; phone: string; photoToken: string | null }
  | { status: "price_changed"; estimate: ClientEstimate }
  | { status: "error"; error: string; fieldErrors?: Record<string, string> };

const MIN_FILL_TIME_MS = 2500;

export async function submitRequestAction(raw: unknown): Promise<SubmitActionResult> {
  const limit = await rateLimitByIp("demande", 6, 600);
  if (!limit.ok) return { status: "error", error: "Trop de demandes envoyées. Appelez-nous directement, nous sommes là." };

  const parsed = submitRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", error: "Vérifiez les informations indiquées.", fieldErrors };
  }
  const data = parsed.data;
  // Robots : champ piège rempli ou formulaire envoyé en un éclair. On répond poliment sans rien créer.
  if (data.website || data.elapsedMs < MIN_FILL_TIME_MS) {
    return { status: "error", error: "Votre demande n'a pas pu être envoyée. Appelez-nous ou écrivez-nous sur WhatsApp." };
  }

  const db = await getDb();
  let quote = await getQuote(db, data.quoteId);
  if (!quote || quote.source !== "web" || quote.interventionId || Date.now() - quote.createdAt.getTime() > 24 * 3600 * 1000) {
    return { status: "error", error: "Cette estimation n'est plus valable. Recommencez la demande, cela ne prend qu'une minute." };
  }

  // Estimation expirée : recalcul. Si le prix change, le client le voit avant d'envoyer.
  if (quote.expiresAt.getTime() < Date.now()) {
    const fresh = await createEstimate(quote.input as QuoteRequestInput, { channel: "online", source: "web" });
    if (fresh.client.priceTtcCents !== quote.clientPriceTtcCents) {
      return { status: "price_changed", estimate: fresh.client };
    }
    quote = fresh.quoteId ? await getQuote(db, fresh.quoteId) : null;
    if (!quote) return { status: "error", error: "L'estimation n'a pas pu être mise à jour. Réessayez." };
  }

  const phone = phoneToE164(data.contact.phone) ?? data.contact.phone;
  const { intervention, photoToken } = await db.transaction(async (tx) => {
    const created = await createInterventionFromQuote(tx, quote, {
      source: "web",
      contact: { name: data.contact.name, phone, email: data.contact.email || null },
      vehicle: {
        brand: data.vehicle.brand || null,
        model: data.vehicle.model || null,
        plate: data.vehicle.plate ? data.vehicle.plate.toUpperCase() : null,
      },
      comment: data.comment || null,
      actor: { userId: null, label: "Client (site)" },
    });
    // Jeton temporaire pour ajouter des photos juste après (facultatif).
    return { intervention: created, photoToken: await issuePhotoToken(tx, created.id) };
  });

  const catalog = await getPublicCatalog();
  const input = quote.input as QuoteRequestInput;
  after(async () => {
    try {
      await notifyNewRequest({
        id: intervention.id,
        reference: intervention.reference,
        contactName: intervention.contactName,
        contactPhone: intervention.contactPhone,
        pickupAddress: intervention.pickupAddress,
        dropoffAddress: intervention.dropoffAddress,
        dropoffKind: intervention.dropoffKind,
        vehicleLabel: catalog.vehicles.find((v) => v.code === input.vehicleCategory)?.label ?? input.vehicleCategory,
        problemLabel:
          input.situations
            .map((code) => [...catalog.problems, ...catalog.states, ...catalog.details].find((s) => s.code === code)?.clientLabel ?? code)
            .join(", ") || "non précisé",
        estimatedPriceCents: intervention.estimatedPriceCents,
        afterRegulatedRoad: intervention.pickupAfterRegulatedRoad,
      });
    } catch (error) {
      console.error("[notification]", error);
    }
  });

  return { status: "created", reference: intervention.reference, phone: z.string().parse(intervention.contactPhone), photoToken };
}
