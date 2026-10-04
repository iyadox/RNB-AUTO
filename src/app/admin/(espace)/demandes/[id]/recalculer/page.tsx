import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { isTerminal, type InterventionStatus } from "@/core/interventions/status";
import type { Place, QuoteContext, QuoteRequestInput } from "@/core/quotes/types";
import { QuoteSimulator, type SimulatorInitial } from "@/components/admin/quote-simulator";
import { Alert, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getInterventionDetail } from "@/server/interventions/service";
import { loadSimulatorData } from "@/server/pricing-admin/simulator";

export const metadata: Metadata = { title: "Nouveau calcul" };

export default async function RecalculatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await getDb();
  const detail = await getInterventionDetail(db, id);
  if (!detail) notFound();
  const it = detail.intervention;
  if (isTerminal(it.status as InterventionStatus)) redirect(`/admin/demandes/${id}`);
  const data = await loadSimulatorData(db);

  const input = (detail.current?.input ?? null) as QuoteRequestInput | null;
  const context = (detail.current?.context ?? null) as QuoteContext | null;
  const pickup: Place = {
    label: it.pickupAddress,
    lat: it.pickupLat,
    lng: it.pickupLng,
    postcode: it.pickupPostcode,
    city: it.pickupCity,
    source: "admin",
  };
  const dropoff: Place | null =
    it.dropoffKind === "address" && it.dropoffAddress
      ? { label: it.dropoffAddress, lat: it.dropoffLat, lng: it.dropoffLng, postcode: it.dropoffPostcode, city: it.dropoffCity, source: "admin" }
      : null;
  const manual = context?.legs && context.legs.emptyOut.provider === "saisie manuelle" ? context.legs : null;
  const initial: SimulatorInitial = {
    pickup,
    onHighway: it.pickupAfterRegulatedRoad,
    handoverNote: it.handoverNote ?? "",
    dropoffMode: it.dropoffKind === "address" ? "address" : it.dropoffKind === "on_site" ? "on_site" : "unknown",
    dropoff,
    vehicle: it.vehicleCategory,
    situations: it.situations,
    // Par défaut, on garde le moment de la demande (mêmes majorations).
    when: context ? { kind: "simulated", isoWeekday: context.local.isoWeekday, time: context.local.time, holiday: context.local.publicHoliday !== null } : { kind: "now" },
    manualLegs: manual
      ? {
          emptyOut: { km: manual.emptyOut.km, minutes: manual.emptyOut.minutes },
          loaded: manual.loaded ? { km: manual.loaded.km, minutes: manual.loaded.minutes } : null,
          emptyBack: { km: manual.emptyBack.km, minutes: manual.emptyBack.minutes },
        }
      : input?.overrides?.legs
        ? input.overrides.legs
        : null,
  };

  return (
    <>
      <PageHeader
        back={{ href: `/admin/demandes/${id}`, label: it.reference }}
        title="Nouveau calcul"
        description="Modifiez ce qui a changé (destination, véhicule, situation…) puis calculez. Le calcul précédent reste conservé."
      />
      {context ? (
        <div className="mb-5">
          <Alert tone="info">Le jour et l&apos;heure de la demande sont repris pour garder les mêmes majorations. Choisissez « Maintenant » si besoin.</Alert>
        </div>
      ) : null}
      <QuoteSimulator
        mode="recalc"
        interventionId={id}
        initial={initial}
        vehicles={data.vehicles}
        situations={data.situations}
        now={data.now}
        depot={data.depot}
        fuelPriceMillis={data.fuel.priceTtcMillis}
        minimum={data.minimum}
      />
    </>
  );
}
