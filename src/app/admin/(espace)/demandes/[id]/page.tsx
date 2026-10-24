import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { phoneLink, whatsappHref } from "@/core/contact";
import { formatDateTime, formatEuros, formatKm, formatRelative, formatSignedEuros, formatTime } from "@/core/format";
import { customerMessage, googleMapsDirections, smsHref, wazeNavigation, type Place } from "@/core/interventions/links";
import { isTerminal, serviceKindOf, STATUS_META, type InterventionStatus } from "@/core/interventions/status";
import type { QuoteContext, QuoteRequestInput } from "@/core/quotes/types";
import type { QuoteResult } from "@/core/pricing/types";
import { AdminIcon, type AdminIconName } from "@/components/admin/admin-icons";
import { ProgressTrack } from "@/components/admin/progress-track";
import { MarginBadge, QuoteBreakdown } from "@/components/admin/quote-breakdown";
import { CallLogButtons, CopyButton, JournalNoteForm, TrackingLinkPanel } from "@/components/admin/request-actions";
import { NotesEditor, PriceControls, StatusControls, type AdjustmentRow } from "@/components/admin/request-controls";
import { RequestPhotos } from "@/components/admin/request-photos";
import { StatusBadge } from "@/components/admin/status-badge";
import { Alert, LinkButton } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon, type IconName } from "@/components/ui/icon";
import { getCurrentUser, requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getIntervention, getInterventionDetail } from "@/server/interventions/service";
import { listPhotos } from "@/server/photos/service";
import { loadSettingValue } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return { title: "Demande" };
  // Le titre de l'onglet n'est jamais public (espace protégé) ; la session est vérifiée par la page.
  const user = await getCurrentUser();
  if (!user) return { title: "Demande" };
  const intervention = await getIntervention(await getDb(), id);
  return { title: intervention ? `Demande ${intervention.reference}` : "Demande" };
}

const SOURCE_LABELS: Record<string, string> = { web: "reçue par le site", phone: "saisie pendant un appel", admin: "créée dans l'espace" };
const QUOTE_SOURCE_LABELS: Record<string, string> = { web: "site", phone: "appel", simulator: "simulateur", recalc: "recalcul" };

function Section({ title, icon, children, className, id }: { title: string; icon: IconName; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("min-w-0 rounded-3xl border border-asphalt-200 bg-white p-5", className)}>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-asphalt-600">
        <Icon name={icon} size={18} className="text-asphalt-400" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function PlaceBlock({ label, place, marker, children }: { label: string; place: Place; marker: "A" | "B"; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold", marker === "A" ? "bg-signal-500 text-asphalt-950" : "bg-asphalt-900 text-chalk")}>
        {marker}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-asphalt-500">{label}</p>
        <p className="mt-0.5 break-words text-lg font-extrabold leading-snug">{place.label}</p>
        {children}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <a href={googleMapsDirections(place)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-asphalt-100 text-sm font-extrabold hover:bg-asphalt-200">
            <Icon name="map" size={16} className="shrink-0" />
            Maps
          </a>
          <a href={wazeNavigation(place)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-asphalt-100 text-sm font-extrabold hover:bg-asphalt-200">
            <AdminIcon name="navigation" size={15} className="shrink-0" />
            Waze
          </a>
          <CopyButton text={place.label} label="Copier" />
        </div>
      </div>
    </div>
  );
}

type EventRow = { id: string; type: string; message: string | null; fromStatus: string | null; toStatus: string | null; data: Record<string, unknown> | null; at: Date; byLabel: string };

const statusLabel = (code: string | null) => (code && code in STATUS_META ? STATUS_META[code as InterventionStatus].label : (code ?? ""));

function eventView(event: EventRow): { text: string; icon: IconName | null; admin?: AdminIconName; strong: boolean } {
  switch (event.type) {
    case "created":
      return { text: event.message ?? "Demande créée", icon: "sparkles", strong: true };
    case "status":
      return { text: `${statusLabel(event.toStatus)}${event.message ? ` · ${event.message}` : ""}`, icon: event.toStatus && event.toStatus in STATUS_META ? STATUS_META[event.toStatus as InterventionStatus].icon : "flag", strong: true };
    case "price": {
      const price = typeof event.data?.priceTtcCents === "number" ? ` : ${formatEuros(event.data.priceTtcCents)}` : "";
      return { text: `Prix confirmé${price}`, icon: "euro", strong: false };
    }
    case "adjustment":
      return { text: event.message?.startsWith("Ajustement retiré") ? event.message : `Ajustement : ${event.message ?? ""}`, icon: "sliders", strong: false };
    case "photo":
      return { text: event.message ?? "Photo", icon: "camera", strong: false };
    case "recalculated": {
      const price = typeof event.data?.priceTtcCents === "number" ? ` (${formatEuros(event.data.priceTtcCents)})` : "";
      return { text: `${event.message ?? "Nouveau calcul"}${price}`, icon: "refresh", strong: false };
    }
    case "call":
      return { text: event.message ?? "Appel", icon: null, admin: event.data?.outcome === "no_answer" ? "phoneOff" : "phoneCheck", strong: false };
    case "journal":
      return { text: event.message ?? "", icon: "note", strong: false };
    case "tracking":
      return { text: event.message ?? "Lien de suivi créé.", icon: "route", strong: false };
    case "note":
      return { text: event.message ?? "Notes internes mises à jour.", icon: "edit", strong: false };
    default:
      return { text: event.message ?? event.type, icon: "info", strong: false };
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
  const [latest, companyName, photos] = await Promise.all([pricing ? null : getLatestVersion(db), loadSettingValue(db, "company.name"), listPhotos(db, it.id)]);
  const catalog = pricing ?? latest?.snapshot.pricing ?? null;
  const vehicleLabel = catalog?.vehicles.find((v) => v.code === it.vehicleCategory)?.label ?? it.vehicleCategory;
  const situationLabels = it.situations.map((code) => catalog?.situations.find((s) => s.code === code)?.label ?? code);
  const status = it.status as InterventionStatus;
  const serviceKind = serviceKindOf(it.dropoffKind);
  const phone = phoneLink(it.contactPhone);
  const pickup: Place = { label: it.pickupAddress, lat: it.pickupLat, lng: it.pickupLng };
  const dropoff: Place | null = it.dropoffKind === "address" && it.dropoffAddress ? { label: it.dropoffAddress, lat: it.dropoffLat, lng: it.dropoffLng } : null;
  const messageContext = { companyName: companyName || "RNB AUTO", reference: it.reference, contactName: it.contactName, pickup: it.pickupCity ?? it.pickupAddress };
  const message = customerMessage(status, messageContext);
  const whatsapp = phone ? whatsappHref(phone.e164, message) : null;
  const sms = phone ? smsHref(phone.e164, message) : null;
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
  const margin =
    adjusted && adjustments.length > 0 ? { cents: adjusted.marginCents, level: adjusted.marginLevel } : result ? { cents: result.totals.marginCents, level: result.totals.marginLevel } : null;
  const locked = status === "cancelled";
  const times: Partial<Record<InterventionStatus, Date>> = {
    new: it.createdAt,
    accepted: it.acceptedAt ?? undefined,
    en_route: it.enRouteAt ?? undefined,
    arrived: it.arrivedAt ?? undefined,
    loaded: it.loadedAt ?? undefined,
    in_transit: it.inTransitAt ?? undefined,
    completed: it.completedAt ?? undefined,
    cancelled: it.cancelledAt ?? undefined,
  };
  // Itinéraire : vers la prise en charge tant que le véhicule n'est pas chargé, puis vers la destination.
  const loadedAlready = status === "loaded" || status === "in_transit";
  const goHref = dropoff && loadedAlready ? googleMapsDirections(dropoff) : dropoff ? googleMapsDirections(dropoff, pickup) : googleMapsDirections(pickup);

  return (
    <>
      <div className="mb-5">
        <Link href="/admin/demandes" className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-asphalt-500 hover:text-asphalt-900">
          <Icon name="arrowLeft" size={16} />
          Demandes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-3xl font-extrabold tracking-tight sm:text-4xl">{it.contactName}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-asphalt-500">
              <span className="rounded-md bg-asphalt-900 px-2 py-0.5 font-plate text-[0.7rem] text-chalk">{it.reference}</span>
              <span>
                {SOURCE_LABELS[it.source] ?? it.source} {formatRelative(it.createdAt)}
              </span>
            </p>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      <ProgressTrack status={status} serviceKind={serviceKind} times={times} />

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 grid-cols-1 gap-5">
          <StatusControls id={it.id} status={status} serviceKind={serviceKind} />

          <Section title="Contacter le client" icon="phone">
            <p className="text-2xl font-extrabold tabular">{phone?.display ?? it.contactPhone}</p>
            {it.contactEmail ? (
              <a href={`mailto:${it.contactEmail}`} className="mt-0.5 block break-all font-semibold text-asphalt-600 underline underline-offset-4">
                {it.contactEmail}
              </a>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={phone?.href ?? `tel:${it.contactPhone}`} className="col-span-2 flex h-16 items-center justify-center gap-2 rounded-2xl bg-signal-500 text-xl font-extrabold text-asphalt-950 hover:bg-signal-400">
                <Icon name="phone" size={24} />
                Appeler
              </a>
              {whatsapp ? (
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-whatsapp font-extrabold text-asphalt-950 hover:brightness-95">
                  <WhatsAppIcon size={20} />
                  WhatsApp
                </a>
              ) : null}
              {sms ? (
                <a href={sms} className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-asphalt-900 font-extrabold text-chalk hover:bg-asphalt-800">
                  <AdminIcon name="message" size={18} />
                  SMS
                </a>
              ) : null}
            </div>
            {whatsapp ? <p className="mt-2 text-xs text-asphalt-500">WhatsApp et SMS s&apos;ouvrent avec un message prêt, adapté à l&apos;étape : « {message} »</p> : null}
            {!isTerminal(status) ? (
              <div className="mt-4 grid gap-4 border-t border-asphalt-100 pt-4">
                <CallLogButtons id={it.id} />
                <TrackingLinkPanel id={it.id} phoneE164={phone?.e164 ?? null} context={messageContext} />
              </div>
            ) : null}
          </Section>

          <Section title="Lieux" icon="pin">
            <a
              href={goHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-5 flex h-14 items-center justify-center gap-2 rounded-2xl bg-asphalt-900 text-lg font-extrabold text-chalk hover:bg-asphalt-800"
            >
              <AdminIcon name="navigation" size={20} className="text-signal-500" />
              {dropoff ? (loadedAlready ? "Itinéraire vers la destination" : "Itinéraire complet (A puis B)") : "Itinéraire vers le client"}
            </a>
            <div className="grid gap-5">
              <PlaceBlock label="Prise en charge" place={pickup} marker="A">
                {it.pickupAfterRegulatedRoad ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-signal-200 px-3 py-1 text-sm font-extrabold">
                    <Icon name="road" size={14} />
                    Après une sortie d&apos;autoroute
                  </p>
                ) : null}
                {it.handoverNote ? <p className="mt-2 rounded-2xl bg-asphalt-50 px-3 py-2 text-asphalt-700">{it.handoverNote}</p> : null}
              </PlaceBlock>
              {dropoff ? (
                <PlaceBlock label="Destination" place={dropoff} marker="B" />
              ) : (
                <div className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-asphalt-100 text-sm font-extrabold text-asphalt-500">B</span>
                  <div>
                    <p className="text-sm font-bold text-asphalt-500">Destination</p>
                    <p className="mt-0.5 text-lg font-extrabold">{it.dropoffKind === "on_site" ? "Dépannage sur place" : "À préciser avec le client"}</p>
                  </div>
                </div>
              )}
              {result ? (
                <p className="rounded-2xl bg-asphalt-50 px-4 py-3 text-sm text-asphalt-600">
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
            {it.vehiclePlate ? <p className="mt-2 inline-block rounded-lg border-2 border-asphalt-900 px-2.5 py-1 font-plate text-sm">{it.vehiclePlate}</p> : null}
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

        <div className="grid min-w-0 grid-cols-1 gap-5">
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
                  {current ? (
                    <span className="block text-xs">
                      calcul n° {current.revision} · {formatDateTime(current.createdAt)}
                    </span>
                  ) : null}
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
                <span className="flex items-center gap-2 text-sm uppercase tracking-wider text-asphalt-600">
                  <Icon name="chart" size={18} className="text-asphalt-400" />
                  Détail du calcul
                </span>
                <Icon name="chevronDown" size={20} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-asphalt-100 bg-asphalt-50 p-3 sm:p-4">
                <QuoteBreakdown result={result} context={context} input={input} minimum={pricing?.minimumPrice ?? null} />
              </div>
            </details>
          ) : null}

          <Link
            href={`/admin/demandes/${it.id}/bon`}
            className="flex items-center gap-4 rounded-3xl border border-asphalt-200 bg-white p-5 transition-colors hover:border-asphalt-400"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-asphalt-900 text-signal-500">
              <AdminIcon name="file" size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-extrabold">Bon d&apos;intervention</span>
              <span className="block text-sm text-asphalt-500">À imprimer, enregistrer en PDF ou partager.</span>
            </span>
            <Icon name="chevronRight" size={20} className="shrink-0 text-asphalt-400" />
          </Link>

          <Section title="Journal" icon="history" id="journal">
            {!locked ? (
              <div className="mb-5">
                <JournalNoteForm id={it.id} />
              </div>
            ) : null}
            <ol className="relative grid gap-4 before:absolute before:inset-y-1 before:left-[15px] before:w-0.5 before:bg-asphalt-100">
              {(events as EventRow[]).map((event) => {
                const view = eventView(event);
                return (
                  <li key={event.id} className="relative flex gap-3">
                    <span
                      className={cn(
                        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        view.strong ? "bg-asphalt-900 text-signal-500" : event.type === "journal" ? "bg-signal-200 text-asphalt-900" : "bg-asphalt-100 text-asphalt-600",
                      )}
                      aria-hidden="true"
                    >
                      {view.admin ? <AdminIcon name={view.admin} size={15} /> : view.icon ? <Icon name={view.icon} size={15} /> : null}
                    </span>
                    <div className="min-w-0 pt-1">
                      <p className={cn("break-words", view.strong ? "font-extrabold" : "font-semibold")}>{view.text}</p>
                      <p className="text-sm text-asphalt-500">
                        <time dateTime={event.at.toISOString()}>{formatTime(event.at)}</time> · {formatDateTime(event.at).split(" à ")[0]} · {event.byLabel}
                      </p>
                    </div>
                  </li>
                );
              })}
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
            <div className="rounded-3xl border border-asphalt-200 bg-asphalt-100/60 p-5">
              <p className="font-extrabold">Motif d&apos;annulation</p>
              <p className="mt-1">{it.cancelReason}</p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
