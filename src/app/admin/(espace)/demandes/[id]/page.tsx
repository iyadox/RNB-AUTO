import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { phoneLink, whatsappHref } from "@/core/contact";
import { formatDateTime, formatEuros, formatKm, formatRelative, formatSignedEuros } from "@/core/format";
import { isTerminal, STATUS_META, type InterventionStatus } from "@/core/interventions/status";
import type { QuoteContext, QuoteRequestInput } from "@/core/quotes/types";
import type { QuoteResult } from "@/core/pricing/types";
import { MarginBadge, QuoteBreakdown } from "@/components/admin/quote-breakdown";
import { NotesEditor, PriceControls, StatusControls, type AdjustmentRow } from "@/components/admin/request-controls";
import { RequestPhotos } from "@/components/admin/request-photos";
import { StatusBadge } from "@/components/admin/status-badge";
import { Alert, Card, LinkButton, PageHeader } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon, type IconName } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getInterventionDetail } from "@/server/interventions/service";
import { listPhotos } from "@/server/photos/service";
import { loadSettingValue } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = { title: "Demande" };

const SOURCE_LABELS: Record<string, string> = { web: "reçue depuis le site", phone: "saisie pendant un appel", admin: "créée dans l'administration" };
const QUOTE_SOURCE_LABELS: Record<string, string> = { web: "site", phone: "appel", simulator: "simulateur", recalc: "recalcul" };

function directionsHref(lat: number | null, lng: number | null, label: string): string {
  const destination = lat !== null && lng !== null ? `${lat},${lng}` : label;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function wazeHref(lat: number | null, lng: number | null, label: string): string {
  return lat !== null && lng !== null ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(label)}&navigate=yes`;
}

function Section({ title, icon, children, className }: { title: string; icon: IconName; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl border border-asphalt-200 bg-white p-5", className)}>
      <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold uppercase tracking-wide">
        <Icon name={icon} size={18} className="text-asphalt-500" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function PlaceBlock({ label, address, lat, lng, children }: { label: string; address: string; lat: number | null; lng: number | null; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-asphalt-500">{label}</p>
      <p className="mt-0.5 text-lg font-extrabold leading-snug">{address}</p>
      {children}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={directionsHref(lat, lng, address)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-asphalt-100 text-sm font-extrabold hover:bg-asphalt-200">
          <Icon name="map" size={16} />
          Google Maps
        </a>
        <a href={wazeHref(lat, lng, address)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-asphalt-100 text-sm font-extrabold hover:bg-asphalt-200">
          <Icon name="route" size={16} />
          Waze
        </a>
      </div>
    </div>
  );
}

function eventText(event: { type: string; message: string | null; fromStatus: string | null; toStatus: string | null; data: Record<string, unknown> | null }): string {
  const statusLabel = (code: string | null) => (code && code in STATUS_META ? STATUS_META[code as InterventionStatus].label : code ?? "");
  switch (event.type) {
    case "status":
      return `${statusLabel(event.fromStatus)} → ${statusLabel(event.toStatus)}${event.message ? ` · ${event.message}` : ""}`;
    case "price": {
      const price = typeof event.data?.priceTtcCents === "number" ? ` : ${formatEuros(event.data.priceTtcCents)}` : "";
      return `Prix confirmé${price}`;
    }
    case "adjustment":
      return event.message?.startsWith("Ajustement retiré") ? event.message : `Ajustement : ${event.message ?? ""}`;
    case "photo":
      return event.message ?? "Photo";
    case "recalculated": {
      const price = typeof event.data?.priceTtcCents === "number" ? ` (${formatEuros(event.data.priceTtcCents)})` : "";
      return `${event.message ?? "Nouveau calcul"}${price}`;
    }
    default:
      return event.message ?? event.type;
  }
}

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const db = await getDb();
  const detail = await getInterventionDetail(db, id);
  if (!detail) notFound();
  const { intervention: it, quotes, current, pricing, adjustments, adjusted, events } = detail;
  const [latest, companyName, photos] = await Promise.all([
    pricing ? null : getLatestVersion(db),
    loadSettingValue(db, "company.name"),
    listPhotos(db, it.id),
  ]);
  const catalog = pricing ?? latest?.snapshot.pricing ?? null;
  const vehicleLabel = catalog?.vehicles.find((v) => v.code === it.vehicleCategory)?.label ?? it.vehicleCategory;
  const situationLabels = it.situations.map((code) => catalog?.situations.find((s) => s.code === code)?.label ?? code);
  const status = it.status as InterventionStatus;
  const serviceKind = it.dropoffKind === "on_site" ? "on_site" : it.dropoffKind === "address" ? "tow" : "unknown";
  const phone = phoneLink(it.contactPhone);
  const whatsapp = phone ? whatsappHref(phone.e164, `Bonjour, ici ${companyName || "RNB AUTO"} au sujet de votre demande n° ${it.reference}.`) : null;
  const result = (current?.result ?? null) as QuoteResult | null;
  const context = (current?.context ?? null) as QuoteContext | null;
  const input = (current?.input ?? null) as QuoteRequestInput | null;
  const adjustmentRows: AdjustmentRow[] = adjustments.map((a) => ({
    id: a.id,
    effect: a.effect as AdjustmentRow["effect"],
    mode: a.mode as AdjustmentRow["mode"],
    value: a.value,
    reason: a.reason,
  }));
  const calculatedCents = current?.priceTtcCents ?? null;
  const adjustedCents = adjusted && adjustments.length > 0 ? adjusted.priceTtcCents : null;
  const margin = adjusted && adjustments.length > 0 ? { cents: adjusted.marginCents, level: adjusted.marginLevel } : result ? { cents: result.totals.marginCents, level: result.totals.marginLevel } : null;
  const locked = status === "cancelled";

  return (
    <>
      <PageHeader
        back={{ href: "/admin/demandes", label: "Demandes" }}
        title={it.contactName}
        description={
          <>
            {it.reference} · {SOURCE_LABELS[it.source] ?? it.source} {formatRelative(it.createdAt)}
          </>
        }
        actions={<StatusBadge status={status} />}
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 grid-cols-1 gap-5">
          <StatusControls id={it.id} status={status} serviceKind={serviceKind} />

          <Section title="Client" icon="user">
            <p className="text-xl font-extrabold">{it.contactName}</p>
            <p className="mt-0.5 text-lg font-semibold tabular text-asphalt-700">{phone?.display ?? it.contactPhone}</p>
            {it.contactEmail ? (
              <a href={`mailto:${it.contactEmail}`} className="mt-0.5 block font-semibold text-asphalt-600 underline underline-offset-4">
                {it.contactEmail}
              </a>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={phone?.href ?? `tel:${it.contactPhone}`} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-signal-500 text-lg font-extrabold text-asphalt-950 hover:bg-signal-400">
                <Icon name="phone" size={22} />
                Appeler
              </a>
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp text-lg font-extrabold text-asphalt-950 hover:brightness-95">
                  <WhatsAppIcon size={22} />
                  WhatsApp
                </a>
              ) : null}
            </div>
          </Section>

          <Section title="Lieux" icon="pin">
            <div className="grid gap-5">
              <PlaceBlock label="Prise en charge" address={it.pickupAddress} lat={it.pickupLat} lng={it.pickupLng}>
                {it.pickupAfterRegulatedRoad ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-signal-200 px-3 py-1 text-sm font-extrabold">
                    <Icon name="road" size={14} />
                    Après une sortie d&apos;autoroute
                  </p>
                ) : null}
                {it.handoverNote ? <p className="mt-2 rounded-2xl bg-asphalt-50 px-3 py-2 text-asphalt-700">{it.handoverNote}</p> : null}
              </PlaceBlock>
              {it.dropoffKind === "address" && it.dropoffAddress ? (
                <PlaceBlock label="Destination" address={it.dropoffAddress} lat={it.dropoffLat} lng={it.dropoffLng} />
              ) : (
                <div>
                  <p className="text-sm font-bold text-asphalt-500">Destination</p>
                  <p className="mt-0.5 text-lg font-extrabold">{it.dropoffKind === "on_site" ? "Dépannage sur place" : "À préciser avec le client"}</p>
                </div>
              )}
              {result ? (
                <p className="text-sm text-asphalt-500">
                  Trajets prévus : {formatKm(result.km.emptyOut)} pour aller chercher le véhicule
                  {result.km.loaded > 0 ? `, ${formatKm(result.km.loaded)} de transport` : ""}, {formatKm(result.km.emptyBack)} de retour.
                </p>
              ) : null}
            </div>
          </Section>

          <Section title="Véhicule" icon="truck">
            <p className="text-lg font-extrabold">
              {vehicleLabel}
              {it.vehicleBrand || it.vehicleModel ? <span className="font-semibold text-asphalt-600"> · {[it.vehicleBrand, it.vehicleModel].filter(Boolean).join(" ")}</span> : null}
            </p>
            {it.vehiclePlate ? <p className="mt-1 inline-block rounded-lg border-2 border-asphalt-900 px-2 py-0.5 font-extrabold uppercase tracking-wider">{it.vehiclePlate}</p> : null}
            {situationLabels.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {situationLabels.map((label) => (
                  <li key={label} className="rounded-full bg-asphalt-100 px-3 py-1.5 text-sm font-bold">
                    {label}
                  </li>
                ))}
              </ul>
            ) : null}
            {it.clientComment ? (
              <div className="mt-4 rounded-2xl bg-asphalt-50 px-4 py-3">
                <p className="text-sm font-bold text-asphalt-500">Message du client</p>
                <p className="mt-0.5 whitespace-pre-line">{it.clientComment}</p>
              </div>
            ) : null}
          </Section>

          <Section title={`Photos${photos.length ? ` (${photos.length})` : ""}`} icon="camera">
            <RequestPhotos interventionId={it.id} photos={photos.map((p) => ({ id: p.id, uploadedBy: p.uploadedBy, createdAt: p.createdAt.toISOString() }))} />
          </Section>

          <Section title="Notes internes" icon="note">
            <NotesEditor id={it.id} initial={it.internalNotes ?? ""} />
          </Section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-5 lg:sticky lg:top-6">
          <Section title="Prix" icon="euro">
            <dl className="divide-y divide-asphalt-100">
              {it.source === "web" ? (
                <div className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-asphalt-500">Prix affiché au client sur le site</dt>
                  <dd className="text-right font-extrabold tabular">{it.estimatedPriceCents !== null ? formatEuros(it.estimatedPriceCents) : "aucun (rappel)"}</dd>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-asphalt-500">
                  Prix calculé
                  {current ? <span className="block text-xs">calcul n° {current.revision} · {formatDateTime(current.createdAt)}</span> : null}
                </dt>
                <dd className="text-right font-extrabold tabular">{calculatedCents !== null ? formatEuros(calculatedCents) : "—"}</dd>
              </div>
              {adjustedCents !== null ? (
                <div className="flex items-start justify-between gap-4 py-2.5">
                  <dt className="text-asphalt-500">Après ajustements</dt>
                  <dd className="text-right font-extrabold tabular">{formatEuros(adjustedCents)}</dd>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-4 py-2.5">
                <dt className="text-asphalt-500">
                  Prix confirmé
                  {it.confirmedAt ? <span className="block text-xs">le {formatDateTime(it.confirmedAt)}</span> : null}
                </dt>
                <dd className={cn("text-right text-2xl font-extrabold tabular", it.confirmedPriceCents === null && "text-base text-asphalt-400")}>
                  {it.confirmedPriceCents !== null ? formatEuros(it.confirmedPriceCents) : "à confirmer"}
                </dd>
              </div>
              {margin ? (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-asphalt-500">Marge estimée</dt>
                  <dd className="flex items-center gap-2 font-extrabold tabular">
                    {formatSignedEuros(margin.cents)}
                    <MarginBadge level={margin.level} />
                  </dd>
                </div>
              ) : null}
            </dl>
            {current === null || calculatedCents === null ? (
              <div className="mt-3">
                <Alert tone="warn" title="Pas encore de prix">
                  {current?.hiddenReason === "destination_unknown"
                    ? "La destination n'était pas connue. Calculez le prix une fois la destination précisée."
                    : "Le prix n'a pas pu être calculé automatiquement. Calculez-le (au besoin en saisissant les kilomètres)."}
                </Alert>
              </div>
            ) : null}
            <div className="mt-3">
              <PriceControls
                id={it.id}
                locked={locked}
                calculatedCents={calculatedCents}
                adjustedCents={adjustedCents}
                adjustments={adjustmentRows}
                confirmedCents={it.confirmedPriceCents}
                hasQuote={calculatedCents !== null}
              />
            </div>
            {!isTerminal(status) ? (
              <LinkButton href={`/admin/demandes/${it.id}/recalculer`} variant="ghost" className="mt-2 w-full">
                <Icon name="refresh" size={18} />
                {calculatedCents === null ? "Calculer le prix" : "Recalculer (nouveau calcul)"}
              </LinkButton>
            ) : null}
          </Section>

          {result && input ? (
            <details className="group rounded-3xl border border-asphalt-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-extrabold">
                <span className="flex items-center gap-2 uppercase tracking-wide">
                  <Icon name="chart" size={18} className="text-asphalt-500" />
                  Détail du calcul
                </span>
                <Icon name="chevronDown" size={20} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-asphalt-100 bg-asphalt-50 p-3 sm:p-4">
                <QuoteBreakdown result={result} context={context} input={input} minimum={pricing?.minimumPrice ?? null} />
              </div>
            </details>
          ) : null}

          <Section title="Historique" icon="history">
            <ol className="grid gap-3">
              {events.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-asphalt-300" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold">{eventText(event)}</p>
                    <p className="text-sm text-asphalt-500">
                      {formatDateTime(event.at)} · {event.byLabel}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            {quotes.length > 1 ? (
              <div className="mt-5 border-t border-asphalt-100 pt-4">
                <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-asphalt-500">Calculs successifs</p>
                <ul className="grid gap-1.5">
                  {quotes.map((quote) => (
                    <li key={quote.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>
                        Calcul n° {quote.revision} · {QUOTE_SOURCE_LABELS[quote.source] ?? quote.source} · {formatDateTime(quote.createdAt)}
                        {quote.id === it.currentQuoteId ? <strong className="ml-1">(actuel)</strong> : null}
                      </span>
                      <span className="font-extrabold tabular">{quote.priceTtcCents !== null ? formatEuros(quote.priceTtcCents) : "—"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Section>

          {it.cancelReason ? (
            <Card tone="muted">
              <p className="font-extrabold">Motif d&apos;annulation</p>
              <p className="mt-1">{it.cancelReason}</p>
            </Card>
          ) : null}

          <p className="text-center text-sm text-asphalt-400">
            <Link href="/admin/demandes" className="font-bold hover:text-asphalt-700">
              ← Retour aux demandes
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
