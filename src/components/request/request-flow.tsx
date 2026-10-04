"use client";

/**
 * Parcours de demande de dépannage : une question par écran, prix affiché en moins d'une minute.
 * La saisie est gardée dans l'onglet (coupure réseau, rechargement). Le bouton « retour » du
 * téléphone revient à l'étape précédente. Appeler et WhatsApp restent toujours accessibles.
 *
 * Habillage « Pleins phares » (docs/09, F.8) : la logique (étapes, branche autoroute, appels
 * serveur, stockage, retour du téléphone) est inchangée. S'ajoutent une route d'étapes
 * (`StepRoad`), une feuille de route (`RouteSheet`), le décor de la route de nuit
 * (`RequestBackdrop`), le ticket d'estimation du kit avec le VRAI prix du serveur, et des
 * changements d'étape glissés selon le sens (`data-dir`). Aucun GSAP ni Lenis sur cette page.
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { whatsappHref, whatsappRequestMessage, type PhoneLink } from "@/core/contact";
import { formatEurosShort, formatKm, formatPhone } from "@/core/format";
import type { ClientEstimate } from "@/core/quotes/client-view";
import type { GeoPoint, Place, QuoteRequestInput } from "@/core/quotes/types";
import { estimateAction, submitRequestAction } from "@/app/(public)/demande/actions";
import type { PublicCatalog } from "@/server/site/catalog";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { VehicleIcon } from "@/components/brand/vehicle-icon";
import { EstimateTicket } from "@/components/scenes/kit/estimate-ticket";
import { PinGlyph } from "@/components/scenes/kit/glyphs";
import { RoutePaths } from "@/components/scenes/kit/route-paths";
import { ThreeLegs } from "@/components/scenes/kit/three-legs";
import { PROBLEM_VOYANTS, Voyant } from "@/components/scenes/kit/voyant";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import { PHOTO_LIMITS } from "@/core/photos";
import { AddressInput, useGeolocation } from "./address-input";
import { PhotoUploader } from "./photo-uploader";
import { RequestBackdrop } from "./request-backdrop";
import { RoutePlan, RouteRecap, RouteSheetBar, RouteSheetColumn, type SheetRow } from "./route-sheet";
import { StepRoad } from "./step-road";
import styles from "./request.module.css";

type Step = "pickup" | "highway" | "dropoff" | "vehicle" | "problem" | "estimate" | "contact" | "done";

type FlowState = {
  step: Step;
  pickup: Place | null;
  onHighway: "no" | "yes" | "unsure" | null;
  highwayPosition: Place | null;
  handoverNote: string;
  dropoffMode: "address" | "on_site" | "unknown" | null;
  dropoff: Place | null;
  vehicle: string | null;
  problem: string | null;
  rolling: "yes" | "no" | "unknown" | null;
  parking: boolean;
  estimate: ClientEstimate | null;
  contact: { name: string; phone: string; email: string };
  details: { brand: string; model: string; plate: string };
  comment: string;
  consent: boolean;
  reference: string | null;
  /** Jeton temporaire pour ajouter des photos après l'envoi. */
  photoToken: string | null;
  startedAt: number;
};

const STORAGE_KEY = "rnb-demande-v1";
const PROGRESS: Step[] = ["pickup", "dropoff", "vehicle", "problem", "estimate", "contact"];
/** Téléphone et tablette (sous 1 024 px) : ticket compact, lignes repliées (interface seulement). */
const NARROW_QUERY = "(max-width: 1023px)";
const subscribeNarrow = (onChange: () => void) => {
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const narrowSnapshot = () => window.matchMedia(NARROW_QUERY).matches;
/** Mobile d'abord : l'étape Prix n'est jamais rendue côté serveur. */
const narrowServerSnapshot = () => true;

/** Ordre des écrans, pour le sens du glissement (interface seulement). */
const SCREEN_ORDER: Step[] = ["pickup", "highway", "dropoff", "vehicle", "problem", "estimate", "contact", "done"];

function initialState(startOnHighway: boolean): FlowState {
  return {
    step: "pickup",
    pickup: null,
    onHighway: startOnHighway ? "yes" : null,
    highwayPosition: null,
    handoverNote: "",
    dropoffMode: null,
    dropoff: null,
    vehicle: null,
    problem: null,
    rolling: null,
    parking: false,
    estimate: null,
    contact: { name: "", phone: "", email: "" },
    details: { brand: "", model: "", plate: "" },
    comment: "",
    consent: false,
    reference: null,
    photoToken: null,
    startedAt: Date.now(),
  };
}

type Props = {
  catalog: PublicCatalog;
  phone: PhoneLink | null;
  whatsapp: PhoneLink | null;
  regulatedRoads: { enabled: boolean; message: string };
  depot: GeoPoint | null;
  startOnHighway: boolean;
  /** Dépôt affiché sur le plan schématique (réglage de l'entreprise). */
  siteDepot: PublicSiteInfo["depot"];
  /** Bloc `<noscript>` rendu par la page, en tête du parcours. */
  notice?: ReactNode;
};

export function RequestFlow({ catalog, phone, whatsapp, regulatedRoads, depot, startOnHighway, siteDepot, notice }: Props) {
  const [state, setState] = useState<FlowState>(() => initialState(startOnHighway));
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [priceChanged, setPriceChanged] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Sens du changement d'écran (interface seulement, FlowState n'est pas touché) : déduit de
  // l'écran précédent, donc juste aussi pour le bouton « retour » du téléphone.
  const [shownStep, setShownStep] = useState<Step>(state.step);
  const [motion, setMotion] = useState<{ dir: "forward" | "back"; advance: number }>({ dir: "forward", advance: 0 });
  if (state.step !== shownStep) {
    const dir = SCREEN_ORDER.indexOf(state.step) >= SCREEN_ORDER.indexOf(shownStep) ? "forward" : "back";
    setShownStep(state.step);
    setMotion((current) => ({ dir, advance: current.advance + 1 }));
  }

  const update = useCallback((patch: Partial<FlowState>) => setState((s) => ({ ...s, ...patch })), []);

  // Reprise d'une saisie en cours (coupure réseau, rechargement de la page).
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FlowState;
        if (parsed && parsed.step && !(startOnHighway && parsed.step === "pickup")) {
          // Le stockage du navigateur n'existe qu'après l'affichage initial : reprise faite ici, une seule fois.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setState({ ...initialState(startOnHighway), ...parsed, startedAt: parsed.startedAt ?? Date.now() });
        }
      }
    } catch {
      // stockage indisponible (navigation privée) : on repart de zéro
    }
    setRestored(true);
  }, [startOnHighway]);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignoré
    }
  }, [state, restored]);

  // Le bouton « retour » du téléphone revient à l'étape précédente.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const step = (event.state as { rnbStep?: Step } | null)?.rnbStep;
      if (step) setState((s) => ({ ...s, step }));
    };
    window.addEventListener("popstate", onPop);
    window.history.replaceState({ ...(window.history.state ?? {}), rnbStep: state.step }, "");
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback((step: Step) => {
    setError(null);
    setFieldErrors({});
    setState((s) => ({ ...s, step }));
    window.history.pushState({ ...(window.history.state ?? {}), rnbStep: step }, "");
    window.requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Le titre de la nouvelle étape reçoit le focus (lecteurs d'écran, clavier), sans saut.
      topRef.current?.querySelector<HTMLElement>("[data-step-title]")?.focus({ preventScroll: true });
    });
  }, []);

  const back = () => window.history.back();

  const vehicleLabel = catalog.vehicles.find((v) => v.code === state.vehicle)?.label ?? null;
  const problemLabel = catalog.problems.find((p) => p.code === state.problem)?.clientLabel ?? null;
  const pickupForQuote = state.pickup;
  const towing = state.dropoffMode !== "on_site";

  const whatsappLink = useMemo(() => {
    if (!whatsapp) return null;
    return whatsappHref(
      whatsapp.e164,
      whatsappRequestMessage({
        reference: state.reference,
        pickup: state.pickup?.label ?? null,
        destination: state.dropoffMode === "on_site" ? "dépannage sur place" : (state.dropoff?.label ?? null),
        vehicle: vehicleLabel,
        problem: problemLabel,
      }),
    );
  }, [whatsapp, state.reference, state.pickup, state.dropoff, state.dropoffMode, vehicleLabel, problemLabel]);

  const buildRequest = (): QuoteRequestInput | null => {
    if (!pickupForQuote || !state.vehicle) return null;
    const situations = [state.problem, state.rolling === "yes" ? "rolling" : state.rolling === "no" ? "non_rolling" : null, state.parking ? "parking" : null]
      .filter((code): code is string => Boolean(code))
      .filter((code) => [...catalog.problems, ...catalog.states, ...catalog.details].some((s) => s.code === code));
    const highwayNote =
      state.onHighway === "yes"
        ? [state.handoverNote.trim(), state.highwayPosition ? `Position signalée sur la voie : ${state.highwayPosition.label}` : ""]
            .filter(Boolean)
            .join(" · ")
        : "";
    return {
      pickup: { ...pickupForQuote, afterRegulatedRoad: state.onHighway === "yes", handoverNote: highwayNote || null },
      dropoff:
        state.dropoffMode === "on_site"
          ? { kind: "on_site" }
          : state.dropoffMode === "address" && state.dropoff
            ? { kind: "address", place: state.dropoff }
            : { kind: "unknown" },
      vehicleCategory: state.vehicle,
      situations,
      when: { kind: "now" },
    };
  };

  const requestEstimate = () => {
    const request = buildRequest();
    if (!request) return;
    update({ estimate: null });
    goTo("estimate");
    startTransition(async () => {
      const result = await estimateAction(request);
      if (result.ok) update({ estimate: result.estimate });
      else setError(result.error);
    });
  };

  const submit = () => {
    if (!state.estimate?.quoteId) {
      setError("L'estimation a expiré : recalculez le prix avant d'envoyer.");
      return;
    }
    startTransition(async () => {
      const result = await submitRequestAction({
        quoteId: state.estimate?.quoteId,
        contact: state.contact,
        vehicle: state.details,
        comment: state.comment,
        consent: state.consent,
        website: (document.getElementById("rnb-website") as HTMLInputElement | null)?.value ?? "",
        elapsedMs: Math.min(86_400_000, Date.now() - state.startedAt),
      });
      if (result.status === "created") {
        update({ reference: result.reference, photoToken: result.photoToken, step: "done" });
        window.history.replaceState({ ...(window.history.state ?? {}), rnbStep: "done" }, "");
        topRef.current?.scrollIntoView({ behavior: "smooth" });
        // « Demande reçue ! » reçoit le focus, comme le titre de chaque étape (lecteurs d'écran).
        window.requestAnimationFrame(() => topRef.current?.querySelector<HTMLElement>("[data-step-title]")?.focus({ preventScroll: true }));
      } else if (result.status === "price_changed") {
        setPriceChanged(true);
        update({ estimate: result.estimate });
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  };

  const restart = () => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignoré
    }
    setState(initialState(false));
    setPriceChanged(false);
    goTo("pickup");
  };

  const progressIndex = Math.max(0, PROGRESS.indexOf(state.step === "highway" ? "pickup" : state.step));

  // ─── Habillage : feuille de route, plan, décor ─────────────────────────────
  const done = state.step === "done";
  const computing = state.step === "estimate" && pending;
  const destinationValue =
    state.dropoffMode === "on_site" ? "Dépannage sur place" : state.dropoffMode === "unknown" ? "À préciser" : (state.dropoff?.label ?? "—");
  const price = state.estimate?.priceTtcCents ?? null;
  const sheetRows: SheetRow<Step>[] = [];
  if (state.pickup) sheetRows.push({ kind: "pickup", label: "Prise en charge", value: state.pickup.label, target: "pickup" });
  if (state.dropoffMode) sheetRows.push({ kind: "dropoff", label: "Destination", value: destinationValue, target: "dropoff" });
  if (vehicleLabel) sheetRows.push({ kind: "vehicle", label: "Véhicule", value: vehicleLabel, target: "vehicle", code: state.vehicle });
  if (problemLabel) sheetRows.push({ kind: "problem", label: "Problème", value: problemLabel, target: "problem", code: state.problem });
  if (price !== null) sheetRows.push({ kind: "price", label: "Prix", value: formatEurosShort(price), target: "estimate" });
  // Feuille de route : absente au lieu et à l'envoi ; aux coordonnées, le récapitulatif la remplace.
  const sheetVisible = !["pickup", "highway", "contact", "done"].includes(state.step);
  // Étape Prix, prix reçu : sur téléphone, la feuille de route passe SOUS les actions, pour que
  // « Demander le dépannage » reste dans le premier écran (390 × 844).
  const priceShown = state.step === "estimate" && !pending && state.estimate !== null;
  const placeName = (place: Place | null) => (place ? (place.city ?? place.label) : null);
  const routeText = [
    placeName(state.pickup),
    state.dropoffMode === "on_site" ? "Sur place" : state.dropoffMode === "unknown" ? "À préciser" : placeName(state.dropoff),
  ]
    .filter(Boolean)
    .join(" → ");
  const sheetSummary = [routeText, vehicleLabel, problemLabel].filter(Boolean).join(" · ");
  const plan = (idPrefix: string, sweep: boolean, className?: string) => (
    <RoutePlan
      depot={siteDepot}
      pickup={state.pickup}
      dropoff={state.dropoffMode === "address" ? state.dropoff : null}
      onSite={state.dropoffMode === "on_site"}
      sweep={sweep}
      idPrefix={idPrefix}
      className={className}
    />
  );
  const ticketLines = state.estimate
    ? [
        ...(state.estimate.vehicleTripKm !== null ? [`Trajet de votre véhicule : ${formatKm(state.estimate.vehicleTripKm)}`] : []),
        ...(state.estimate.approachKm !== null ? [`Depuis notre dépôt : ${formatKm(state.estimate.approachKm)}`] : []),
        ...state.estimate.includedLabels,
      ]
    : [];

  return (
    <div ref={topRef} data-page="demande" data-computing={computing ? "" : undefined} className={cn(styles.flow, "scroll-mt-24")}>
      <RequestBackdrop advance={motion.advance} dir={motion.dir} align={done ? "center" : "gap"} />

      <div className={cn(styles.shell, done && styles.shellDone)}>
        <div className={styles.main}>
          {notice}

          {!done ? (
            <StepRoad index={Math.min(progressIndex, PROGRESS.length - 1)} vehicle={state.vehicle} onBack={state.step !== "pickup" ? back : null} />
          ) : null}

          {sheetVisible && !priceShown ? (
            <RouteSheetBar summary={sheetSummary} rows={sheetRows} onEdit={(step) => goTo(step)} className="mt-5 lg:hidden" />
          ) : null}

          {error ? (
            <div role="alert" className={cn(styles.panel, "mt-6 flex gap-3 p-4 text-beacon-400 shadow-[inset_0_0_0_1.5px_var(--color-beacon-500)]")}>
              <Icon name="alert" size={22} className="shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
          ) : null}

          <section
            key={state.step}
            data-sky={done ? "aube" : "nuit"}
            data-dir={motion.advance > 0 ? motion.dir : undefined}
            className={cn(styles.stage, done ? "pt-2" : "mt-8 lg:mt-10")}
          >
            {state.step === "pickup" ? (
              <PickupStep
                state={state}
                update={update}
                near={depot}
                regulatedRoads={regulatedRoads}
                onNext={() => goTo(regulatedRoads.enabled && state.onHighway === "yes" ? "highway" : "dropoff")}
              />
            ) : null}

            {state.step === "highway" ? (
              <HighwayStep
                state={state}
                update={update}
                near={depot}
                message={regulatedRoads.message}
                phone={phone}
                whatsappLink={whatsappLink}
                onNext={() => goTo("dropoff")}
              />
            ) : null}

            {state.step === "dropoff" ? (
              <DropoffStep state={state} update={update} near={state.pickup?.lat ? { lat: state.pickup.lat, lng: state.pickup.lng as number } : depot} onNext={() => goTo("vehicle")} />
            ) : null}

            {state.step === "vehicle" ? (
              <div>
                <StepTitle title="Quel véhicule ?" accent="véhicule" />
                <div className={cn(styles.parking, "mt-8 grid grid-cols-2 gap-y-4 sm:grid-cols-3")}>
                  {catalog.vehicles.map((vehicle) => (
                    <button
                      key={vehicle.code}
                      type="button"
                      data-selected={state.vehicle === vehicle.code ? "" : undefined}
                      onClick={() => {
                        update({ vehicle: vehicle.code });
                        goTo("problem");
                      }}
                      className={styles.vehicleTile}
                    >
                      <VehicleIcon code={vehicle.code} className={styles.vehicleSilhouette} />
                      <span className="text-[1.0625rem] font-bold leading-tight">{vehicle.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {state.step === "problem" ? (
              <ProblemStep state={state} update={update} catalog={catalog} towing={towing} onNext={requestEstimate} onChangeDropoff={() => goTo("dropoff")} />
            ) : null}

            {state.step === "estimate" ? (
              <EstimateStep
                state={state}
                pending={pending}
                phone={phone}
                whatsappLink={whatsappLink}
                ticketLines={ticketLines}
                plan={plan("calc-route", false, "w-full")}
                recap={
                  sheetVisible ? (
                    <RouteSheetBar summary={sheetSummary} rows={sheetRows} onEdit={(step) => goTo(step)} className="mt-8 lg:hidden" />
                  ) : null
                }
                onRetry={requestEstimate}
                onNext={() => goTo("contact")}
                onEdit={(step) => goTo(step)}
              />
            ) : null}

            {state.step === "contact" ? (
              <ContactStep
                state={state}
                update={update}
                vehicleLabel={vehicleLabel}
                problemLabel={problemLabel}
                pending={pending}
                fieldErrors={fieldErrors}
                priceChanged={priceChanged}
                onEdit={(step) => goTo(step)}
                onSubmit={submit}
              />
            ) : null}

            {state.step === "done" ? (
              <DoneStep
                reference={state.reference}
                photoToken={state.photoToken}
                phone={phone}
                whatsappLink={whatsappLink}
                contactPhone={state.contact.phone}
                highway={state.onHighway === "yes"}
                price={price}
                ticketLines={ticketLines}
                onRestart={restart}
              />
            ) : null}
          </section>

          {!done ? (
            <div className={cn(styles.panel, styles.callBox, "mt-14 px-4 py-4 text-[1.0625rem] text-asphalt-200")}>
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[6px] bg-night-900 text-signal-400 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-reflect)_14%,transparent)]" aria-hidden="true">
                  <Icon name="callbox" size={20} strokeWidth={2.2} />
                </span>
                Plus simple de nous parler ?
              </span>
              <span className="flex flex-wrap items-center gap-x-5 gap-y-1">
                {phone ? (
                  <a href={phone.href} className="flex min-h-12 items-center gap-2 font-bold text-signal-400 hover:text-signal-300">
                    <Icon name="phone" size={18} /> <span className="font-figure text-[1.125rem] [word-spacing:0.12em]">{phone.display}</span>
                  </a>
                ) : null}
                {whatsappLink ? (
                  <a href={whatsappLink} className="flex min-h-12 items-center gap-2 font-bold text-whatsapp hover:text-chalk">
                    <WhatsAppIcon size={18} /> WhatsApp
                  </a>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>

        {!done ? (
          <RouteSheetColumn
            className="hidden lg:block"
            plan={plan("sheet-route", state.step === "pickup" || state.step === "highway", "w-full")}
            rows={sheetVisible ? sheetRows : []}
            onEdit={(step) => goTo(step)}
          />
        ) : null}
      </div>
    </div>
  );
}

// ─── Éléments communs ────────────────────────────────────────────────────────

/** Titre d'étape (h1) : focus après un changement d'étape ; un mot éclairé par les phares. */
function StepTitle({ title, accent, subtitle, className }: { title: string; accent?: string; subtitle?: string; className?: string }) {
  const at = accent ? title.indexOf(accent) : -1;
  return (
    <div className={className}>
      <h1
        data-step-title=""
        tabIndex={-1}
        className={cn(styles.stepTitle, "font-display text-balance text-[clamp(2.75rem,12vw,5.25rem)] leading-[0.95]")}
      >
        {at >= 0 && accent ? (
          <>
            {title.slice(0, at)}
            <em className="not-italic text-signal-500" data-beam="load">
              {accent}
            </em>
            {title.slice(at + accent.length)}
          </>
        ) : (
          title
        )}
      </h1>
      {subtitle ? <p className="text-lead mt-4 text-asphalt-200">{subtitle}</p> : null}
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick, type = "button" }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-signal-500 px-6 py-2 text-center text-lg font-extrabold leading-tight text-asphalt-950 shadow-[0_18px_44px_-16px_var(--color-signal-500)] transition-[background-color,translate] duration-(--dur-ui) hover:bg-signal-400 active:scale-[0.98] disabled:bg-asphalt-800 disabled:text-asphalt-300 disabled:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-reflect)_12%,transparent)]"
    >
      {children}
    </button>
  );
}

/** Choix sélectionnable : liseré jaune et coche, jamais un aplat jaune. */
function Choice({ selected, onClick, children, icon }: { selected: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        styles.choice,
        "flex min-h-16 items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold",
        selected ? "border-signal-500 bg-signal-500/10 text-chalk" : "border-chalk/12 bg-night-950/75 text-asphalt-100 hover:border-chalk/30",
      )}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {selected ? <Icon name="checkCircle" size={22} className="shrink-0 text-signal-500" /> : null}
    </button>
  );
}

/** Bouton d'une question à trois réponses (Oui / Non / Je ne sais pas). */
function Answer({ selected, onClick, children, pictogram }: { selected: boolean; onClick: () => void; children: React.ReactNode; pictogram?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        styles.choice,
        "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-2 py-2 text-center text-[1.0625rem] font-extrabold leading-tight",
        selected ? "border-signal-500 bg-signal-500/12 text-chalk" : "border-chalk/12 bg-night-950/75 text-chalk hover:border-chalk/30",
      )}
    >
      {pictogram ? (
        <span aria-hidden="true" className={cn("grid h-5 place-items-center", selected ? "text-signal-400" : "text-asphalt-300")}>
          {pictogram}
        </span>
      ) : null}
      {children}
    </button>
  );
}

// ─── Étape 1 : où êtes-vous ? ────────────────────────────────────────────────

function PickupStep({
  state,
  update,
  near,
  regulatedRoads,
  onNext,
}: {
  state: FlowState;
  update: (patch: Partial<FlowState>) => void;
  near: GeoPoint | null;
  regulatedRoads: { enabled: boolean };
  onNext: () => void;
}) {
  const { state: geo, locate } = useGeolocation();
  const ready = Boolean(state.pickup) && (!regulatedRoads.enabled || state.onHighway === "no" || state.onHighway === "yes");
  const locating = geo.status === "locating";
  return (
    <div>
      <StepTitle title="Où êtes-vous ?" accent="êtes-vous" subtitle="Le lieu où se trouve le véhicule." />
      <div className="mt-8 space-y-4">
        <button
          type="button"
          onClick={async () => {
            const place = await locate();
            if (place) update({ pickup: place });
          }}
          disabled={locating}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-signal-500/10 text-lg font-extrabold text-signal-400 shadow-[inset_0_0_0_2px_var(--color-signal-500)] transition-colors hover:bg-signal-500/20 disabled:opacity-90"
        >
          <span className={styles.locateIcon}>
            {locating ? (
              <>
                <span className={styles.sonar} aria-hidden="true" />
                <span className={styles.sonar} aria-hidden="true" />
                <span className={styles.sonar} aria-hidden="true" />
              </>
            ) : null}
            <Icon name="locate" size={22} />
          </span>
          {locating ? "Localisation en cours…" : "Utiliser ma position"}
        </button>
        {geo.status === "error" ? <p className="text-[1.0625rem] font-semibold text-beacon-400">{geo.message}</p> : null}
        <p className={cn(styles.orRule, "font-plate text-plate text-asphalt-300")}>ou</p>
        <AddressInput
          label="Adresse où se trouve le véhicule"
          value={state.pickup}
          onChange={(place) => update({ pickup: place })}
          placeholder="Adresse, rue, ville…"
          near={near}
        />
        {state.pickup?.source === "gps" ? (
          <p className="flex items-center gap-3 text-[1.0625rem] text-asphalt-200">
            <svg viewBox="-17 -34 34 40" className={styles.foundPin} aria-hidden="true">
              <PinGlyph hazards />
            </svg>
            <span>
              <Icon name="checkCircle" size={18} className="mr-1.5 inline-block -translate-y-px text-signal-500" />
              Position trouvée. Vérifiez l&apos;adresse ci-dessus.
            </span>
          </p>
        ) : null}
      </div>

      {regulatedRoads.enabled && state.pickup ? (
        <div className="mt-10">
          <h2 className="font-step text-step text-balance">Êtes-vous sur une autoroute ou une voie rapide ?</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Answer selected={state.onHighway === "no"} onClick={() => update({ onHighway: "no" })} pictogram={<Icon name="road" size={20} />}>
              Non
            </Answer>
            <Answer selected={state.onHighway === "yes"} onClick={() => update({ onHighway: "yes" })} pictogram={<span className={styles.motorwayChip}>A</span>}>
              Oui
            </Answer>
            <Answer selected={state.onHighway === "unsure"} onClick={() => update({ onHighway: "unsure" })} pictogram={<Icon name="question" size={20} />}>
              Je ne sais pas
            </Answer>
          </div>
          {state.onHighway === "unsure" ? (
            <p className={cn(styles.panel, "mt-4 flex gap-4 p-4 text-[1.0625rem] text-asphalt-200")}>
              <span className={cn(styles.motorwayChip, "mt-0.5 shrink-0")} aria-hidden="true">
                A
              </span>
              <span>
                Vous êtes sur une autoroute si vous voyez des panneaux bleus avec un numéro « A », des bornes orange d&apos;appel
                d&apos;urgence ou une bande d&apos;arrêt d&apos;urgence. Dans le doute, choisissez « Oui » : votre sécurité passe
                avant tout.
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-10">
        <PrimaryButton disabled={!ready} onClick={onNext}>
          Continuer
          <Icon name="arrowRight" size={22} strokeWidth={2.6} />
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Branche autoroute ───────────────────────────────────────────────────────

function HighwayStep({
  state,
  update,
  near,
  message,
  phone,
  whatsappLink,
  onNext,
}: {
  state: FlowState;
  update: (patch: Partial<FlowState>) => void;
  near: GeoPoint | null;
  message: string;
  phone: PhoneLink | null;
  whatsappLink: string | null;
  onNext: () => void;
}) {
  const [unknown, setUnknown] = useState(false);
  useEffect(() => {
    // La position sur la voie est gardée pour information ; la prise en charge se fera hors autoroute.
    if (state.pickup && !state.highwayPosition) {
      update({ highwayPosition: state.pickup, pickup: null });
    }
  }, [state.pickup, state.highwayPosition, update]);
  return (
    <div>
      {/* Consignes de sécurité : encadré orange, sans aucune animation. */}
      <div className={cn(styles.safetyBox, "rounded-[6px] border-2 border-beacon-500 p-5 sm:p-6")}>
        <p className="flex items-center gap-2 text-lg font-extrabold text-beacon-400">
          <Icon name="alert" size={24} />
          Votre sécurité d&apos;abord
        </p>
        <ul className="mt-4 space-y-2.5 text-lg text-chalk">
          {[
            "Feux de détresse allumés, gilet enfilé avant de sortir.",
            "Tout le monde derrière la glissière de sécurité.",
            "Appelez depuis une borne orange ou le 112.",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <Icon name="check" size={20} strokeWidth={3} className="mt-1 shrink-0 text-beacon-400" />
              {item}
            </li>
          ))}
        </ul>
        <a
          href="tel:112"
          className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl px-5 font-extrabold text-beacon-400 shadow-[inset_0_0_0_1.5px_var(--color-beacon-500)] transition-colors hover:bg-beacon-500/10"
        >
          <Icon name="phone" size={20} strokeWidth={2.4} />
          Appeler le 112
        </a>
      </div>
      <p className="mt-6 text-lg leading-relaxed text-asphalt-200">{message}</p>

      <StepTitle
        className="mt-10 [&_h1]:text-[clamp(2.2rem,9vw,3.75rem)]"
        title="À quel endroit, hors de l'autoroute, pourrons-nous récupérer le véhicule ?"
        accent="hors de l'autoroute"
      />
      <p className="mt-4 text-[1.0625rem] text-asphalt-200">Par exemple : la sortie, le dépôt du dépanneur agréé, une station-service…</p>
      <div className="mt-6 space-y-4">
        <AddressInput
          label="Lieu de prise en charge hors autoroute"
          value={state.pickup}
          onChange={(place) => update({ pickup: place })}
          placeholder="Adresse ou ville de la sortie…"
          near={near}
        />
        <textarea
          value={state.handoverNote}
          onChange={(event) => update({ handoverNote: event.target.value })}
          placeholder="Précision utile (n° de sortie, nom du dépanneur agréé…)"
          rows={2}
          maxLength={200}
          className="w-full rounded-2xl border-2 border-chalk/15 bg-night-950/80 p-4 text-lg text-chalk outline-none placeholder:text-asphalt-400 focus:border-signal-500"
        />
      </div>
      <div className="mt-8 space-y-3">
        <PrimaryButton disabled={!state.pickup} onClick={onNext}>
          Continuer
          <Icon name="arrowRight" size={22} strokeWidth={2.6} />
        </PrimaryButton>
        <button type="button" onClick={() => setUnknown(true)} className="h-12 w-full font-bold text-asphalt-200 hover:text-chalk">
          Je ne sais pas encore
        </button>
      </div>
      {unknown ? (
        <div className={cn(styles.panel, "mt-4 p-5 sm:p-6")}>
          <p className="text-lg">
            Pas de souci. Mettez-vous en sécurité et contactez-nous quand le véhicule aura été sorti de l&apos;autoroute : nous
            organiserons la suite ensemble.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {phone ? (
              <a href={phone.href} className="flex h-14 items-center justify-center gap-2 rounded-2xl font-extrabold text-chalk shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-reflect)_30%,transparent)] hover:text-signal-400">
                <Icon name="phone" size={20} /> Appeler
              </a>
            ) : null}
            {whatsappLink ? (
              <a href={whatsappLink} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp font-extrabold text-asphalt-950">
                <WhatsAppIcon size={20} /> WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Étape 2 : destination ───────────────────────────────────────────────────

/** Petit tracé de l'épingle au drapeau, au-dessus du champ (décor). */
function TripSketch() {
  return (
    <svg viewBox="0 -6 400 66" className={styles.tripSketch} aria-hidden="true">
      <path d="M12 54H388" stroke="var(--color-chalk)" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="10 10" />
      <RoutePaths idPrefix="dropoff-sketch" mode="view" scale={0.75} legs={[{ key: "transport", style: "transport", d: "M30 50C110 50 150 14 214 22S318 50 368 46" }]} />
      <g transform="translate(30 50)">
        <PinGlyph />
      </g>
      <g transform="translate(370 47)">
        <FlagMark />
      </g>
    </svg>
  );
}

/** Drapeau à damier du tracé de destination (même dessin que le plan). */
function FlagMark() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="14" ry="5" fill="var(--color-signal-500)" fillOpacity="0.22" />
      <path d="M0 0V-31" stroke="var(--color-chalk)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M1 -31 H20 L15 -25 L20 -19 H1 Z" fill="var(--color-signal-500)" stroke="var(--color-night-950)" strokeWidth="1" strokeLinejoin="round" />
      <path d="M1 -31 H7 V-25 H1 Z M7 -25 H13 V-19 H7 Z" fill="var(--color-night-950)" opacity="0.85" />
    </g>
  );
}

function DropoffStep({
  state,
  update,
  near,
  onNext,
}: {
  state: FlowState;
  update: (patch: Partial<FlowState>) => void;
  near: GeoPoint | null;
  onNext: () => void;
}) {
  const ready = state.dropoffMode === "on_site" || state.dropoffMode === "unknown" || (state.dropoffMode === "address" && Boolean(state.dropoff));
  return (
    <div>
      <StepTitle title="Où doit aller le véhicule ?" accent="aller" subtitle="Garage, domicile ou toute autre adresse." />
      <div className="mt-6 space-y-4">
        <TripSketch />
        <AddressInput
          label="Destination du véhicule"
          value={state.dropoffMode === "address" ? state.dropoff : null}
          onChange={(place) => update({ dropoff: place, dropoffMode: place ? "address" : state.dropoffMode === "address" ? null : state.dropoffMode })}
          placeholder="Adresse du garage, de votre domicile…"
          near={near}
        />
        <div className="grid gap-3 pt-2">
          <Choice
            selected={state.dropoffMode === "on_site"}
            onClick={() => update({ dropoffMode: "on_site", dropoff: null })}
            icon={<Icon name="wrench" size={22} className="shrink-0 text-signal-400" />}
          >
            Pas besoin de transport
            <span className="block text-[0.9375rem] font-semibold text-asphalt-300">Dépannage sur place : batterie, roue…</span>
          </Choice>
          <Choice
            selected={state.dropoffMode === "unknown"}
            onClick={() => update({ dropoffMode: "unknown", dropoff: null })}
            icon={<Icon name="question" size={22} className="shrink-0 text-signal-400" />}
          >
            Je ne sais pas encore
            <span className="block text-[0.9375rem] font-semibold text-asphalt-300">Nous en parlerons au téléphone</span>
          </Choice>
        </div>
      </div>
      <div className="mt-10">
        <PrimaryButton disabled={!ready} onClick={onNext}>
          Continuer
          <Icon name="arrowRight" size={22} strokeWidth={2.6} />
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Étape 4 : problème ──────────────────────────────────────────────────────

function ProblemStep({
  state,
  update,
  catalog,
  towing,
  onNext,
  onChangeDropoff,
}: {
  state: FlowState;
  update: (patch: Partial<FlowState>) => void;
  catalog: PublicCatalog;
  towing: boolean;
  onNext: () => void;
  onChangeDropoff: () => void;
}) {
  const problem = catalog.problems.find((p) => p.code === state.problem);
  const hasRollingQuestion = towing && catalog.states.some((s) => s.code === "non_rolling");
  const parkingOption = catalog.details.find((d) => d.code === "parking");
  const onSiteMismatch = !towing && problem && !problem.onSitePossible;
  return (
    <div>
      <StepTitle title="Quel est le problème ?" accent="problème" />
      {/* Tableau de bord : à l'arrivée, tous les témoins s'allument un instant (mise du contact) ;
          le problème choisi reste allumé. */}
      <div className={cn(styles.dashboard, "mt-8 grid grid-cols-2 gap-1 sm:grid-cols-3")}>
        {catalog.problems.map((item, k) => {
          const selected = state.problem === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => update({ problem: item.code })}
              aria-pressed={selected}
              className={styles.voyantButton}
              style={{ "--k": k } as React.CSSProperties}
            >
              <span className="relative shrink-0">
                <Voyant
                  glyph={PROBLEM_VOYANTS[item.code] ?? "question"}
                  label={item.clientLabel}
                  showLabel={false}
                  lit={selected}
                  size={46}
                  tone={item.code === "accident" ? "red" : "amber"}
                />
                <span className={styles.ignition} aria-hidden="true" />
              </span>
              <span className={cn("text-[1.0625rem] font-bold leading-tight", selected ? "text-chalk" : "text-asphalt-100")}>{item.clientLabel}</span>
            </button>
          );
        })}
      </div>

      {onSiteMismatch ? (
        <div className={cn(styles.panel, "mt-6 p-4 shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-signal-500)_45%,transparent)]")}>
          <p className="font-semibold text-signal-300">Ce problème se règle rarement sur place. Un remorquage sera sans doute nécessaire.</p>
          <button type="button" onClick={onChangeDropoff} className="mt-1 min-h-12 font-bold text-signal-400 underline underline-offset-4">
            Indiquer une destination
          </button>
        </div>
      ) : null}

      {hasRollingQuestion && state.problem ? (
        <div className="mt-9">
          <h2 className="font-step text-step text-balance">Le véhicule peut-il rouler ?</h2>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {(
              [
                ["yes", "Oui", "rolling"],
                ["no", "Non", "nonRolling"],
                ["unknown", "Je ne sais pas", "question"],
              ] as const
            ).map(([value, label, pictogram]) => (
              <Answer key={value} selected={state.rolling === value} onClick={() => update({ rolling: value })} pictogram={<Icon name={pictogram} size={20} />}>
                {label}
              </Answer>
            ))}
          </div>
        </div>
      ) : null}

      {parkingOption && state.problem ? (
        <label className={cn(styles.panel, "mt-6 flex min-h-16 cursor-pointer items-center gap-4 px-4 py-3")}>
          <input
            type="checkbox"
            checked={state.parking}
            onChange={(event) => update({ parking: event.target.checked })}
            className="h-6 w-6 accent-[var(--color-signal-500)]"
          />
          <span className="flex-1 text-lg font-bold">
            Le véhicule est dans un parking
            <span className="block text-[0.9375rem] font-semibold text-asphalt-300">Souterrain, résidence, centre commercial…</span>
          </span>
          <Icon name="parking" size={24} className="text-signal-400" />
        </label>
      ) : null}

      <div className="mt-10">
        <PrimaryButton disabled={!state.problem || (hasRollingQuestion && !state.rolling)} onClick={onNext}>
          Voir le prix
          <Icon name="euro" size={22} strokeWidth={2.6} />
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Étape 5 : estimation ────────────────────────────────────────────────────

/** Attente du calcul : aucune attente artificielle ; au-delà de 4 s, Appeler et WhatsApp. */
function ComputingView({
  pending,
  failed,
  onSite,
  phone,
  whatsappLink,
  plan,
  onRetry,
}: {
  pending: boolean;
  failed: boolean;
  onSite: boolean;
  phone: PhoneLink | null;
  whatsappLink: string | null;
  plan: ReactNode;
  onRetry: () => void;
}) {
  const [slow, setSlow] = useState(false);
  const [wasPending, setWasPending] = useState(pending);
  if (pending !== wasPending) {
    setWasPending(pending);
    if (pending) setSlow(false);
  }
  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [pending]);

  return (
    <div aria-live="polite">
      <StepTitle title="Calcul en cours…" accent="en cours…" />
      <p className="text-lead mt-4 text-asphalt-200">Nous calculons le trajet réel de la dépanneuse.</p>
      {pending && slow ? (
        <div className={cn(styles.panel, "mt-6 p-4 sm:p-5")}>
          <p className="text-[1.0625rem] font-semibold text-chalk">Toujours en cours… Vous pouvez aussi nous appeler.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {phone ? (
              <a href={phone.href} className="flex h-14 items-center justify-center gap-2 rounded-2xl font-extrabold text-chalk shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-reflect)_30%,transparent)] hover:text-signal-400">
                <Icon name="phone" size={20} /> Appeler
              </a>
            ) : null}
            {whatsappLink ? (
              <a href={whatsappLink} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp font-extrabold text-asphalt-950">
                <WhatsAppIcon size={20} /> WhatsApp
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      {failed ? (
        <button type="button" onClick={onRetry} className="mt-5 min-h-12 font-bold text-signal-400 underline underline-offset-4">
          Relancer le calcul
        </button>
      ) : null}
      {/* Écran de navigation : le vrai plan (mobile ; sur ordinateur, il est dans la feuille de
          route) et les trois trajets qui se dessinent en boucle pendant l'attente. */}
      <div className={cn(styles.panel, styles.calcScreen, "mt-8 grid gap-4 p-3 sm:p-5")}>
        <div className="mx-auto w-full max-w-[22rem] lg:hidden">{plan}</div>
        <ThreeLegs mode={onSite ? "on_site" : "tow"} draw="loop" />
      </div>
    </div>
  );
}

function EstimateStep({
  state,
  pending,
  phone,
  whatsappLink,
  ticketLines,
  plan,
  recap,
  onRetry,
  onNext,
  onEdit,
}: {
  state: FlowState;
  pending: boolean;
  phone: PhoneLink | null;
  whatsappLink: string | null;
  ticketLines: string[];
  plan: ReactNode;
  /** Feuille de route repliée, sous les actions (téléphone). */
  recap: ReactNode;
  onRetry: () => void;
  onNext: () => void;
  onEdit: (step: Step) => void;
}) {
  const estimate = state.estimate;
  const narrow = useSyncExternalStore(subscribeNarrow, narrowSnapshot, narrowServerSnapshot);

  if (pending || !estimate) {
    return (
      <ComputingView
        pending={pending}
        failed={!pending && !estimate}
        onSite={state.dropoffMode === "on_site"}
        phone={phone}
        whatsappLink={whatsappLink}
        plan={plan}
        onRetry={onRetry}
      />
    );
  }

  return (
    <div aria-live="polite">
      {estimate.priceTtcCents !== null ? (
        <>
          <StepTitle className="[&_h1]:text-[clamp(2.5rem,10.5vw,4.25rem)]" title="Votre estimation" accent="estimation" />
          {/* Le vrai prix du serveur, imprimé au montage (450 ms), prix en haut ; texte immédiat.
              Téléphone : ticket compact, lignes repliées sous « Voir le détail » (elles s'ouvrent
              au toucher), pour que « Demander le dépannage » soit dans le premier écran.
              Ordinateur : les trois trajets du calcul et les boutons à côté du ticket, dans le
              premier écran (ticket un peu plus étroit entre 1 024 et 1 279 px). */}
          <div className="mt-5 sm:mt-7 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-end lg:gap-6 xl:grid-cols-[21rem_minmax(0,1fr)]">
            <div className={styles.ticketSlot}>
              <div className={styles.printer} aria-hidden="true" />
              <EstimateTicket
                priceCents={estimate.priceTtcCents}
                priceLabel="Prix estimé"
                lines={ticketLines}
                print="mount"
                odometer="mount"
                compact={narrow}
                linesSummary={narrow ? "Voir le détail" : undefined}
                footnote="TTC · confirmé par téléphone avant l'intervention"
              />
            </div>
            <div className="mt-6 space-y-3 sm:mt-7 lg:mt-0">
              <ThreeLegs
                className={cn(styles.panel, "mb-4 hidden px-4 pb-3 pt-2 lg:grid")}
                mode={estimate.serviceKind === "on_site" ? "on_site" : "tow"}
                km={{ aller: estimate.approachKm, transport: estimate.vehicleTripKm }}
                compact
              />
              <PrimaryButton onClick={onNext}>
                Demander le dépannage
                <Icon name="arrowRight" size={22} strokeWidth={2.6} />
              </PrimaryButton>
              <button type="button" onClick={() => onEdit("pickup")} className="h-12 w-full font-bold text-asphalt-200 hover:text-chalk">
                Modifier ma demande
              </button>
              <p className="pt-3 text-[0.9375rem] leading-relaxed text-asphalt-300">
                Estimation indicative établie avec les informations données
                {estimate.validUntil ? ", valable 30 minutes environ" : ""}. Le prix est confirmé avec vous avant l&apos;intervention.
              </p>
            </div>
          </div>
          {recap}
        </>
      ) : (
        <>
          <StepTitle title="On vous rappelle avec un prix" accent="avec un prix" />
          <div className={cn(styles.panel, "mt-6 p-5 sm:p-6")}>
            <p className="text-lg leading-relaxed text-asphalt-100">{estimate.message}</p>
          </div>
          <div className="mt-8 space-y-3">
            {estimate.quoteId ? (
              <PrimaryButton onClick={onNext}>
                Envoyer ma demande
                <Icon name="arrowRight" size={22} strokeWidth={2.6} />
              </PrimaryButton>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              {phone ? (
                <a href={phone.href} className="flex h-14 items-center justify-center gap-2 rounded-2xl font-extrabold shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-reflect)_30%,transparent)] hover:text-signal-400">
                  <Icon name="phone" size={20} /> Appeler
                </a>
              ) : null}
              {whatsappLink ? (
                <a href={whatsappLink} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp font-extrabold text-asphalt-950">
                  <WhatsAppIcon size={20} /> WhatsApp
                </a>
              ) : null}
            </div>
          </div>
          {recap}
        </>
      )}
    </div>
  );
}

// ─── Étape 6 : coordonnées et récapitulatif ──────────────────────────────────

function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[1.0625rem] font-bold">{label}</span>
      {hint ? <span className="ml-2 text-[0.9375rem] text-asphalt-300">{hint}</span> : null}
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-1.5 block text-[0.9375rem] font-semibold text-beacon-400">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "h-14 w-full rounded-2xl border-2 border-chalk/15 bg-night-950/80 px-4 text-lg font-semibold text-chalk outline-none placeholder:text-asphalt-400 focus:border-signal-500";

function ContactStep({
  state,
  update,
  vehicleLabel,
  problemLabel,
  pending,
  fieldErrors,
  priceChanged,
  onEdit,
  onSubmit,
}: {
  state: FlowState;
  update: (patch: Partial<FlowState>) => void;
  vehicleLabel: string | null;
  problemLabel: string | null;
  pending: boolean;
  fieldErrors: Record<string, string>;
  priceChanged: boolean;
  onEdit: (step: Step) => void;
  onSubmit: () => void;
}) {
  const [showDetails, setShowDetails] = useState(Boolean(state.details.brand || state.details.model || state.details.plate));
  const price = state.estimate?.priceTtcCents ?? null;
  const recap: SheetRow<Step>[] = [
    { kind: "pickup", label: "Prise en charge", value: state.pickup?.label ?? "—", target: "pickup" },
    {
      kind: "dropoff",
      label: "Destination",
      value: state.dropoffMode === "on_site" ? "Dépannage sur place" : state.dropoffMode === "unknown" ? "À préciser" : (state.dropoff?.label ?? "—"),
      target: "dropoff",
    },
    { kind: "vehicle", label: "Véhicule", value: vehicleLabel ?? "—", target: "vehicle", code: state.vehicle },
    { kind: "problem", label: "Problème", value: problemLabel ?? "—", target: "problem", code: state.problem },
  ];
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <StepTitle title="Vos coordonnées" accent="coordonnées" subtitle="Pour vous rappeler et confirmer le prix." />
      {priceChanged && price !== null ? (
        <div className={cn(styles.panel, "mt-6 p-4 shadow-[inset_0_0_0_2px_var(--color-signal-500)]")}>
          <p className="font-bold text-signal-300">
            L&apos;estimation a été recalculée : <span className="text-xl">{formatEurosShort(price)}</span>. Envoyez à nouveau pour
            confirmer.
          </p>
        </div>
      ) : null}
      <div className="mt-8 space-y-5">
        <Field label="Nom ou prénom" error={fieldErrors["contact.name"]}>
          <input
            className={inputClass}
            value={state.contact.name}
            autoComplete="name"
            onChange={(event) => update({ contact: { ...state.contact, name: event.target.value } })}
            placeholder="Votre nom"
          />
        </Field>
        <Field label="Téléphone" error={fieldErrors["contact.phone"]}>
          <input
            className={inputClass}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={state.contact.phone}
            onChange={(event) => update({ contact: { ...state.contact, phone: event.target.value } })}
            placeholder="06 12 34 56 78"
          />
        </Field>
        <Field label="Email" hint="facultatif" error={fieldErrors["contact.email"]}>
          <input
            className={inputClass}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={state.contact.email}
            onChange={(event) => update({ contact: { ...state.contact, email: event.target.value } })}
            placeholder="vous@exemple.fr"
          />
        </Field>

        {showDetails ? (
          <div className={cn(styles.panel, "grid gap-4 p-4 sm:grid-cols-3")}>
            <Field label="Marque">
              <input className={inputClass} value={state.details.brand} onChange={(e) => update({ details: { ...state.details, brand: e.target.value } })} placeholder="Renault" />
            </Field>
            <Field label="Modèle">
              <input className={inputClass} value={state.details.model} onChange={(e) => update({ details: { ...state.details, model: e.target.value } })} placeholder="Clio" />
            </Field>
            <Field label="Immatriculation">
              <input
                className={`${inputClass} uppercase`}
                value={state.details.plate}
                onChange={(e) => update({ details: { ...state.details, plate: e.target.value } })}
                placeholder="AB-123-CD"
              />
            </Field>
          </div>
        ) : (
          <button type="button" onClick={() => setShowDetails(true)} className="flex min-h-12 items-center gap-2 text-left font-bold text-signal-400">
            <Icon name="plus" size={18} className="shrink-0" />
            Ajouter la marque, le modèle, l&apos;immatriculation (facultatif)
          </button>
        )}

        <Field label="Un détail à nous dire ?" hint="facultatif">
          <textarea
            className="w-full rounded-2xl border-2 border-chalk/15 bg-night-950/80 p-4 text-lg text-chalk outline-none placeholder:text-asphalt-400 focus:border-signal-500"
            rows={3}
            maxLength={1000}
            value={state.comment}
            onChange={(event) => update({ comment: event.target.value })}
            placeholder="Code du parking, étage, clés…"
          />
        </Field>

        {/* Champ piège invisible : seuls les robots le remplissent. */}
        <div className="hidden" aria-hidden="true">
          <label>
            Site web
            <input id="rnb-website" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </div>

      <RouteRecap rows={recap} price={price !== null ? formatEurosShort(price) : null} onEdit={onEdit} />

      <label className="mt-6 flex cursor-pointer items-start gap-4">
        <input
          type="checkbox"
          checked={state.consent}
          onChange={(event) => update({ consent: event.target.checked })}
          className="mt-1 h-6 w-6 shrink-0 accent-[var(--color-signal-500)]"
        />
        <span className="text-[1.0625rem] text-asphalt-200">
          J&apos;accepte que RNB AUTO utilise ces informations pour me rappeler et organiser l&apos;intervention.{" "}
          <Link href="/confidentialite" className="font-semibold text-signal-400 underline underline-offset-4">
            En savoir plus
          </Link>
        </span>
      </label>
      {fieldErrors.consent ? <p className="mt-2 text-[0.9375rem] font-semibold text-beacon-400">{fieldErrors.consent}</p> : null}

      <div className="mt-8">
        <PrimaryButton type="submit" disabled={pending || !state.consent || state.contact.name.trim().length < 2 || state.contact.phone.trim().length < 6}>
          {pending ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-asphalt-950 border-t-transparent" />
              Envoi…
            </>
          ) : (
            <>
              Envoyer ma demande
              <Icon name="arrowRight" size={22} strokeWidth={2.6} />
            </>
          )}
        </PrimaryButton>
      </div>
    </form>
  );
}

// ─── Étape 7 : demande reçue ─────────────────────────────────────────────────

function DoneStep({
  reference,
  photoToken,
  phone,
  whatsappLink,
  contactPhone,
  highway,
  price,
  ticketLines,
  onRestart,
}: {
  reference: string | null;
  photoToken: string | null;
  phone: PhoneLink | null;
  whatsappLink: string | null;
  contactPhone: string;
  highway: boolean;
  price: number | null;
  ticketLines: string[];
  onRestart: () => void;
}) {
  return (
    <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-20">
      <div className="text-center lg:text-left">
        {/* Pastille : un seul balayage de gyrophare derrière elle, puis plus rien ne bouge. */}
        <div className={cn(styles.doneBadge, "mx-auto lg:mx-0")} aria-hidden="true">
          <span className={styles.doneHalo} />
          <span className={styles.doneSweep} />
          <span className={styles.doneDisc}>
            <Icon name="check" size={52} strokeWidth={3} />
          </span>
        </div>
        <StepTitle className="mt-8" title="Demande reçue !" accent="reçue" />
        {reference ? (
          <p className="mt-6">
            <span className={styles.referencePlate}>
              <span className={styles.referenceBand} aria-hidden="true">
                <Icon name="losange" size={14} strokeWidth={2.4} />
              </span>
              <span className="text-[1.0625rem] text-asphalt-200">
                Demande n° <strong className="font-figure text-[1.375rem] tracking-[0.04em] text-signal-400">{reference}</strong>
              </span>
            </span>
          </p>
        ) : null}
        <p className="mx-auto mt-5 max-w-md text-xl text-chalk lg:mx-0">
          Nous vous rappelons dans quelques minutes{contactPhone ? <> au {formatPhone(contactPhone)}</> : null} pour confirmer le prix.
        </p>
        {photoToken ? (
          <div className={cn(styles.panel, "mx-auto mt-10 max-w-md p-5 text-left lg:mx-0")}>
            <p className="flex items-center gap-2.5 font-extrabold">
              <Icon name="camera" size={20} className="text-signal-400" />
              Des photos du véhicule ? (facultatif)
            </p>
            <p className="mb-4 mt-1 text-[0.9375rem] text-asphalt-300">Elles nous aident à venir avec le bon matériel. Elles restent privées.</p>
            <PhotoUploader token={photoToken} max={PHOTO_LIMITS.perIntervention} frame="viewfinder" />
          </div>
        ) : null}
        <div className="mx-auto mt-6 grid max-w-md gap-3 lg:mx-0">
          {whatsappLink ? (
            <a href={whatsappLink} className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-whatsapp text-lg font-extrabold text-asphalt-950">
              <WhatsAppIcon size={22} />
              {photoToken ? "Nous écrire sur WhatsApp" : "Envoyer des photos sur WhatsApp"}
            </a>
          ) : null}
          {phone ? (
            <a href={phone.href} className="flex h-16 items-center justify-center gap-3 rounded-2xl text-lg font-extrabold shadow-[inset_0_0_0_2px_color-mix(in_srgb,var(--color-reflect)_22%,transparent)] hover:text-signal-400">
              <Icon name="phone" size={22} />
              Appeler {phone.display}
            </a>
          ) : null}
        </div>
        <button type="button" onClick={onRestart} className="mt-8 min-h-12 font-bold text-asphalt-200 underline underline-offset-4 hover:text-chalk">
          Faire une nouvelle demande
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-md gap-8 lg:mx-0 lg:pt-4">
        {price !== null ? (
          <div className={styles.ticketSlot}>
            <div className={styles.printer} aria-hidden="true" />
            <EstimateTicket
              priceCents={price}
              priceLabel="Prix estimé"
              lines={ticketLines}
              stamp="recue"
              print="mount"
              odometer="none"
              footnote="TTC · confirmé par téléphone avant l'intervention"
            />
          </div>
        ) : null}
        <div className={cn(styles.panel, "p-6 text-left")}>
          <p className="font-plate text-plate text-signal-500">En attendant</p>
          <ul className="mt-4 space-y-3 text-[1.0625rem] text-asphalt-200">
            {(highway
              ? ["Restez derrière la glissière de sécurité.", "Gardez votre téléphone à portée de main.", "Prévenez-nous dès que le véhicule est sorti de l'autoroute."]
              : ["Allumez vos feux de détresse si le véhicule gêne la circulation.", "Mettez-vous en sécurité, hors de la chaussée.", "Préparez les clés et les papiers du véhicule."]
            ).map((tip) => (
              <li key={tip} className="flex gap-3">
                <Icon name="check" size={18} strokeWidth={3} className="mt-1 shrink-0 text-signal-500" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
