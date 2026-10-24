import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { phoneLink } from "@/core/contact";
import { formatDate, formatDateTime, formatEuros, formatTime } from "@/core/format";
import { googleMapsDirections, interventionSummary } from "@/core/interventions/links";
import { STATUS_META, type InterventionStatus } from "@/core/interventions/status";
import { PrintShareBar } from "@/components/admin/request-actions";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getInterventionDetail } from "@/server/interventions/service";
import { loadSettingsValues } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = { title: "Bon d'intervention" };

/** Information manquante : jamais inventée, signalée clairement. */
function Value({ value }: { value: string | null | undefined }) {
  return value && value.trim() ? <>{value}</> : <span className="font-extrabold text-red-700">À COMPLÉTER</span>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="mb-1.5 border-b-2 border-asphalt-900 pb-1 text-xs font-extrabold uppercase tracking-[0.14em]">{title}</h2>
      <div className="text-[0.95rem] leading-relaxed">{children}</div>
    </section>
  );
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="flex gap-3">
      <span className="w-32 shrink-0 text-asphalt-500">{label}</span>
      <span className="min-w-0 flex-1 break-words font-semibold">{children}</span>
    </p>
  );
}

export default async function InterventionSlipPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await getDb();
  const detail = await getInterventionDetail(db, id);
  if (!detail) notFound();
  const { intervention: it, pricing } = detail;
  const [values, latest] = await Promise.all([loadSettingsValues(db), pricing ? null : getLatestVersion(db)]);
  const catalog = pricing ?? latest?.snapshot.pricing ?? null;
  const vehicle = catalog?.vehicles.find((v) => v.code === it.vehicleCategory)?.label ?? it.vehicleCategory;
  const situations = it.situations.map((code) => catalog?.situations.find((s) => s.code === code)?.label ?? code);
  const status = it.status as InterventionStatus;
  const companyName = values["company.name"] || "RNB AUTO";
  const companyPhone = phoneLink(values["company.phone"]);
  const clientPhone = phoneLink(it.contactPhone);
  const destination = it.dropoffKind === "on_site" ? "Dépannage sur place" : (it.dropoffAddress ?? "À préciser");
  const vehicleText = [vehicle, [it.vehicleBrand, it.vehicleModel].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
  const price = it.confirmedPriceCents !== null ? formatEuros(it.confirmedPriceCents) : null;
  const mapsUrl = googleMapsDirections(
    it.dropoffKind === "address" && it.dropoffAddress ? { label: it.dropoffAddress, lat: it.dropoffLat, lng: it.dropoffLng } : { label: it.pickupAddress, lat: it.pickupLat, lng: it.pickupLng },
    it.dropoffKind === "address" && it.dropoffAddress ? { label: it.pickupAddress, lat: it.pickupLat, lng: it.pickupLng } : null,
  );
  const summary = interventionSummary({
    companyName,
    reference: it.reference,
    statusLabel: STATUS_META[status].label,
    createdAt: formatDateTime(it.createdAt),
    contactName: it.contactName,
    contactPhone: clientPhone?.display ?? it.contactPhone,
    pickup: it.pickupAddress,
    handoverNote: it.handoverNote,
    destination,
    vehicle: [vehicleText, it.vehiclePlate].filter(Boolean).join(" · "),
    situations,
    price,
    mapsUrl,
  });
  const steps: { label: string; at: Date | null }[] = [
    { label: "Demande", at: it.createdAt },
    { label: "Acceptée", at: it.acceptedAt },
    { label: "Départ", at: it.enRouteAt },
    { label: "Sur place", at: it.arrivedAt },
    ...(it.dropoffKind === "on_site" ? [] : [{ label: "Chargé", at: it.loadedAt }]),
    { label: "Terminée", at: it.completedAt },
  ];
  const legalLine = [values["legal.companyName"], values["legal.legalForm"]].filter((v) => v && v.trim()).join(" · ");

  return (
    <>
      <style>{"@page { size: A4; margin: 12mm; } @media print { html, body, .theme-admin { background: #fff !important; } }"}</style>
      <div className="mb-5 print:hidden">
        <Link href={`/admin/demandes/${it.id}`} className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-asphalt-500 hover:text-asphalt-900">
          <Icon name="arrowLeft" size={16} />
          Retour à la demande
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight">Bon d&apos;intervention</h1>
        <p className="mt-1 text-asphalt-500">À faire signer sur place, à imprimer ou à envoyer. Ce bon n&apos;est pas une facture.</p>
        <div className="mt-4 max-w-md">
          <PrintShareBar title={`Bon d'intervention ${it.reference}`} text={summary} />
        </div>
      </div>

      <article className="mx-auto max-w-[210mm] rounded-3xl border border-asphalt-200 bg-white p-6 text-asphalt-950 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-4 border-signal-500 pb-5">
          <div className="min-w-0">
            <p className="font-wide text-2xl leading-none">{companyName}</p>
            <p className="mt-1 text-sm text-asphalt-600">Dépannage · remorquage · assistance</p>
            <div className="mt-3 grid gap-0.5 text-xs text-asphalt-700">
              <p>
                {legalLine ? legalLine : (
                  <>
                    Raison sociale : <Value value={null} />
                  </>
                )}
              </p>
              <p>
                SIRET : <Value value={values["legal.siret"]} />
              </p>
              <p>
                <Value value={values["legal.address"]} />
              </p>
              <p>
                Tél. : <Value value={companyPhone?.display} />
                {values["company.email"] ? ` · ${values["company.email"]}` : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-asphalt-500">Bon d&apos;intervention</p>
            <p className="mt-1 font-plate text-base">{it.reference}</p>
            <p className="mt-1 text-sm text-asphalt-600">du {formatDate(it.createdAt)}</p>
            <p className="mt-2 inline-block rounded-full bg-asphalt-900 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-chalk print:border print:border-asphalt-900 print:bg-white print:text-asphalt-950">
              {STATUS_META[status].label}
            </p>
          </div>
        </header>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
          <Block title="Client">
            <Line label="Nom">{it.contactName}</Line>
            <Line label="Téléphone">{clientPhone?.display ?? it.contactPhone}</Line>
            {it.contactEmail ? <Line label="Email">{it.contactEmail}</Line> : null}
          </Block>
          <Block title="Véhicule">
            <Line label="Type">{vehicleText}</Line>
            <Line label="Immatriculation">{it.vehiclePlate ? <span className="font-plate text-sm">{it.vehiclePlate}</span> : "—"}</Line>
            <Line label="Situation">{situations.length ? situations.join(", ") : "—"}</Line>
          </Block>
        </div>

        <div className="mt-6 grid gap-6">
          <Block title="Intervention">
            <Line label="Prestation">{it.dropoffKind === "on_site" ? "Dépannage sur place" : "Remorquage"}</Line>
            <Line label="Prise en charge">
              {it.pickupAddress}
              {it.pickupAfterRegulatedRoad ? " (relais après une sortie d'autoroute)" : ""}
            </Line>
            {it.handoverNote ? <Line label="Précisions">{it.handoverNote}</Line> : null}
            <Line label="Destination">{destination}</Line>
          </Block>

          <Block title="Horaires">
            <div className="grid grid-cols-3 gap-2 pt-1 sm:grid-cols-6 print:grid-cols-6">
              {steps.map((step) => (
                <div key={step.label} className="rounded-xl border border-asphalt-200 px-2 py-1.5 text-center">
                  <p className="text-[0.7rem] font-bold uppercase text-asphalt-500">{step.label}</p>
                  <p className="font-extrabold tabular">{step.at ? formatTime(step.at) : "—"}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Prix convenu">
            <div className="flex flex-wrap items-end justify-between gap-3 pt-1">
              <p className="text-sm text-asphalt-600">{price ? `Prix confirmé le ${it.confirmedAt ? formatDateTime(it.confirmedAt) : ""}, toutes taxes comprises.` : "Le prix n'est pas encore confirmé."}</p>
              <p className="text-3xl font-extrabold tabular">{price ?? "À CONFIRMER"}</p>
            </div>
          </Block>

          <Block title="Observations">
            <div className="grid gap-5 pt-5" aria-hidden="true">
              <span className="block border-b border-dashed border-asphalt-300" />
              <span className="block border-b border-dashed border-asphalt-300" />
            </div>
          </Block>
        </div>

        <div className="mt-8 grid grid-cols-2 items-end gap-6 break-inside-avoid">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em]">Signature du client</p>
            <p className="text-xs text-asphalt-500">précédée de « bon pour accord »</p>
            <div className="mt-2 h-24 rounded-xl border-2 border-asphalt-300" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em]">Pour {companyName}</p>
            <p className="text-xs text-asphalt-500">nom et signature</p>
            <div className="mt-2 h-24 rounded-xl border-2 border-asphalt-300" />
          </div>
        </div>

        <footer className="mt-8 border-t border-asphalt-200 pt-3 text-[0.7rem] text-asphalt-500">
          Document établi le {formatDateTime(new Date())}. Ce bon atteste de l&apos;intervention ; il ne constitue pas une facture.
          {values["legal.insurance"] ? ` Assurance professionnelle : ${values["legal.insurance"]}.` : ""}
        </footer>
      </article>
    </>
  );
}
