import type { Metadata } from "next";
import { formatEuros, formatKm, WEEKDAY_LABELS } from "@/core/format";
import { MarginBadge } from "@/components/admin/quote-breakdown";
import { QuoteSimulator } from "@/components/admin/quote-simulator";
import { DeleteTripButton } from "@/components/admin/reference-trip-actions";
import { Alert, LinkButton, PageHeader, SectionTitle } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { isSimulationMode } from "@/server/geo/service";
import { loadReferenceTrips, loadSimulatorData } from "@/server/pricing-admin/simulator";

export const metadata: Metadata = { title: "Tester mes tarifs" };

export default async function SimulatorPage() {
  await requireAdmin();
  const db = await getDb();
  const data = await loadSimulatorData(db);
  const trips = await loadReferenceTrips(db, data);
  const vehicleLabel = (code: string) => data.vehicles.find((v) => v.code === code)?.label ?? code;

  return (
    <>
      <PageHeader
        title="Tester mes tarifs"
        description="Décrivez une intervention : vous voyez le prix exact que le site proposerait, avec tout le détail. Rien n'est envoyé au client."
        actions={
          <LinkButton href="/admin/tarifs" variant="secondary">
            <Icon name="euro" size={18} />
            Mes tarifs
          </LinkButton>
        }
      />
      {isSimulationMode() ? (
        <div className="mb-5">
          <Alert tone="danger" title="Mode simulation des trajets">
            Les distances sont approximatives tant que la variable GEO_PROVIDER vaut « simulation ».
          </Alert>
        </div>
      ) : null}

      <QuoteSimulator
        mode="simulator"
        vehicles={data.vehicles}
        situations={data.situations}
        now={data.now}
        depot={data.depot}
        fuelPriceMillis={data.fuel.priceTtcMillis}
        minimum={data.minimum}
        trialFields={data.trialFields}
      />

      <SectionTitle icon="list" description="Prix de chaque trajet type avec vos tarifs actuels. Ils servent à montrer l'effet d'un changement de tarif avant de l'enregistrer.">
        Vos trajets types
      </SectionTitle>
      {trips.length === 0 ? (
        <p className="text-asphalt-500">Aucun trajet type. Après un calcul, utilisez « Garder ce trajet comme exemple ».</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {trips.map((trip) => (
            <li key={trip.id} className="flex items-center gap-4 rounded-3xl border border-asphalt-200 bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold">{trip.name}</p>
                <p className="mt-0.5 text-sm text-asphalt-500">
                  {vehicleLabel(trip.scenario.vehicleCategory)} · {trip.scenario.serviceKind === "on_site" ? "sur place" : "remorquage"} ·{" "}
                  {formatKm(trip.scenario.legs.emptyOut.km + (trip.scenario.legs.loaded?.km ?? 0) + trip.scenario.legs.emptyBack.km)} ·{" "}
                  {WEEKDAY_LABELS[trip.scenario.isoWeekday].toLowerCase()} {trip.scenario.time}
                  {trip.scenario.holiday ? " (férié)" : ""}
                </p>
                {trip.result ? (
                  <div className="mt-2">
                    <MarginBadge level={trip.result.totals.marginLevel} />
                  </div>
                ) : null}
              </div>
              <p className="shrink-0 text-2xl font-extrabold tabular">{trip.result ? formatEuros(trip.result.totals.priceTtcCents) : "—"}</p>
              <DeleteTripButton id={trip.id} name={trip.name} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
