"use client";

/**
 * Parcours de demande de dépannage : une question par écran, prix affiché en moins d'une minute.
 * La saisie est gardée dans l'onglet (coupure réseau, rechargement). Le bouton « retour » du
 * téléphone revient à l'étape précédente. Appeler et WhatsApp restent toujours accessibles.
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { whatsappHref, whatsappRequestMessage, type PhoneLink } from "@/core/contact";
import { formatEurosShort, formatKm, formatPhone } from "@/core/format";
import type { ClientEstimate } from "@/core/quotes/client-view";
import type { GeoPoint, Place, QuoteRequestInput } from "@/core/quotes/types";
import { estimateAction, submitRequestAction } from "@/app/(public)/demande/actions";
import type { PublicCatalog } from "@/server/site/catalog";
import { TowTruck } from "@/components/brand/tow-truck";
import { SITUATION_ICONS, VehicleIcon } from "@/components/brand/vehicle-icon";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import { AddressInput, useGeolocation } from "./address-input";

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
  startedAt: number;
};

const STORAGE_KEY = "rnb-demande-v1";
const PROGRESS: Step[] = ["pickup", "dropoff", "vehicle", "problem", "estimate", "contact"];

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
};

export function RequestFlow({ catalog, phone, whatsapp, regulatedRoads, depot, startOnHighway }: Props) {
  const [state, setState] = useState<FlowState>(() => initialState(startOnHighway));
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [priceChanged, setPriceChanged] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const update = useCallback((patch: Partial<FlowState>) => setState((s) => ({ ...s, ...patch })), []);

  // Reprise d'une saisie en cours (coupure réseau, rechargement de la page).
  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FlowState;
        if (parsed && parsed.step && !(startOnHighway && parsed.step === "pickup")) {
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
    window.requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
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
        update({ reference: result.reference, step: "done" });
        window.history.replaceState({ ...(window.history.state ?? {}), rnbStep: "done" }, "");
        topRef.current?.scrollIntoView({ behavior: "smooth" });
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

  return (
    <div ref={topRef} className="mx-auto w-full max-w-2xl scroll-mt-24 px-4 pb-36 pt-24 sm:px-6 md:pb-20 lg:pt-32">
      {state.step !== "done" ? (
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            {state.step !== "pickup" ? (
              <button type="button" onClick={back} className="flex h-11 items-center gap-1.5 rounded-full pr-3 font-bold text-asphalt-200 hover:text-chalk">
                <Icon name="arrowLeft" size={20} />
                Retour
              </button>
            ) : (
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-signal-500">Demande de dépannage</span>
            )}
            <span className="text-sm font-semibold text-asphalt-300 tabular">
              Étape {Math.min(progressIndex + 1, PROGRESS.length)} sur {PROGRESS.length}
            </span>
          </div>
          <div className="mt-4 flex gap-1.5" aria-hidden="true">
            {PROGRESS.map((step, index) => (
              <span
                key={step}
                className={cn("h-1.5 flex-1 rounded-full transition-colors duration-500", index <= progressIndex ? "bg-signal-500" : "bg-white/10")}
              />
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div role="alert" className="mb-6 flex gap-3 rounded-2xl border border-beacon-500/40 bg-beacon-500/10 p-4 text-beacon-400">
          <Icon name="alert" size={22} className="shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : null}

      <div key={state.step} className="animate-fade-up">
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
            <StepTitle title="Quel véhicule ?" />
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {catalog.vehicles.map((vehicle) => (
                <button
                  key={vehicle.code}
                  type="button"
                  onClick={() => {
                    update({ vehicle: vehicle.code });
                    goTo("problem");
                  }}
                  className={cn(
                    "group flex min-h-32 flex-col items-center justify-center gap-2 rounded-3xl border-2 p-4 text-center transition-colors [--wheel-bg:var(--color-asphalt-850)]",
                    state.vehicle === vehicle.code ? "border-signal-500 bg-signal-500/10" : "border-white/10 bg-asphalt-850 hover:border-white/30",
                  )}
                >
                  <VehicleIcon code={vehicle.code} className="h-12 w-20 text-signal-400 transition-transform group-hover:scale-105" />
                  <span className="text-base font-bold leading-tight">{vehicle.label}</span>
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
          <DoneStep reference={state.reference} phone={phone} whatsappLink={whatsappLink} contactPhone={state.contact.phone} highway={state.onHighway === "yes"} onRestart={restart} />
        ) : null}
      </div>

      {state.step !== "done" ? (
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm text-asphalt-300">
          <span>Plus simple de nous parler ?</span>
          {phone ? (
            <a href={phone.href} className="flex items-center gap-1.5 font-bold text-signal-400">
              <Icon name="phone" size={16} /> {phone.display}
            </a>
          ) : null}
          {whatsappLink ? (
            <a href={whatsappLink} className="flex items-center gap-1.5 font-bold text-whatsapp">
              <WhatsAppIcon size={16} /> WhatsApp
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── Éléments communs ────────────────────────────────────────────────────────

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="font-display text-[clamp(2.8rem,12vw,4.5rem)] leading-[0.92]">{title}</h1>
      {subtitle ? <p className="mt-3 text-lg text-asphalt-300">{subtitle}</p> : null}
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick, type = "button" }: { children: React.ReactNode; disabled?: boolean; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-signal-500 px-6 text-lg font-extrabold text-asphalt-950 shadow-[0_14px_40px_-12px_rgb(255_196_0_/_0.6)] transition-transform active:scale-[0.98] disabled:bg-asphalt-700 disabled:text-asphalt-400 disabled:shadow-none"
    >
      {children}
    </button>
  );
}

function Choice({ selected, onClick, children, icon }: { selected: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex min-h-16 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold transition-colors",
        selected ? "border-signal-500 bg-signal-500/10 text-chalk" : "border-white/10 bg-asphalt-850 text-asphalt-100 hover:border-white/30",
      )}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {selected ? <Icon name="checkCircle" size={22} className="shrink-0 text-signal-500" /> : null}
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
  return (
    <div>
      <StepTitle title="Où êtes-vous ?" subtitle="Le lieu où se trouve le véhicule." />
      <div className="mt-8 space-y-4">
        <button
          type="button"
          onClick={async () => {
            const place = await locate();
            if (place) update({ pickup: place });
          }}
          disabled={geo.status === "locating"}
          className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl border-2 border-signal-500 bg-signal-500/10 text-lg font-extrabold text-signal-400 transition-colors hover:bg-signal-500/20 disabled:opacity-70"
        >
          {geo.status === "locating" ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-signal-400 border-t-transparent" />
              Localisation en cours…
            </>
          ) : (
            <>
              <Icon name="locate" size={22} />
              Utiliser ma position
            </>
          )}
        </button>
        {geo.status === "error" ? <p className="text-sm font-semibold text-beacon-400">{geo.message}</p> : null}
        <div className="flex items-center gap-4 text-sm font-semibold uppercase tracking-widest text-asphalt-400">
          <span className="h-px flex-1 bg-white/10" />
          ou
          <span className="h-px flex-1 bg-white/10" />
        </div>
        <AddressInput
          label="Adresse où se trouve le véhicule"
          value={state.pickup}
          onChange={(place) => update({ pickup: place })}
          placeholder="Adresse, rue, ville…"
          near={near}
        />
        {state.pickup?.source === "gps" ? (
          <p className="flex items-center gap-2 text-sm text-asphalt-300">
            <Icon name="checkCircle" size={16} className="text-whatsapp" />
            Position trouvée. Vérifiez l&apos;adresse ci-dessus.
          </p>
        ) : null}
      </div>

      {regulatedRoads.enabled && state.pickup ? (
        <div className="mt-10 animate-fade-up">
          <h2 className="text-2xl font-extrabold">Êtes-vous sur une autoroute ou une voie rapide ?</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(
              [
                ["no", "Non"],
                ["yes", "Oui"],
                ["unsure", "Je ne sais pas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ onHighway: value })}
                aria-pressed={state.onHighway === value}
                className={cn(
                  "h-16 rounded-2xl border-2 text-base font-extrabold transition-colors",
                  state.onHighway === value ? "border-signal-500 bg-signal-500 text-asphalt-950" : "border-white/10 bg-asphalt-850 text-chalk hover:border-white/30",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {state.onHighway === "unsure" ? (
            <p className="mt-4 rounded-2xl bg-asphalt-850 p-4 text-asphalt-200">
              Vous êtes sur une autoroute si vous voyez des panneaux bleus avec un numéro « A », des bornes orange d&apos;appel
              d&apos;urgence ou une bande d&apos;arrêt d&apos;urgence. Dans le doute, choisissez « Oui » : votre sécurité passe
              avant tout.
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
      <div className="rounded-3xl border-2 border-beacon-500 bg-beacon-500/10 p-6">
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
      </div>
      <p className="mt-6 text-lg leading-relaxed text-asphalt-200">{message}</p>

      <h1 className="font-display mt-10 text-[clamp(2.2rem,9vw,3.6rem)] leading-[0.95]">
        À quel endroit, hors de l&apos;autoroute, pourrons-nous récupérer le véhicule ?
      </h1>
      <p className="mt-3 text-asphalt-300">Par exemple : la sortie, le dépôt du dépanneur agréé, une station-service…</p>
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
          className="w-full rounded-2xl border-2 border-white/15 bg-asphalt-850 p-4 text-lg text-chalk outline-none placeholder:text-asphalt-400 focus:border-signal-500"
        />
      </div>
      <div className="mt-8 space-y-3">
        <PrimaryButton disabled={!state.pickup} onClick={onNext}>
          Continuer
          <Icon name="arrowRight" size={22} strokeWidth={2.6} />
        </PrimaryButton>
        <button type="button" onClick={() => setUnknown(true)} className="h-12 w-full font-bold text-asphalt-300 hover:text-chalk">
          Je ne sais pas encore
        </button>
      </div>
      {unknown ? (
        <div className="mt-4 rounded-3xl bg-asphalt-850 p-6 animate-fade-up">
          <p className="text-lg">
            Pas de souci. Mettez-vous en sécurité et contactez-nous quand le véhicule aura été sorti de l&apos;autoroute : nous
            organiserons la suite ensemble.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {phone ? (
              <a href={phone.href} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-signal-500 font-extrabold text-asphalt-950">
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
      <StepTitle title="Où doit aller le véhicule ?" subtitle="Garage, domicile ou toute autre adresse." />
      <div className="mt-8 space-y-4">
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
            <span className="block text-sm font-semibold text-asphalt-300">Dépannage sur place : batterie, roue…</span>
          </Choice>
          <Choice
            selected={state.dropoffMode === "unknown"}
            onClick={() => update({ dropoffMode: "unknown", dropoff: null })}
            icon={<Icon name="question" size={22} className="shrink-0 text-signal-400" />}
          >
            Je ne sais pas encore
            <span className="block text-sm font-semibold text-asphalt-300">Nous en parlerons au téléphone</span>
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
      <StepTitle title="Quel est le problème ?" />
      <div className="mt-8 grid grid-cols-2 gap-3">
        {catalog.problems.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => update({ problem: item.code })}
            aria-pressed={state.problem === item.code}
            className={cn(
              "flex min-h-28 flex-col items-start justify-between gap-3 rounded-3xl border-2 p-4 text-left transition-colors",
              state.problem === item.code ? "border-signal-500 bg-signal-500/10" : "border-white/10 bg-asphalt-850 hover:border-white/30",
            )}
          >
            <Icon name={SITUATION_ICONS[item.code] ?? "question"} size={28} className="text-signal-400" />
            <span className="text-base font-bold leading-tight">{item.clientLabel}</span>
          </button>
        ))}
      </div>

      {onSiteMismatch ? (
        <div className="mt-6 rounded-2xl border border-signal-500/40 bg-signal-500/10 p-4">
          <p className="font-semibold text-signal-300">Ce problème se règle rarement sur place. Un remorquage sera sans doute nécessaire.</p>
          <button type="button" onClick={onChangeDropoff} className="mt-2 font-bold text-signal-400 underline underline-offset-4">
            Indiquer une destination
          </button>
        </div>
      ) : null}

      {hasRollingQuestion && state.problem ? (
        <div className="mt-8 animate-fade-up">
          <h2 className="text-2xl font-extrabold">Le véhicule peut-il rouler ?</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {(
              [
                ["yes", "Oui"],
                ["no", "Non"],
                ["unknown", "Je ne sais pas"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => update({ rolling: value })}
                aria-pressed={state.rolling === value}
                className={cn(
                  "h-16 rounded-2xl border-2 text-base font-extrabold transition-colors",
                  state.rolling === value ? "border-signal-500 bg-signal-500 text-asphalt-950" : "border-white/10 bg-asphalt-850 hover:border-white/30",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {parkingOption && state.problem ? (
        <label className="mt-6 flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border-2 border-white/10 bg-asphalt-850 px-4 py-3">
          <input
            type="checkbox"
            checked={state.parking}
            onChange={(event) => update({ parking: event.target.checked })}
            className="h-6 w-6 accent-[var(--color-signal-500)]"
          />
          <span className="flex-1 text-lg font-bold">
            Le véhicule est dans un parking
            <span className="block text-sm font-semibold text-asphalt-300">Souterrain, résidence, centre commercial…</span>
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

function useCountUp(target: number | null, duration = 900): number | null {
  const [value, setValue] = useState<number | null>(target);
  useEffect(() => {
    if (target === null) {
      setValue(null);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function EstimateStep({
  state,
  pending,
  phone,
  whatsappLink,
  onRetry,
  onNext,
  onEdit,
}: {
  state: FlowState;
  pending: boolean;
  phone: PhoneLink | null;
  whatsappLink: string | null;
  onRetry: () => void;
  onNext: () => void;
  onEdit: (step: Step) => void;
}) {
  const estimate = state.estimate;
  const euros = useCountUp(estimate?.priceTtcCents !== null && estimate?.priceTtcCents !== undefined ? Math.round(estimate.priceTtcCents / 100) : null);

  if (pending || !estimate) {
    return (
      <div className="py-6 text-center" aria-live="polite">
        <StepTitle title="Calcul en cours…" />
        <div className="relative mx-auto mt-10 h-36 max-w-md overflow-hidden rounded-3xl bg-asphalt-850">
          <div className="absolute inset-x-0 bottom-6 h-1 animate-road-x bg-[repeating-linear-gradient(90deg,rgb(245_243_238_/_0.6)_0_40px,transparent_40px_80px)]" />
          <div className="absolute bottom-7 left-1/2 w-64 -translate-x-1/2">
            <TowTruck moving headlights id="estimate-truck" />
          </div>
        </div>
        <p className="mt-6 text-lg text-asphalt-300">Nous calculons le trajet réel de la dépanneuse.</p>
        {!pending && !estimate ? (
          <button type="button" onClick={onRetry} className="mt-6 font-bold text-signal-400 underline underline-offset-4">
            Relancer le calcul
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div aria-live="polite">
      {estimate.priceTtcCents !== null ? (
        <>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-signal-500">Votre estimation</p>
          <div className="mt-4 overflow-hidden rounded-[2rem] border border-white/10 bg-asphalt-850">
            <div className="p-6 sm:p-8">
              <p className="text-lg text-asphalt-300">Prix estimé</p>
              <p className="font-display mt-2 text-[clamp(5rem,26vw,8.5rem)] leading-none text-signal-500 tabular animate-pop">
                {euros ?? 0}
                <span className="ml-2 text-[0.45em]">€</span>
              </p>
              <p className="mt-2 font-semibold text-asphalt-200">TTC · confirmé par téléphone avant l&apos;intervention</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {estimate.vehicleTripKm !== null ? (
                  <div className="rounded-2xl bg-asphalt-800 p-4">
                    <p className="text-sm text-asphalt-300">Trajet de votre véhicule</p>
                    <p className="mt-1 text-2xl font-extrabold tabular">{formatKm(estimate.vehicleTripKm)}</p>
                  </div>
                ) : null}
                {estimate.approachKm !== null ? (
                  <div className="rounded-2xl bg-asphalt-800 p-4">
                    <p className="text-sm text-asphalt-300">Depuis notre dépôt</p>
                    <p className="mt-1 text-2xl font-extrabold tabular">{formatKm(estimate.approachKm)}</p>
                  </div>
                ) : null}
              </div>
            </div>
            {estimate.includedLabels.length > 0 ? (
              <div className="border-t border-white/10 bg-asphalt-900/60 p-6 sm:px-8">
                <p className="text-sm font-bold uppercase tracking-[0.15em] text-asphalt-300">Pris en compte</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {estimate.includedLabels.map((label) => (
                    <li key={label} className="flex items-center gap-1.5 rounded-full bg-asphalt-800 px-3 py-1.5 text-sm font-semibold">
                      <Icon name="check" size={14} strokeWidth={3} className="text-signal-500" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <p className="mt-4 text-sm text-asphalt-400">
            Estimation indicative établie avec les informations données
            {estimate.validUntil ? ", valable 30 minutes environ" : ""}. Le prix est confirmé avec vous avant l&apos;intervention.
          </p>
          <div className="mt-8 space-y-3">
            <PrimaryButton onClick={onNext}>
              Demander le dépannage
              <Icon name="arrowRight" size={22} strokeWidth={2.6} />
            </PrimaryButton>
            <button type="button" onClick={() => onEdit("pickup")} className="h-12 w-full font-bold text-asphalt-300 hover:text-chalk">
              Modifier ma demande
            </button>
          </div>
        </>
      ) : (
        <>
          <StepTitle title="On vous rappelle avec un prix" />
          <div className="mt-6 rounded-3xl border border-white/10 bg-asphalt-850 p-6">
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
                <a href={phone.href} className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-white/15 font-extrabold">
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
      <span className="text-base font-bold">{label}</span>
      {hint ? <span className="ml-2 text-sm text-asphalt-400">{hint}</span> : null}
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-1.5 block text-sm font-semibold text-beacon-400">{error}</span> : null}
    </label>
  );
}

const inputClass =
  "h-14 w-full rounded-2xl border-2 border-white/15 bg-asphalt-850 px-4 text-lg font-semibold text-chalk outline-none placeholder:text-asphalt-500 focus:border-signal-500";

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
  const recap: { label: string; value: string; step: Step }[] = [
    { label: "Prise en charge", value: state.pickup?.label ?? "—", step: "pickup" },
    {
      label: "Destination",
      value: state.dropoffMode === "on_site" ? "Dépannage sur place" : state.dropoffMode === "unknown" ? "À préciser" : (state.dropoff?.label ?? "—"),
      step: "dropoff",
    },
    { label: "Véhicule", value: vehicleLabel ?? "—", step: "vehicle" },
    { label: "Problème", value: problemLabel ?? "—", step: "problem" },
  ];
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <StepTitle title="Vos coordonnées" subtitle="Pour vous rappeler et confirmer le prix." />
      {priceChanged && price !== null ? (
        <div className="mt-6 rounded-2xl border-2 border-signal-500 bg-signal-500/10 p-4">
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
          <div className="grid gap-4 rounded-3xl border border-white/10 p-4 sm:grid-cols-3">
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
          <button type="button" onClick={() => setShowDetails(true)} className="flex items-center gap-2 font-bold text-signal-400">
            <Icon name="plus" size={18} />
            Ajouter la marque, le modèle, l&apos;immatriculation (facultatif)
          </button>
        )}

        <Field label="Un détail à nous dire ?" hint="facultatif">
          <textarea
            className="w-full rounded-2xl border-2 border-white/15 bg-asphalt-850 p-4 text-lg text-chalk outline-none placeholder:text-asphalt-500 focus:border-signal-500"
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

      <div className="mt-10 rounded-3xl border border-white/10 bg-asphalt-850">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <p className="text-lg font-extrabold">Récapitulatif</p>
          {price !== null ? <p className="font-display text-4xl text-signal-500">{formatEurosShort(price)}</p> : null}
        </div>
        <dl className="divide-y divide-white/10">
          {recap.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 p-5">
              <div>
                <dt className="text-sm text-asphalt-300">{row.label}</dt>
                <dd className="mt-0.5 font-semibold">{row.value}</dd>
              </div>
              <button type="button" onClick={() => onEdit(row.step)} className="shrink-0 text-sm font-bold text-signal-400">
                Modifier
              </button>
            </div>
          ))}
        </dl>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-4">
        <input
          type="checkbox"
          checked={state.consent}
          onChange={(event) => update({ consent: event.target.checked })}
          className="mt-1 h-6 w-6 shrink-0 accent-[var(--color-signal-500)]"
        />
        <span className="text-asphalt-200">
          J&apos;accepte que RNB AUTO utilise ces informations pour me rappeler et organiser l&apos;intervention.{" "}
          <Link href="/confidentialite" className="font-semibold text-signal-400 underline underline-offset-4">
            En savoir plus
          </Link>
        </span>
      </label>
      {fieldErrors.consent ? <p className="mt-2 text-sm font-semibold text-beacon-400">{fieldErrors.consent}</p> : null}

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
  phone,
  whatsappLink,
  contactPhone,
  highway,
  onRestart,
}: {
  reference: string | null;
  phone: PhoneLink | null;
  whatsappLink: string | null;
  contactPhone: string;
  highway: boolean;
  onRestart: () => void;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-signal-500 text-asphalt-950 animate-pop">
        <Icon name="check" size={52} strokeWidth={3} />
      </div>
      <h1 className="font-display mt-8 text-[clamp(3rem,13vw,5rem)] leading-[0.92]">Demande reçue !</h1>
      {reference ? (
        <p className="mt-4 text-lg text-asphalt-200">
          Demande n° <strong className="tabular text-signal-400">{reference}</strong>
        </p>
      ) : null}
      <p className="mx-auto mt-4 max-w-md text-xl text-chalk">
        Nous vous rappelons dans quelques minutes{contactPhone ? <> au {formatPhone(contactPhone)}</> : null} pour confirmer le prix.
      </p>
      <div className="mx-auto mt-10 grid max-w-md gap-3">
        {whatsappLink ? (
          <a href={whatsappLink} className="flex h-16 items-center justify-center gap-3 rounded-2xl bg-whatsapp text-lg font-extrabold text-asphalt-950">
            <WhatsAppIcon size={22} />
            Envoyer des photos sur WhatsApp
          </a>
        ) : null}
        {phone ? (
          <a href={phone.href} className="flex h-16 items-center justify-center gap-3 rounded-2xl border-2 border-white/15 text-lg font-extrabold">
            <Icon name="phone" size={22} />
            Appeler {phone.display}
          </a>
        ) : null}
      </div>
      <div className="mx-auto mt-10 max-w-md rounded-3xl bg-asphalt-850 p-6 text-left">
        <p className="font-extrabold text-signal-400">En attendant</p>
        <ul className="mt-3 space-y-2 text-asphalt-200">
          {(highway
            ? ["Restez derrière la glissière de sécurité.", "Gardez votre téléphone à portée de main.", "Prévenez-nous dès que le véhicule est sorti de l'autoroute."]
            : ["Allumez vos feux de détresse si le véhicule gêne la circulation.", "Mettez-vous en sécurité, hors de la chaussée.", "Préparez les clés et les papiers du véhicule."]
          ).map((tip) => (
            <li key={tip} className="flex gap-2">
              <Icon name="check" size={18} strokeWidth={3} className="mt-1 shrink-0 text-signal-500" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={onRestart} className="mt-8 font-bold text-asphalt-300 underline underline-offset-4 hover:text-chalk">
        Faire une nouvelle demande
      </button>
    </div>
  );
}
