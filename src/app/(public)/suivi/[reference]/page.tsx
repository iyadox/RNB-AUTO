import type { Metadata } from "next";
import Link from "next/link";
import { PageTransition } from "@/components/motion/page-transition";
import { Pmv } from "@/components/motion/pmv";
import { PhaseTitle } from "@/components/pages/suivi/phase-title";
import { TrackingLive } from "@/components/pages/suivi/tracking-live";
import { TrackingRoad } from "@/components/pages/suivi/tracking-road";
import styles from "@/components/pages/suivi/suivi.module.css";
import { ActionRow, CallLink, WhatsAppLink } from "@/components/public/actions";
import { Plate } from "@/components/public/page-blocks";
import { EstimateTicket } from "@/components/scenes/kit/estimate-ticket";
import { PhotoUploader } from "@/components/request/photo-uploader";
import { RequestBackdrop } from "@/components/request/request-backdrop";
import { ShareLink } from "@/components/request/share-link";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import { formatDateTime, formatTime } from "@/core/format";
import { PHOTO_LIMITS } from "@/core/photos";
import { siteUrl } from "@/core/site-url";
import { getPublicSiteInfo } from "@/server/site/public-info";
import { loadTracking } from "@/server/tracking/service";
import { TRACKING_LIMITS, trackingPath, type TrackingView } from "@/server/tracking/view";

/** Page personnelle : jamais en cache, jamais indexée, jamais transmise en « referrer ». */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi de votre demande",
  description: "Suivez votre demande de dépannage RNB AUTO en direct : étape en cours, prix, photos.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Props = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * /suivi/<référence>?t=<jeton> « La route du suivi » : la page personnelle d'une demande, ouverte
 * depuis « Demande reçue », l'email de confirmation ou un lien partagé. Elle montre en direct
 * l'étape (reçue, confirmée, en route, sur place, transport, terminée ou annulée), le prix estimé
 * ou confirmé, Appeler et WhatsApp (simples liens), l'ajout de photos et le partage du lien.
 * Aucune donnée personnelle n'y figure (voir `src/server/tracking/view.ts`).
 */
export default async function TrackingPage({ params, searchParams }: Props) {
  const [{ reference: rawReference }, query, info] = await Promise.all([params, searchParams, getPublicSiteInfo()]);
  const reference = decodeURIComponent(rawReference).toUpperCase();
  const token = typeof query.t === "string" ? query.t : "";
  const data = await loadTracking(reference, token);

  if (!data.ok) {
    const copy = {
      invalid: {
        title: "Lien de suivi non valable",
        text: "Ce lien est incomplet ou ne correspond à aucune demande. Vérifiez qu'il a été copié en entier, ou contactez-nous : nous retrouvons votre demande avec son numéro.",
      },
      expired: {
        title: "Ce suivi est terminé",
        text: `Le lien de suivi se ferme ${TRACKING_LIMITS.daysAfterClosure} jours après la fin de l'intervention. Pour toute question sur cette demande, contactez-nous avec son numéro.`,
      },
      unavailable: {
        title: "Suivi momentanément indisponible",
        text: "Le suivi ne répond pas pour le moment. Réessayez dans un instant, ou appelez-nous : votre demande est bien enregistrée.",
      },
    }[data.reason];
    return (
      <PageTransition>
        <div className={styles.page} data-page="suivi">
          <RequestBackdrop advance={0} dir="forward" align="center" />
          <div className={styles.shell}>
            <Plate pictogram="route">Suivi de demande</Plate>
            <h1 className={cn(styles.title, "font-display")}>{copy.title}</h1>
            <p className={styles.lead}>{copy.text}</p>
            <ActionRow info={info} className="mt-8" primary={{ href: "/demande", label: "Faire une demande" }} />
            <p className="mt-8 text-[1.0625rem] text-asphalt-200">
              <Link href="/contact" className="font-bold text-signal-400 underline underline-offset-4">
                Tous nos contacts
              </Link>
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const { view, clientPhotos, totalPhotos } = data;
  const path = trackingPath(view.reference, token);
  const whatsappMessage = `Bonjour ${info.name}, je vous écris au sujet de ma demande n° ${view.reference}.`;
  return (
    <PageTransition>
      <div className={styles.page} data-page="suivi">
        <RequestBackdrop advance={0} dir="forward" align="center" />
        <div className={styles.shell}>
          <div className={styles.top}>
            <Plate pictogram="route" pictogramStyle="solid">
              Suivi de demande
            </Plate>
            <TrackingLive closed={view.closed} intervalMs={TRACKING_LIMITS.refreshMs} updatedLabel={formatTime(new Date())} href={path} />
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className={styles.reference}>
              <span className={styles.referenceBand} aria-hidden="true">
                <Icon name="losange" size={14} strokeWidth={2.4} />
              </span>
              <span className={cn(styles.referenceText, "text-[1.0625rem] text-asphalt-200")}>
                Demande n° <strong className="font-figure text-[1.375rem] tracking-[0.04em] text-signal-400">{view.reference}</strong>
              </span>
            </span>
            <span className="text-[0.9375rem] text-asphalt-300">envoyée le {formatDateTime(view.createdAt)}</span>
          </p>

          <Pmv
            className={styles.pmv}
            label="État de votre demande"
            messages={[view.led, view.closed ? view.led : ["SUIVI EN DIRECT", `N° ${view.reference}`]]}
          />

          <PhaseTitle phase={view.phase} title={view.title} text={view.text} />

          <TrackingRoad view={view} />

          <div className={styles.grid}>
            <div className="grid gap-6">
              <section aria-labelledby="etapes" className={cn(styles.panel, "p-5 sm:p-6")}>
                <h2 id="etapes" className="font-plate text-plate text-signal-500">
                  Étapes
                </h2>
                <Steps view={view} />
              </section>

              <section aria-labelledby="joindre" className={cn(styles.panel, "p-5 sm:p-6")}>
                <h2 id="joindre" className="font-plate text-plate text-signal-500">
                  Nous joindre
                </h2>
                <p className="mt-2 text-[1.0625rem] text-asphalt-200">Une question, un changement ? Donnez votre numéro de demande.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <CallLink phone={info.phone} variant="solid" size="lg" className="w-full" />
                  <WhatsAppLink whatsapp={info.whatsapp} message={whatsappMessage} variant="solid" size="lg" className="w-full" />
                </div>
              </section>

              {view.photosAllowed ? (
                <section aria-labelledby="photos" className={cn(styles.panel, "p-5 sm:p-6")}>
                  <h2 id="photos" className="flex items-center gap-2.5 text-lg font-extrabold">
                    <Icon name="camera" size={20} className="text-signal-400" />
                    Des photos du véhicule ? (facultatif)
                  </h2>
                  <p className="mb-4 mt-1 text-[0.9375rem] text-asphalt-300">
                    Elles nous aident à venir avec le bon matériel. Elles restent privées
                    {clientPhotos > 0 ? ` · ${clientPhotos} déjà reçue${clientPhotos > 1 ? "s" : ""}` : ""}.
                  </p>
                  <PhotoUploader
                    token={token}
                    endpoint="/api/suivi/photos"
                    fields={{ reference: view.reference }}
                    initialCount={totalPhotos}
                    max={PHOTO_LIMITS.perIntervention}
                    frame="viewfinder"
                  />
                  <noscript>
                    <p className="mt-3 text-[0.9375rem] text-asphalt-300">L&apos;ajout de photos a besoin de JavaScript : envoyez-les sur WhatsApp.</p>
                  </noscript>
                </section>
              ) : null}
            </div>

            <div className="grid gap-6">
              {/* Annulée : plus de prix à annoncer (ni « estimé », ni « confirmé avant l'intervention »). */}
              {view.phase === "cancelled" ? null : <PriceTicket view={view} />}
              <section aria-labelledby="details" className={cn(styles.panel, "p-5 sm:p-6")}>
                <h2 id="details" className="font-plate text-plate text-signal-500">
                  Votre demande
                </h2>
                <dl className={cn(styles.dl, "mt-3 text-[1.0625rem]")}>
                  <Detail label="Prise en charge" value={view.pickupLabel ?? "Adresse indiquée"} />
                  <Detail label="Destination" value={view.destinationLabel} />
                  {view.vehicleLabel ? <Detail label="Véhicule" value={view.vehicleLabel} /> : null}
                  {view.afterRegulatedRoad ? <Detail label="Autoroute" value="Prise en charge après la sortie de l'autoroute" /> : null}
                </dl>
              </section>
              <section aria-labelledby="partage" className={cn(styles.panel, "p-5 sm:p-6")}>
                <h2 id="partage" className="font-plate text-plate text-signal-500">
                  Partager ce suivi
                </h2>
                <p className="mb-4 mt-2 text-[0.9375rem] text-asphalt-300">
                  Ce lien est personnel : partagez-le seulement avec un proche qui veut suivre l&apos;intervention.
                </p>
                <ShareLink path={path} serverOrigin={siteUrl()} shareTitle="Suivi de ma demande de dépannage" />
              </section>
            </div>
          </div>

          <nav aria-label="Autres liens" className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-[1.0625rem]">
            <Link href="/demande" className="min-h-11 py-2 font-bold text-asphalt-200 underline underline-offset-4 hover:text-chalk">
              Faire une nouvelle demande
            </Link>
            <Link href="/questions-frequentes" className="min-h-11 py-2 font-bold text-asphalt-200 underline underline-offset-4 hover:text-chalk">
              Questions fréquentes
            </Link>
            <Link href="/conditions-d-intervention" className="min-h-11 py-2 font-bold text-asphalt-200 underline underline-offset-4 hover:text-chalk">
              Conditions d&apos;intervention
            </Link>
          </nav>
        </div>
      </div>
    </PageTransition>
  );
}

function Steps({ view }: { view: TrackingView }) {
  const cancelled = view.phase === "cancelled";
  // Annulée : seules les étapes franchies avant l'annulation, puis « Annulée » (pas d'étapes « à venir »).
  const steps = cancelled ? view.steps.filter((step) => step.state === "done") : view.steps;
  return (
    <ol className={cn(styles.steps, "mt-4")}>
      {steps.map((step) => (
        <li key={step.key} className={styles.step} data-state={step.state} aria-current={step.state === "current" ? "step" : undefined}>
          <span className={styles.stepMark} aria-hidden="true">
            {step.state === "done" ? <Icon name="check" size={16} strokeWidth={3} /> : null}
          </span>
          <span className={styles.stepLabel}>
            {step.label}
            <span className="sr-only">{step.state === "done" ? " : faite" : step.state === "current" ? " : en cours" : " : à venir"}</span>
          </span>
          {step.at ? (
            <time dateTime={step.at.toISOString()} className="font-figure text-[1.0625rem] text-asphalt-200">
              {formatTime(step.at)}
            </time>
          ) : (
            <span />
          )}
        </li>
      ))}
      {cancelled ? (
        <li className={styles.step} data-state="cancelled" aria-current="step">
          <span className={styles.stepMark} aria-hidden="true">
            <Icon name="x" size={16} strokeWidth={3} />
          </span>
          <span className={styles.stepLabel}>Annulée</span>
          <span />
        </li>
      ) : null}
    </ol>
  );
}

/** Nature de l'intervention sur le ticket (« à préciser » tant que la destination n'est pas connue). */
const SERVICE_LINE: Record<TrackingView["serviceKind"], string> = {
  on_site: "Dépannage sur place",
  tow: "Remorquage",
  unknown: "Intervention à préciser avec vous",
};

function PriceTicket({ view }: { view: TrackingView }) {
  const price = view.price;
  return (
    <EstimateTicket
      priceCents={price.kind === "on_call" ? null : price.cents}
      priceLabel={price.kind === "confirmed" ? "Prix confirmé" : "Prix estimé"}
      lines={[SERVICE_LINE[view.serviceKind], ...(view.vehicleLabel ? [view.vehicleLabel] : [])]}
      print="none"
      odometer="none"
      emptyText="Prix donné par téléphone"
      footnote={
        price.kind === "confirmed"
          ? "TTC · prix convenu avec vous"
          : price.kind === "estimated"
            ? "TTC · confirmé avec vous avant l'intervention"
            : "Nous vous appelons pour vous donner le prix avant l'intervention"
      }
    />
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.dlRow}>
      <dt className="text-asphalt-300">{label}</dt>
      <dd className="font-bold text-chalk">{value}</dd>
    </div>
  );
}
