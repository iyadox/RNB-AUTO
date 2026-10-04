"use client";

/**
 * « Tester mes tarifs » et « Nouvelle demande (appel) » : on décrit l'intervention, le serveur
 * calcule (jamais le navigateur) et renvoie le détail complet. En mode appel, on enregistre
 * ensuite la demande avec les coordonnées du client.
 */
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { IsoWeekday } from "@/core/calendar/paris";
import { formatEuros, formatSignedEuros, WEEKDAY_LABELS } from "@/core/format";
import type { VehicleAcceptance, SituationGroup } from "@/core/pricing/types";
import type { Place, QuoteRequestInput } from "@/core/quotes/types";
import {
  createPhoneRequestAction,
  saveReferenceTripAction,
  simulateAction,
  type SimulationView,
  type TrialValues,
} from "@/app/admin/(espace)/tester/actions";
import { applyRecalculationAction } from "@/app/admin/(espace)/demandes/actions";
import { SITUATION_ICONS, VehicleIcon } from "@/components/brand/vehicle-icon";
import { FuelPriceInput, MoneyInput, NumberInput, PercentInput, Segmented, TextArea, TextInput, TimeInput, Toggle } from "@/components/admin/inputs";
import { MarginBadge, QuoteBreakdown } from "@/components/admin/quote-breakdown";
import { Alert, Badge, buttonClass } from "@/components/admin/ui";
import { AddressInput } from "@/components/request/address-input";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";

export type SimulatorVehicle = { code: string; label: string; acceptance: VehicleAcceptance; clientVisible: boolean };
export type SimulatorSituation = { code: string; label: string; group: SituationGroup; clientVisible: boolean };
export type TrialField = { code: string; label: string; kind: "fixed" | "per_km" | "percent"; value: number };

type LegDraft = { km: number; minutes: number };
type DropoffMode = "address" | "on_site" | "unknown";

/** Valeurs de départ (recalcul d'une demande existante). */
export type SimulatorInitial = {
  pickup: Place;
  onHighway: boolean;
  handoverNote: string;
  dropoffMode: DropoffMode;
  dropoff: Place | null;
  vehicle: string;
  situations: string[];
  when: { kind: "now" } | { kind: "simulated"; isoWeekday: IsoWeekday; time: string; holiday: boolean };
  manualLegs: { emptyOut: LegDraft; loaded: LegDraft | null; emptyBack: LegDraft } | null;
};

type Props = {
  mode: "simulator" | "phone" | "recalc";
  vehicles: SimulatorVehicle[];
  situations: SimulatorSituation[];
  now: { isoWeekday: IsoWeekday; time: string };
  depot: { lat: number; lng: number } | null;
  fuelPriceMillis: number;
  minimum: { enabled: boolean; amountCents: number };
  trialFields?: TrialField[];
  initial?: SimulatorInitial;
  interventionId?: string;
};

const SHORT_DAYS: Record<IsoWeekday, string> = { 1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven", 6: "Sam", 7: "Dim" };

const GROUPS: { group: SituationGroup; title: string; internal?: boolean }[] = [
  { group: "problem", title: "Problème" },
  { group: "state", title: "État du véhicule" },
  { group: "detail", title: "Particularités" },
];

function Step({ number, title, children, hint }: { number: number; title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-3xl border border-asphalt-200 bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-asphalt-900 text-sm font-extrabold text-signal-400">{number}</span>
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          {hint ? <p className="text-sm text-asphalt-500">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Chip({ active, onClick, icon, children, internal }: { active: boolean; onClick: () => void; icon: IconName; children: React.ReactNode; internal?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        "flex min-h-12 items-center gap-2 rounded-2xl border-2 px-3.5 py-2 text-left text-sm font-bold transition-colors",
        active ? "border-asphalt-900 bg-asphalt-900 text-chalk" : "border-asphalt-200 bg-white text-asphalt-800 hover:border-asphalt-400",
      )}
    >
      <Icon name={icon} size={18} className={active ? "text-signal-400" : "text-asphalt-400"} />
      <span>{children}</span>
      {internal ? <span className={cn("text-xs font-semibold", active ? "text-asphalt-300" : "text-asphalt-400")}>(interne)</span> : null}
    </button>
  );
}

export function QuoteSimulator({ mode, vehicles, situations, now, depot, fuelPriceMillis, minimum, trialFields = [], initial, interventionId }: Props) {
  const router = useRouter();
  const phone = mode === "phone";
  /** Saisie d'une vraie demande (appel ou recalcul) : options du terrain visibles. */
  const real = mode !== "simulator";
  const initialWhen = initial?.when ?? (phone ? { kind: "now" as const } : { kind: "simulated" as const, isoWeekday: now.isoWeekday, time: now.time, holiday: false });
  const [pickup, setPickup] = useState<Place | null>(initial?.pickup ?? null);
  const [onHighway, setOnHighway] = useState(initial?.onHighway ?? false);
  const [handoverNote, setHandoverNote] = useState(initial?.handoverNote ?? "");
  const [dropoffMode, setDropoffMode] = useState<DropoffMode>(initial?.dropoffMode ?? "address");
  const [dropoff, setDropoff] = useState<Place | null>(initial?.dropoff ?? null);
  const [whenMode, setWhenMode] = useState<"now" | "simulated">(initialWhen.kind);
  const [weekday, setWeekday] = useState<IsoWeekday>(initialWhen.kind === "simulated" ? initialWhen.isoWeekday : now.isoWeekday);
  const [time, setTime] = useState(initialWhen.kind === "simulated" ? initialWhen.time : now.time);
  const [holiday, setHoliday] = useState(initialWhen.kind === "simulated" ? initialWhen.holiday : false);
  const [vehicle, setVehicle] = useState(initial?.vehicle ?? vehicles.find((v) => v.acceptance === "accepted")?.code ?? vehicles[0]?.code ?? "");
  const [selected, setSelected] = useState<string[]>(initial?.situations ?? []);
  const [advanced, setAdvanced] = useState(Boolean(initial?.manualLegs));
  const [manualKm, setManualKm] = useState(Boolean(initial?.manualLegs));
  const [legs, setLegs] = useState<{ emptyOut: LegDraft; loaded: LegDraft; emptyBack: LegDraft }>({
    emptyOut: initial?.manualLegs?.emptyOut ?? { km: 10, minutes: 20 },
    loaded: initial?.manualLegs?.loaded ?? { km: 15, minutes: 25 },
    emptyBack: initial?.manualLegs?.emptyBack ?? { km: 10, minutes: 20 },
  });
  const [fuelOverride, setFuelOverride] = useState(false);
  const [fuel, setFuel] = useState(fuelPriceMillis);
  const [trialOn, setTrialOn] = useState(false);
  const [trialValues, setTrialValues] = useState<Record<string, number>>(() => Object.fromEntries(trialFields.map((f) => [f.code, f.value])));
  const [trialMinimum, setTrialMinimum] = useState(minimum.enabled ? minimum.amountCents : 0);
  const [trialFuel, setTrialFuel] = useState(fuelPriceMillis);

  const [view, setView] = useState<SimulationView | null>(null);
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const resultsRef = useRef<HTMLDivElement>(null);

  const request = useMemo((): QuoteRequestInput | null => {
    if (!pickup) return null;
    if (dropoffMode === "address" && !dropoff) return null;
    const note = handoverNote.trim();
    const overrides: QuoteRequestInput["overrides"] = {};
    if (manualKm) overrides.legs = { emptyOut: legs.emptyOut, loaded: dropoffMode === "address" ? legs.loaded : null, emptyBack: legs.emptyBack };
    if (fuelOverride) overrides.fuelPriceTtcMillis = fuel;
    return {
      pickup: { ...pickup, afterRegulatedRoad: onHighway, handoverNote: note || null },
      dropoff: dropoffMode === "address" && dropoff ? { kind: "address", place: dropoff } : dropoffMode === "on_site" ? { kind: "on_site" } : { kind: "unknown" },
      vehicleCategory: vehicle,
      situations: selected,
      when: whenMode === "now" ? { kind: "now" } : { kind: "simulated", isoWeekday: weekday, time, holiday },
      ...(overrides.legs || overrides.fuelPriceTtcMillis ? { overrides } : {}),
    };
  }, [pickup, dropoffMode, dropoff, onHighway, handoverNote, manualKm, legs, fuelOverride, fuel, vehicle, selected, whenMode, weekday, time, holiday]);

  const trial = useMemo((): TrialValues | null => {
    if (real || !trialOn) return null;
    const rules = trialFields.filter((f) => trialValues[f.code] !== undefined && trialValues[f.code] !== f.value).map((f) => ({ code: f.code, value: trialValues[f.code] as number }));
    const minimumChanged = trialMinimum !== (minimum.enabled ? minimum.amountCents : 0);
    const fuelChanged = trialFuel !== fuelPriceMillis;
    if (rules.length === 0 && !minimumChanged && !fuelChanged) return null;
    return { rules, ...(minimumChanged ? { minimumCents: trialMinimum } : {}), ...(fuelChanged ? { fuelPriceMillis: trialFuel } : {}) };
  }, [real, trialOn, trialFields, trialValues, trialMinimum, trialFuel, minimum, fuelPriceMillis]);

  const currentKey = JSON.stringify({ request, trial });
  const stale = view !== null && viewKey !== currentKey;

  const calculate = () => {
    setError(null);
    if (!request) {
      setError(!pickup ? "Indiquez où se trouve le véhicule." : "Indiquez la destination ou choisissez « Réparation sur place ».");
      return;
    }
    if (!vehicle) {
      setError("Choisissez le type de véhicule.");
      return;
    }
    const key = currentKey;
    startTransition(async () => {
      const response = await simulateAction({ request, trial, source: mode });
      if (!response.ok) {
        setError(response.message);
        return;
      }
      setView(response.view);
      setViewKey(key);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 50);
      }
    });
  };

  const toggleSituation = (code: string) => setSelected((list) => (list.includes(code) ? list.filter((c) => c !== code) : [...list, code]));

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid min-w-0 grid-cols-1 gap-4">
        <Step number={1} title="Où est le véhicule ?" hint={real ? "Adresse, ville ou point de repère donné par le client." : "Une ville suffit pour un essai (ex. Cergy)."}>
          <AddressInput value={pickup} onChange={setPickup} placeholder="Adresse, ville…" near={depot} tone="light" label="Où est le véhicule ?" />
          {real ? (
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between gap-4 rounded-2xl bg-asphalt-50 px-4 py-3">
                <span className="font-bold">Le client est sur une autoroute</span>
                <Toggle checked={onHighway} onChange={setOnHighway} label="Le client est sur une autoroute" />
              </label>
              {onHighway ? (
                <Alert tone="warn">
                  Nous ne pouvons pas intervenir directement sur l&apos;autoroute. Indiquez ci-dessus le point de prise en charge <strong>après la sortie</strong>, une
                  fois le véhicule évacué par le service autorisé.
                </Alert>
              ) : null}
              <TextInput value={handoverNote} onChange={setHandoverNote} ariaLabel="Précision sur le lieu" placeholder="Précision sur le lieu (parking, étage, repère…)" maxLength={200} />
            </div>
          ) : null}
        </Step>

        <Step number={2} title="Où faut-il l'emmener ?">
          <Segmented<DropoffMode>
            value={dropoffMode}
            onChange={(value) => setDropoffMode(value)}
            options={[
              { value: "address", label: "À une adresse" },
              { value: "on_site", label: "Réparation sur place" },
              ...(real ? [{ value: "unknown" as const, label: "Pas encore connu" }] : []),
            ]}
            ariaLabel="Destination"
          />
          {dropoffMode === "address" ? (
            <div className="mt-4">
              <AddressInput value={dropoff} onChange={setDropoff} placeholder="Garage, domicile, ville…" near={depot} tone="light" label="Destination" />
            </div>
          ) : (
            <p className="mt-3 text-sm text-asphalt-500">
              {dropoffMode === "on_site"
                ? "Pas de transport : la dépanneuse fait l'aller et le retour."
                : "Le prix du transport sera calculé plus tard (recalcul depuis la fiche de la demande)."}
            </p>
          )}
        </Step>

        <Step number={3} title="Quand ?" hint="Les majorations (nuit, dimanche, jours fériés) dépendent du moment.">
          <Segmented
            value={whenMode}
            onChange={setWhenMode}
            options={[
              { value: "now", label: "Maintenant" },
              { value: "simulated", label: "Choisir le jour et l'heure" },
            ]}
            ariaLabel="Moment de l'intervention"
          />
          {whenMode === "simulated" ? (
            <div className="mt-4 space-y-4">
              <div role="radiogroup" aria-label="Jour" className="grid grid-cols-7 gap-1.5">
                {([1, 2, 3, 4, 5, 6, 7] as IsoWeekday[]).map((day) => (
                  <button
                    key={day}
                    type="button"
                    role="radio"
                    aria-checked={weekday === day}
                    aria-label={WEEKDAY_LABELS[day]}
                    onClick={() => setWeekday(day)}
                    className={cn(
                      "h-12 rounded-xl text-sm font-extrabold transition-colors",
                      weekday === day ? "bg-asphalt-900 text-signal-400" : "bg-asphalt-100 text-asphalt-700 hover:bg-asphalt-200",
                    )}
                  >
                    {SHORT_DAYS[day]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold">Heure</span>
                  <TimeInput value={time} onChange={setTime} ariaLabel="Heure" />
                </div>
                <label className="flex items-center gap-3">
                  <span className="font-bold">Jour férié</span>
                  <Toggle checked={holiday} onChange={setHoliday} label="Jour férié" />
                </label>
              </div>
            </div>
          ) : null}
        </Step>

        <Step number={4} title="Quel véhicule ?">
          <div role="radiogroup" aria-label="Type de véhicule" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {vehicles.map((item) => (
              <button
                key={item.code}
                type="button"
                role="radio"
                aria-checked={vehicle === item.code}
                onClick={() => setVehicle(item.code)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-colors",
                  vehicle === item.code ? "border-asphalt-900 bg-asphalt-900 text-chalk" : "border-asphalt-200 bg-white hover:border-asphalt-400",
                )}
              >
                <VehicleIcon code={item.code} className={cn("h-8 w-14", vehicle === item.code ? "text-signal-400" : "text-asphalt-500")} />
                <span className="text-sm font-bold leading-tight">{item.label}</span>
                {item.acceptance !== "accepted" ? (
                  <span className={cn("text-[0.7rem] font-extrabold uppercase", vehicle === item.code ? "text-signal-300" : "text-asphalt-400")}>
                    {item.acceptance === "on_request" ? "Sur demande" : "Refusé"}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </Step>

        <Step number={5} title="Situation" hint="Plusieurs choix possibles. « Interne » : non proposé sur le site, ajouté par vous.">
          <div className="space-y-4">
            {GROUPS.map(({ group, title }) => {
              const items = situations.filter((s) => s.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <p className="mb-2 text-sm font-extrabold uppercase tracking-wide text-asphalt-500">{title}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Chip
                        key={item.code}
                        active={selected.includes(item.code)}
                        onClick={() => toggleSituation(item.code)}
                        icon={SITUATION_ICONS[item.code] ?? "question"}
                        internal={!item.clientVisible}
                      >
                        {item.label}
                      </Chip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Step>

        <section className="rounded-3xl border border-asphalt-200 bg-white">
          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            aria-expanded={advanced}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
          >
            <span>
              <span className="block text-lg font-extrabold">Plus d&apos;options</span>
              <span className="block text-sm text-asphalt-500">Kilomètres saisis à la main, autre prix du gazole.</span>
            </span>
            <Icon name="chevronDown" size={22} className={cn("shrink-0 transition-transform", advanced && "rotate-180")} />
          </button>
          {advanced ? (
            <div className="space-y-4 border-t border-asphalt-100 px-5 py-4">
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-bold">Saisir les kilomètres à la main</span>
                  <span className="block text-sm text-asphalt-500">Utile si le calcul d&apos;itinéraire ne répond pas.</span>
                </span>
                <Toggle checked={manualKm} onChange={setManualKm} label="Saisir les kilomètres à la main" />
              </label>
              {manualKm ? (
                <div className="grid gap-3 rounded-2xl bg-asphalt-50 p-4">
                  {(
                    [
                      ["emptyOut", "① Dépôt → véhicule (à vide)"],
                      ...(dropoffMode === "address" ? [["loaded", "② Transport du véhicule"] as const] : []),
                      ["emptyBack", "③ Retour au dépôt (à vide)"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-bold">{label}</span>
                      <div className="flex gap-2">
                        <NumberInput
                          value={legs[key].km}
                          onChange={(km) => setLegs((current) => ({ ...current, [key]: { ...current[key], km } }))}
                          unit="km"
                          decimals={1}
                          ariaLabel={`${label} : kilomètres`}
                          width="w-32"
                        />
                        <NumberInput
                          value={legs[key].minutes}
                          onChange={(minutes) => setLegs((current) => ({ ...current, [key]: { ...current[key], minutes } }))}
                          unit="min"
                          ariaLabel={`${label} : minutes`}
                          width="w-28"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-bold">Utiliser un autre prix du gazole</span>
                  <span className="block text-sm text-asphalt-500">Pour ce calcul seulement.</span>
                </span>
                <Toggle checked={fuelOverride} onChange={setFuelOverride} label="Utiliser un autre prix du gazole" />
              </label>
              {fuelOverride ? (
                <div className="flex justify-end">
                  <FuelPriceInput millis={fuel} onChange={setFuel} ariaLabel="Prix du gazole pour ce calcul" />
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {!real && trialFields.length > 0 ? (
          <section className={cn("rounded-3xl border-2 border-dashed p-5", trialOn ? "border-violet-300 bg-violet-50/60" : "border-asphalt-200 bg-white")}>
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-lg font-extrabold">Essai sans enregistrer</span>
                <span className="block text-sm text-asphalt-500">Changez des valeurs pour comparer. Vos tarifs ne changent pas.</span>
              </span>
              <Toggle checked={trialOn} onChange={setTrialOn} label="Essai sans enregistrer" size="lg" />
            </label>
            {trialOn ? (
              <div className="mt-4 grid gap-3">
                <TrialRow label="Prix minimum" changed={trialMinimum !== (minimum.enabled ? minimum.amountCents : 0)}>
                  <MoneyInput cents={trialMinimum} onChange={setTrialMinimum} ariaLabel="Essai : prix minimum" width="w-32" />
                </TrialRow>
                {trialFields.map((field) => (
                  <TrialRow key={field.code} label={field.label} changed={trialValues[field.code] !== field.value}>
                    {field.kind === "percent" ? (
                      <PercentInput
                        bp={trialValues[field.code] ?? field.value}
                        onChange={(bp) => setTrialValues((values) => ({ ...values, [field.code]: bp }))}
                        ariaLabel={`Essai : ${field.label}`}
                      />
                    ) : (
                      <MoneyInput
                        cents={trialValues[field.code] ?? field.value}
                        onChange={(cents) => setTrialValues((values) => ({ ...values, [field.code]: cents }))}
                        unit={field.kind === "per_km" ? "€/km" : "€"}
                        ariaLabel={`Essai : ${field.label}`}
                        width="w-32"
                      />
                    )}
                  </TrialRow>
                ))}
                <TrialRow label="Prix du gazole" changed={trialFuel !== fuelPriceMillis}>
                  <FuelPriceInput millis={trialFuel} onChange={setTrialFuel} ariaLabel="Essai : prix du gazole" />
                </TrialRow>
                <button
                  type="button"
                  className="justify-self-start text-sm font-bold text-violet-800 underline underline-offset-4"
                  onClick={() => {
                    setTrialValues(Object.fromEntries(trialFields.map((f) => [f.code, f.value])));
                    setTrialMinimum(minimum.enabled ? minimum.amountCents : 0);
                    setTrialFuel(fuelPriceMillis);
                  }}
                >
                  Remettre les valeurs actuelles
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <button type="button" onClick={calculate} disabled={pending} className={cn(buttonClass("primary", "lg"), "w-full text-xl uppercase tracking-wide")}>
          {pending ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-asphalt-950 border-t-transparent" aria-hidden="true" />
          ) : (
            <Icon name="euro" size={22} />
          )}
          {pending ? "Calcul en cours…" : "Calculer"}
        </button>
      </div>

      <div ref={resultsRef} className="scroll-mt-24 lg:sticky lg:top-6">
        {view ? (
          <Results
            view={view}
            stale={stale}
            mode={mode}
            interventionId={interventionId}
            onRecalculate={calculate}
            pending={pending}
            onDone={(id) => {
              router.push(`/admin/demandes/${id}`);
              router.refresh();
            }}
          />
        ) : (
          <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-asphalt-200 bg-white px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-asphalt-100 text-asphalt-500">
              <Icon name={phone ? "phone" : mode === "recalc" ? "refresh" : "flask"} size={28} />
            </span>
            <p className="mt-4 text-lg font-extrabold">{real ? "Le prix à annoncer s'affichera ici" : "Le détail du calcul s'affichera ici"}</p>
            <p className="mt-1 max-w-sm text-asphalt-500">Remplissez les étapes puis appuyez sur « Calculer ».</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TrialRow({ label, children, changed }: { label: string; children: React.ReactNode; changed?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
      <span className="min-w-0 flex-1 font-bold leading-snug">
        {label}
        {changed ? (
          <Badge tone="progress" className="ml-2 align-middle">
            modifié
          </Badge>
        ) : null}
      </span>
      <span className="shrink-0">{children}</span>
    </div>
  );
}

function Results({
  view,
  stale,
  mode,
  interventionId,
  pending,
  onRecalculate,
  onDone,
}: {
  view: SimulationView;
  stale: boolean;
  mode: Props["mode"];
  interventionId?: string;
  pending: boolean;
  onRecalculate: () => void;
  onDone: (interventionId: string) => void;
}) {
  const phone = mode === "phone";
  const result = view.result;
  const hiddenMessage = view.serviceMessage ?? view.client.message;
  return (
    <div className={cn("grid gap-4 transition-opacity", stale && "opacity-60")}>
      {stale ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-asphalt-900 px-4 py-3 text-chalk">
          <p className="font-bold">Vous avez changé des choix.</p>
          <button type="button" onClick={onRecalculate} disabled={pending} className={buttonClass("primary", "sm")}>
            <Icon name="refresh" size={16} />
            Recalculer
          </button>
        </div>
      ) : null}

      {result ? (
        <div className="rounded-3xl bg-asphalt-900 p-6 text-chalk">
          <p className="text-sm font-extrabold uppercase tracking-wide text-asphalt-300">{mode === "simulator" ? "Prix final client" : "Prix à annoncer au client"}</p>
          <p className="mt-1 text-5xl font-extrabold tabular text-signal-400">{formatEuros(result.totals.priceTtcCents)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <MarginBadge level={result.totals.marginLevel} />
            <span className="text-sm text-asphalt-300">
              Marge {formatSignedEuros(result.totals.marginCents)} · {result.km.total.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km au total · tarifs version{" "}
              {view.versionNumber}
            </span>
          </div>
        </div>
      ) : null}

      {hiddenMessage ? (
        <Alert tone="warn" title={result ? "Sur le site, le client ne verrait pas ce prix" : "Pas de prix automatique"}>
          « {hiddenMessage} »
          {view.context?.routingError ? <span className="mt-1 block text-sm">Détail : {view.context.routingError}</span> : null}
          {!result ? <span className="mt-1 block text-sm">Astuce : « Plus d&apos;options » → saisir les kilomètres à la main.</span> : null}
        </Alert>
      ) : null}

      {result && view.trialResult ? <TrialComparison current={result} trial={view.trialResult} /> : null}

      {result ? <QuoteBreakdown result={result} context={view.context} input={view.input} minimum={view.minimum} /> : null}

      {mode === "simulator" && result && view.quoteId ? <SaveReferenceTrip quoteId={view.quoteId} /> : null}
      {phone && view.quoteId ? <PhoneRequestForm key={view.quoteId} quoteId={view.quoteId} hasPrice={result !== null} disabled={stale} onCreated={onDone} /> : null}
      {mode === "recalc" && interventionId && view.quoteId ? (
        <ApplyRecalculation key={view.quoteId} interventionId={interventionId} quoteId={view.quoteId} hasPrice={result !== null} disabled={stale} onDone={onDone} />
      ) : null}
    </div>
  );
}

function TrialComparison({ current, trial }: { current: NonNullable<SimulationView["result"]>; trial: NonNullable<SimulationView["trialResult"]> }) {
  const rows: { label: string; a: number; b: number }[] = [
    { label: "Prix calculé", a: current.totals.computedPriceCents, b: trial.totals.computedPriceCents },
    { label: "Prix final client", a: current.totals.priceTtcCents, b: trial.totals.priceTtcCents },
    { label: "Coût pour l'entreprise", a: current.totals.internalCostCents, b: trial.totals.internalCostCents },
    { label: "Marge estimée", a: current.totals.marginCents, b: trial.totals.marginCents },
  ];
  return (
    <section className="rounded-3xl border-2 border-violet-300 bg-violet-50 p-5">
      <p className="flex items-center gap-2 text-base font-extrabold uppercase tracking-wide text-violet-900">
        <Icon name="flask" size={18} />
        Comparaison avec votre essai
      </p>
      <div className="mt-3 overflow-hidden rounded-2xl bg-white">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b border-asphalt-100 px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-asphalt-500">
          <span />
          <span className="text-right">Actuel</span>
          <span className="text-right">Essai</span>
          <span className="text-right">Écart</span>
        </div>
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-asphalt-100 px-4 py-2.5 last:border-0">
            <span className="text-sm font-semibold sm:text-base">{row.label}</span>
            <span className="text-right text-sm tabular sm:text-base">{formatEuros(row.a)}</span>
            <span className="text-right text-sm font-extrabold tabular sm:text-base">{formatEuros(row.b)}</span>
            <span className={cn("text-right text-sm font-extrabold tabular", row.b > row.a ? "text-green-700" : row.b < row.a ? "text-red-700" : "text-asphalt-400")}>
              {row.b === row.a ? "=" : formatSignedEuros(row.b - row.a)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm text-violet-900">
        <span>Avec l&apos;essai :</span>
        <MarginBadge level={trial.totals.marginLevel} />
      </div>
      <p className="mt-2 text-sm text-violet-900">Pour appliquer ces valeurs, modifiez-les dans « Mes tarifs ».</p>
    </section>
  );
}

function SaveReferenceTrip({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ tone: "good" | "danger"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <section className="rounded-3xl border border-asphalt-200 bg-white p-5">
      <p className="text-base font-extrabold uppercase tracking-wide">Garder ce trajet comme exemple</p>
      <p className="mt-0.5 text-sm text-asphalt-500">
        Il servira à montrer l&apos;effet de vos changements de tarifs avant de les enregistrer.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <TextInput value={name} onChange={setName} ariaLabel="Nom du trajet type" placeholder="Ex. Cergy → Montreuil, SUV, dimanche soir" maxLength={120} />
        <button
          type="button"
          disabled={pending || name.trim().length < 3}
          onClick={() =>
            startTransition(async () => {
              const response = await saveReferenceTripAction({ quoteId, name });
              setMessage(response.ok ? { tone: "good", text: "Trajet type enregistré." } : { tone: "danger", text: response.message });
              if (response.ok) {
                setName("");
                router.refresh();
              }
            })
          }
          className={cn(buttonClass("dark"), "shrink-0")}
        >
          <Icon name="plus" size={18} />
          Garder
        </button>
      </div>
      {message ? <p className={cn("mt-2 text-sm font-bold", message.tone === "good" ? "text-green-700" : "text-red-700")}>{message.text}</p> : null}
    </section>
  );
}

function PhoneRequestForm({ quoteId, hasPrice, disabled, onCreated }: { quoteId: string; hasPrice: boolean; disabled: boolean; onCreated: (id: string) => void }) {
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [vehicle, setVehicle] = useState({ brand: "", model: "", plate: "" });
  const [comment, setComment] = useState("");
  const [accept, setAccept] = useState(hasPrice);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const response = await createPhoneRequestAction({ quoteId, contact, vehicle, comment, accept });
      if (response.ok) {
        onCreated(response.id);
        return;
      }
      setErrors(response.fieldErrors ?? {});
      setMessage(response.message);
    });
  };

  const field = (key: string) => (errors[key] ? <p className="mt-1 text-sm font-bold text-red-700">{errors[key]}</p> : null);

  return (
    <section className="rounded-3xl border-2 border-asphalt-900 bg-white p-5">
      <p className="flex items-center gap-2 text-lg font-extrabold">
        <Icon name="user" size={20} />
        Coordonnées du client
      </p>
      <div className="mt-4 grid gap-3">
        <div>
          <TextInput value={contact.name} onChange={(name) => setContact((c) => ({ ...c, name }))} ariaLabel="Nom du client" placeholder="Nom ou prénom" autoComplete="off" maxLength={80} />
          {field("contact.name")}
        </div>
        <div>
          <TextInput value={contact.phone} onChange={(value) => setContact((c) => ({ ...c, phone: value }))} ariaLabel="Téléphone du client" placeholder="Téléphone" type="tel" autoComplete="off" maxLength={30} />
          {field("contact.phone")}
        </div>
        <div>
          <TextInput value={contact.email} onChange={(email) => setContact((c) => ({ ...c, email }))} ariaLabel="Email du client (facultatif)" placeholder="Email (facultatif)" type="email" autoComplete="off" maxLength={120} />
          {field("contact.email")}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <TextInput value={vehicle.brand} onChange={(brand) => setVehicle((v) => ({ ...v, brand }))} ariaLabel="Marque" placeholder="Marque" maxLength={40} />
          <TextInput value={vehicle.model} onChange={(model) => setVehicle((v) => ({ ...v, model }))} ariaLabel="Modèle" placeholder="Modèle" maxLength={40} />
          <TextInput value={vehicle.plate} onChange={(plate) => setVehicle((v) => ({ ...v, plate }))} ariaLabel="Immatriculation" placeholder="Immatriculation" maxLength={15} className="col-span-2 uppercase sm:col-span-1" />
        </div>
        <TextArea value={comment} onChange={setComment} ariaLabel="Remarque" placeholder="Remarque (facultatif)" maxLength={1000} rows={3} />
        {hasPrice ? (
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-asphalt-50 px-4 py-3">
            <span>
              <span className="block font-bold">Le client a accepté le prix</span>
              <span className="block text-sm text-asphalt-500">La demande passe directement en « Acceptée ».</span>
            </span>
            <Toggle checked={accept} onChange={setAccept} label="Le client a accepté le prix" />
          </label>
        ) : null}
      </div>
      {message ? (
        <div className="mt-3">
          <Alert tone="danger">{message}</Alert>
        </div>
      ) : null}
      <button type="button" onClick={submit} disabled={pending || disabled} className={cn(buttonClass("primary", "lg"), "mt-4 w-full")}>
        {pending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-asphalt-950 border-t-transparent" aria-hidden="true" /> : <Icon name="check" size={22} />}
        Créer la demande
      </button>
      {disabled ? <p className="mt-2 text-center text-sm font-bold text-asphalt-600">Recalculez d&apos;abord : vous avez changé des choix.</p> : null}
    </section>
  );
}

function ApplyRecalculation({
  interventionId,
  quoteId,
  hasPrice,
  disabled,
  onDone,
}: {
  interventionId: string;
  quoteId: string;
  hasPrice: boolean;
  disabled: boolean;
  onDone: (id: string) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <section className="rounded-3xl border-2 border-asphalt-900 bg-white p-5">
      <p className="text-lg font-extrabold">Utiliser ce calcul pour la demande ?</p>
      <p className="mt-1 text-asphalt-600">
        {hasPrice
          ? "Le prix de la demande sera remplacé. L'ancien calcul reste visible dans l'historique de la demande."
          : "Aucun prix n'a pu être calculé : la demande gardera ses choix mis à jour, sans prix."}
      </p>
      {message ? (
        <div className="mt-3">
          <Alert tone="danger">{message}</Alert>
        </div>
      ) : null}
      <button
        type="button"
        disabled={pending || disabled}
        onClick={() =>
          startTransition(async () => {
            const response = await applyRecalculationAction({ id: interventionId, quoteId });
            if (response.ok) onDone(interventionId);
            else setMessage(response.message);
          })
        }
        className={cn(buttonClass("primary", "lg"), "mt-4 w-full")}
      >
        <Icon name="check" size={22} />
        Utiliser ce calcul
      </button>
      {disabled ? <p className="mt-2 text-center text-sm font-bold text-asphalt-600">Recalculez d&apos;abord : vous avez changé des choix.</p> : null}
    </section>
  );
}
