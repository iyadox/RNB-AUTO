/**
 * Estimations : rassemble le contexte (tarifs en vigueur, dépôt, heure de Paris, carburant,
 * trois trajets), appelle le moteur pur, puis enregistre la photographie complète.
 * Le prix est TOUJOURS calculé ici, côté serveur.
 */
import { eq } from "drizzle-orm";
import { findHoliday } from "@/core/calendar/holidays";
import { addMinutesLocal, toParisLocal } from "@/core/calendar/paris";
import { computeQuote, HIDDEN_REASON_CLIENT_MESSAGES, type EngineInput, type PricingConfig, type QuoteResult } from "@/core/pricing";
import { clientIncludedLabels, type ClientEstimate } from "@/core/quotes/client-view";
import {
  SERVICE_HIDDEN_REASON_MESSAGES,
  type GeoPoint,
  type Place,
  type QuoteContext,
  type QuoteRequestInput,
  type ResolvedLeg,
  type ServiceHiddenReason,
} from "@/core/quotes/types";
import type { ConfigSnapshot } from "@/core/settings/snapshot";
import { getDb } from "@/server/db/client";
import { quotes, settings } from "@/server/db/schema";
import { currentFuelPrice } from "@/server/fuel/service";
import { computeLegs, geocodeBest, RoutingUnavailableError } from "@/server/geo/service";
import type { DbLike } from "@/server/settings/repository";
import { ensureConfigVersion, getLatestVersion, type ConfigVersion } from "@/server/settings/versions";

export type EstimateOptions = {
  channel: "online" | "admin";
  source: "web" | "simulator" | "phone" | "recalc";
  userId?: string | null;
  interventionId?: string | null;
  revision?: number;
  /** Essai sans enregistrer (simulateur) : réglages modifiés, aucune photographie enregistrée. */
  pricingOverride?: PricingConfig;
  /** Calculer sans enregistrer. */
  dryRun?: boolean;
};

export type EstimateOutcome = {
  quoteId: string | null;
  input: QuoteRequestInput;
  context: QuoteContext | null;
  result: QuoteResult | null;
  serviceReason: ServiceHiddenReason | null;
  client: ClientEstimate;
  version: Pick<ConfigVersion, "id" | "versionNumber">;
};

async function latestVersionOrThrow(db: DbLike): Promise<ConfigVersion> {
  const version = await getLatestVersion(db);
  if (!version) throw new Error("Aucune version des tarifs : lancez « npm run db:setup ».");
  return version;
}

/** Position du dépôt : géocodée automatiquement la première fois si elle n'est pas encore connue. */
async function resolveDepot(db: DbLike, version: ConfigVersion): Promise<{ point: GeoPoint | null; version: ConfigVersion }> {
  const depot = version.snapshot.depot;
  if (depot.lat !== null && depot.lng !== null) return { point: { lat: depot.lat, lng: depot.lng }, version };
  const found = await geocodeBest(depot.label);
  if (!found) return { point: null, version };
  await db
    .update(settings)
    .set({
      value: { ...depot, lat: found.lat, lng: found.lng, postcode: found.postcode, city: found.city, confirmed: false },
      updatedAt: new Date(),
    })
    .where(eq(settings.key, "company.depot"));
  const { version: updated } = await ensureConfigVersion(db, {
    summary: `Position du dépôt calculée automatiquement à partir de l'adresse « ${depot.label} » (à confirmer dans Paramètres).`,
  });
  return { point: { lat: found.lat, lng: found.lng }, version: updated };
}

async function resolvePlace(place: Place, near: GeoPoint | null): Promise<Place | null> {
  if (place.lat !== null && place.lng !== null) return place;
  const found = await geocodeBest(place.label, near);
  if (!found) return null;
  return { ...place, label: found.label, lat: found.lat, lng: found.lng, postcode: found.postcode, city: found.city };
}

function legsForEngine(legs: { emptyOut: ResolvedLeg; loaded: ResolvedLeg | null; emptyBack: ResolvedLeg }): EngineInput["legs"] {
  const pick = (leg: ResolvedLeg) => ({ km: leg.km, minutes: leg.minutes });
  return { emptyOut: pick(legs.emptyOut), loaded: legs.loaded ? pick(legs.loaded) : null, emptyBack: pick(legs.emptyBack) };
}

function emptyClient(message: string, serviceKind: ClientEstimate["serviceKind"]): ClientEstimate {
  return {
    quoteId: null,
    priceTtcCents: null,
    message,
    includedLabels: [],
    vehicleTripKm: null,
    approachKm: null,
    serviceKind,
    validUntil: null,
  };
}

export async function createEstimate(rawInput: QuoteRequestInput, options: EstimateOptions): Promise<EstimateOutcome> {
  const db = await getDb();
  let version = await latestVersionOrThrow(db);
  let input: QuoteRequestInput = structuredClone(rawInput);
  const snapshot = (): ConfigSnapshot => version.snapshot;
  const serviceKind: ClientEstimate["serviceKind"] =
    input.dropoff.kind === "on_site" ? "on_site" : input.dropoff.kind === "address" ? "tow" : "unknown";
  const now = new Date();
  let serviceReason: ServiceHiddenReason | null = null;
  let context: QuoteContext | null = null;
  let result: QuoteResult | null = null;

  const computeAll = async () => {
    if (options.channel === "online" && !snapshot().estimate.enabled) {
      serviceReason = "estimate_disabled";
      return;
    }
    const depot = await resolveDepot(db, version);
    version = depot.version;
    if (!depot.point) {
      serviceReason = "depot_unknown";
      return;
    }
    const pickup = await resolvePlace(input.pickup, depot.point);
    if (!pickup) {
      serviceReason = "address_unresolved";
      return;
    }
    input = { ...input, pickup: { ...input.pickup, ...pickup } };
    let dropoffPoint: GeoPoint | null = null;
    if (input.dropoff.kind === "unknown") {
      serviceReason = "destination_unknown";
      return;
    }
    if (input.dropoff.kind === "address") {
      const dropoff = await resolvePlace(input.dropoff.place, depot.point);
      if (!dropoff) {
        serviceReason = "address_unresolved";
        return;
      }
      input = { ...input, dropoff: { kind: "address", place: dropoff } };
      dropoffPoint = { lat: dropoff.lat as number, lng: dropoff.lng as number };
    }

    // Trajets : forcés (simulateur) ou calculés par le service d'itinéraires.
    let legs: QuoteContext["legs"];
    const forced = input.overrides?.legs;
    if (forced) {
      const manual = (leg: { km: number; minutes: number }): ResolvedLeg => ({ ...leg, provider: "saisie manuelle", fromCache: false });
      legs = { emptyOut: manual(forced.emptyOut), loaded: forced.loaded ? manual(forced.loaded) : null, emptyBack: manual(forced.emptyBack) };
    } else {
      try {
        legs = await computeLegs({
          depot: depot.point,
          pickup: { lat: pickup.lat as number, lng: pickup.lng as number },
          dropoff: dropoffPoint,
          optimization: snapshot().routing.optimization,
        });
      } catch (error) {
        if (!(error instanceof RoutingUnavailableError)) throw error;
        serviceReason = "routing_unavailable";
        context = {
          computedAt: now.toISOString(),
          local: { date: null, time: "00:00", isoWeekday: 1, publicHoliday: null },
          depot: { label: snapshot().depot.label, ...depot.point },
          legs: null,
          fuel: { priceTtcMillis: 0, source: "manual", observedAt: null, origin: "" },
          routingError: error.message,
        };
        return;
      }
    }

    // Heure de Paris (ou moment simulé), jours fériés.
    let local: QuoteContext["local"];
    if (input.when.kind === "simulated") {
      local = {
        date: null,
        time: input.when.time,
        isoWeekday: input.when.isoWeekday,
        publicHoliday: input.when.holiday ? "Jour férié" : null,
      };
    } else {
      let moment = toParisLocal(now);
      if (snapshot().calendar.referenceTime === "arrival") moment = addMinutesLocal(moment, legs.emptyOut.minutes);
      local = {
        date: moment.date,
        time: moment.time,
        isoWeekday: moment.isoWeekday,
        publicHoliday: findHoliday(moment.date, snapshot().calendar.holidays)?.label ?? null,
      };
    }

    const fuel = input.overrides?.fuelPriceTtcMillis
      ? { priceTtcMillis: input.overrides.fuelPriceTtcMillis, source: "override" as const, observedAt: null, origin: "Prix saisi pour ce calcul" }
      : await currentFuelPrice(db, snapshot().fuel);

    context = {
      computedAt: now.toISOString(),
      local,
      depot: { label: snapshot().depot.label, ...depot.point },
      legs,
      fuel,
      routingError: null,
    };

    result = computeQuote(
      {
        serviceKind: input.dropoff.kind === "on_site" ? "on_site" : "tow",
        vehicleCategory: input.vehicleCategory,
        situations: input.situations,
        legs: legsForEngine(legs),
        local: { isoWeekday: local.isoWeekday, time: local.time, publicHoliday: local.publicHoliday },
        fuelPriceTtcMillis: fuel.priceTtcMillis,
        channel: options.channel,
        pickupPostcode: pickup.postcode,
      },
      options.pricingOverride ?? snapshot().pricing,
    );
  };

  await computeAll();

  const finalResult = result as QuoteResult | null;
  const finalContext = context as QuoteContext | null;
  const reason = serviceReason as ServiceHiddenReason | null;
  const engineHidden = finalResult?.flags.hiddenReasons[0] ?? null;
  const validUntil = new Date(now.getTime() + snapshot().estimate.validityMinutes * 60_000);

  let client: ClientEstimate;
  if (reason) {
    client = emptyClient(SERVICE_HIDDEN_REASON_MESSAGES[reason], serviceKind);
  } else if (finalResult && engineHidden) {
    client = {
      ...emptyClient(HIDDEN_REASON_CLIENT_MESSAGES[engineHidden], serviceKind),
      vehicleTripKm: finalResult.client.vehicleTripKm,
      approachKm: finalResult.client.approachKm,
    };
  } else if (finalResult) {
    client = {
      quoteId: null,
      priceTtcCents: finalResult.client.priceTtcCents,
      message: null,
      includedLabels: clientIncludedLabels(finalResult, snapshot().estimate.showSupplementLabels),
      vehicleTripKm: finalResult.client.vehicleTripKm,
      approachKm: finalResult.client.approachKm,
      serviceKind,
      validUntil: validUntil.toISOString(),
    };
  } else {
    client = emptyClient(SERVICE_HIDDEN_REASON_MESSAGES.routing_unavailable, serviceKind);
  }

  let quoteId: string | null = null;
  if (!options.dryRun && !options.pricingOverride) {
    const [row] = await db
      .insert(quotes)
      .values({
        interventionId: options.interventionId ?? null,
        revision: options.revision ?? 1,
        source: options.source,
        status: "estimated",
        input,
        context: finalContext,
        result: finalResult,
        hiddenReason: reason ?? (engineHidden ? engineHidden : null),
        configVersionId: version.id,
        engineVersion: finalResult?.engineVersion ?? null,
        priceTtcCents: finalResult?.totals.priceTtcCents ?? null,
        priceHtCents: finalResult?.totals.priceHtCents ?? null,
        clientPriceTtcCents: client.priceTtcCents,
        internalCostCents: finalResult?.totals.internalCostCents ?? null,
        marginCents: finalResult?.totals.marginCents ?? null,
        kmTotal: finalResult?.km.total ?? null,
        expiresAt: validUntil,
        createdBy: options.userId ?? null,
      })
      .returning({ id: quotes.id });
    quoteId = row?.id ?? null;
  }
  client = { ...client, quoteId };

  return {
    quoteId,
    input,
    context: finalContext,
    result: finalResult,
    serviceReason: reason,
    client,
    version: { id: version.id, versionNumber: version.versionNumber },
  };
}

export async function getQuote(db: DbLike, id: string) {
  const [row] = await db.select().from(quotes).where(eq(quotes.id, id)).limit(1);
  return row ?? null;
}
