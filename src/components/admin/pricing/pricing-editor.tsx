"use client";

/**
 * « Mes tarifs » : tous les paramètres de prix, modifiables sans aucune connaissance technique.
 * Mode simple (l'essentiel) ou avancé (coûts internes, marge, arrondi, TVA…).
 * Chaque enregistrement montre d'abord les changements et leur effet sur les trajets types.
 */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, useTransition } from "react";
import { HOLIDAY_LABELS, type Holiday } from "@/core/calendar/holidays";
import { formatDate, formatDateTime, formatEuros, formatEurosShort, formatFuelPrice, formatPercentBp } from "@/core/format";
import { roundToStep } from "@/core/money";
import type { Calculation, PricingRule, RuleCategory } from "@/core/pricing/types";
import type { PricingDraft, SituationDraft, VehicleDraft } from "@/core/settings/editor";
import type { SettingKey } from "@/core/settings/registry";
import { SITUATION_GROUP_LABELS } from "@/core/settings/rules";
import { previewPricingAction, refreshFuelAction, revertVersionAction, savePricingAction } from "@/app/admin/(espace)/tarifs/actions";
import type { PreviewResult } from "@/server/pricing-admin/service";
import { Modal, MoneyInput, NumberInput, Segmented, TextInput, Toast, Toggle } from "@/components/admin/inputs";
import { Alert, buttonClass } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { AmountOrPercent, FieldRow, SettingCard, SettingField, SupplementEditor, TimeRange } from "./fields";

type TabId = "base" | "schedule" | "vehicles" | "situations" | "fuel" | "estimate" | "costs" | "margin" | "rounding" | "vat";

const TABS: { id: TabId; label: string; icon: IconName; advanced: boolean }[] = [
  { id: "base", label: "Prix de base", icon: "euro", advanced: false },
  { id: "schedule", label: "Horaires et jours", icon: "clock", advanced: false },
  { id: "vehicles", label: "Véhicules", icon: "truck", advanced: false },
  { id: "situations", label: "Situations", icon: "wrench", advanced: false },
  { id: "fuel", label: "Carburant", icon: "fuel", advanced: false },
  { id: "estimate", label: "Estimation en ligne", icon: "sparkles", advanced: false },
  { id: "costs", label: "Coûts internes", icon: "chart", advanced: true },
  { id: "margin", label: "Marge", icon: "shield", advanced: true },
  { id: "rounding", label: "Arrondi", icon: "refresh", advanced: true },
  { id: "vat", label: "TVA", icon: "list", advanced: true },
];

export type FuelInfo = { priceTtcMillis: number; source: string; observedAt: string | null; origin: string };

type Props = {
  initialDraft: PricingDraft;
  versionNumber: number;
  fuel: FuelInfo;
  holidays: Holiday[];
};

let tempIndex = 0;
const newTempId = () => `tmp-${Date.now().toString(36)}-${++tempIndex}`;

type EditorMode = "simple" | "advanced";
const MODE_KEY = "rnb-tarifs-mode";
const modeListeners = new Set<() => void>();
let memoryMode: EditorMode | null = null;

/** Préférence « simple / avancé » gardée dans le navigateur (repli en mémoire si le stockage est bloqué). */
function readMode(): EditorMode {
  if (memoryMode) return memoryMode;
  try {
    return window.localStorage.getItem(MODE_KEY) === "advanced" ? "advanced" : "simple";
  } catch {
    return "simple";
  }
}

function writeMode(next: EditorMode) {
  memoryMode = next;
  try {
    window.localStorage.setItem(MODE_KEY, next);
  } catch {
    // stockage indisponible : la préférence reste valable pour cette visite
  }
  for (const listener of modeListeners) listener();
}

function subscribeMode(listener: () => void) {
  modeListeners.add(listener);
  return () => {
    modeListeners.delete(listener);
  };
}

export function PricingEditor({ initialDraft, versionNumber, fuel, holidays }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<PricingDraft>(initialDraft);
  const mode = useSyncExternalStore(subscribeMode, readMode, () => "simple" as const);
  const [tab, setTab] = useState<TabId>("base");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<(PreviewResult & { ok: true }) | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [softConfirmed, setSoftConfirmed] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "good" | "danger"; undoVersionId?: string | null } | null>(null);
  const [pending, startTransition] = useTransition();


  const changeMode = (next: EditorMode) => {
    writeMode(next);
    if (next === "simple" && TABS.find((t) => t.id === tab)?.advanced) setTab("base");
  };

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const [key, value] of Object.entries(draft.settings)) {
      if (JSON.stringify(value) !== JSON.stringify(initialDraft.settings[key as SettingKey])) count++;
    }
    const initialRules = new Map(initialDraft.rules.map((r) => [r.id, JSON.stringify(r)]));
    for (const rule of draft.rules) if (initialRules.get(rule.id) !== JSON.stringify(rule)) count++;
    const initialVehicles = new Map(initialDraft.vehicles.map((v) => [v.code, JSON.stringify(v)]));
    for (const v of draft.vehicles) if (initialVehicles.get(v.code) !== JSON.stringify(v)) count++;
    const initialSituations = new Map(initialDraft.situations.map((s) => [s.code, JSON.stringify(s)]));
    for (const s of draft.situations) if (initialSituations.get(s.code) !== JSON.stringify(s)) count++;
    return count;
  }, [draft, initialDraft]);

  // Prévenir avant de quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    if (dirtyCount === 0) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirtyCount]);

  const setSetting = useCallback((key: SettingKey, value: unknown) => {
    setDraft((d) => ({ ...d, settings: { ...d.settings, [key]: value } }));
  }, []);
  const setting = <T,>(key: SettingKey) => draft.settings[key] as T;

  const updateRule = useCallback((id: string, patch: Partial<PricingRule> & { archived?: boolean }) => {
    setDraft((d) => ({ ...d, rules: d.rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)) }));
  }, []);

  const addRule = (category: RuleCategory, label: string, calculation: Calculation, conditions: PricingRule["conditions"] = []) => {
    setDraft((d) => ({
      ...d,
      rules: [
        ...d.rules,
        {
          id: newTempId(),
          code: "",
          label,
          help: null,
          category,
          ledger: category === "internal_cost" ? "internal_cost" : "client_price",
          enabled: true,
          effect: category === "discount" ? "subtract" : "add",
          calculation,
          conditions,
          priority: 0,
          clientVisible: category !== "internal_cost",
          clientLabel: label,
          system: false,
          isNew: true,
        },
      ],
    }));
  };

  const removeRule = (rule: PricingRule & { isNew?: boolean }) => {
    if (rule.isNew) setDraft((d) => ({ ...d, rules: d.rules.filter((r) => r.id !== rule.id) }));
    else updateRule(rule.id, { archived: true });
  };

  const rulesOf = (...categories: RuleCategory[]) =>
    draft.rules.filter((rule) => categories.includes(rule.category) && !(rule as { archived?: boolean }).archived);

  const updateVehicle = (key: string, patch: Partial<VehicleDraft>) =>
    setDraft((d) => ({ ...d, vehicles: d.vehicles.map((v) => ((v.code || v.tempId) === key ? { ...v, ...patch } : v)) }));
  const updateSituation = (key: string, patch: Partial<SituationDraft>) =>
    setDraft((d) => ({ ...d, situations: d.situations.map((s) => ((s.code || s.tempId) === key ? { ...s, ...patch } : s)) }));

  const reset = () => {
    setDraft(initialDraft);
    setErrors({});
  };

  const openPreview = () => {
    setErrors({});
    startTransition(async () => {
      const result = await previewPricingAction(draft);
      if (!result.ok) {
        setToast({ message: result.message, tone: "danger" });
        return;
      }
      setErrors(result.errors);
      setPreview(result);
      setSoftConfirmed(result.softWarnings.length === 0);
      setReason("");
      setModalOpen(true);
    });
  };

  const save = () => {
    startTransition(async () => {
      const result = await savePricingAction({ draft, reason, baseVersionNumber: versionNumber });
      setModalOpen(false);
      if (!result.ok) {
        setErrors(("errors" in result && result.errors) || {});
        setToast({ message: result.message, tone: "danger" });
        return;
      }
      setToast({
        message: result.changeCount > 0 ? `Tarifs enregistrés (version ${result.versionNumber}).` : "Aucune modification à enregistrer.",
        tone: "good",
        undoVersionId: result.changeCount > 0 ? result.previousVersionId : null,
      });
      router.refresh();
    });
  };

  const undo = (versionId: string) => {
    startTransition(async () => {
      const result = await revertVersionAction(versionId);
      setToast(result.ok ? { message: `Modification annulée (version ${result.versionNumber}).`, tone: "good" } : { message: result.message, tone: "danger" });
      router.refresh();
    });
  };

  const visibleTabs = TABS.filter((t) => mode === "advanced" || !t.advanced);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={mode}
          onChange={changeMode}
          options={[
            { value: "simple", label: "Mode simple" },
            { value: "advanced", label: "Mode avancé" },
          ]}
          ariaLabel="Niveau de détail"
        />
        <p className="text-sm font-semibold text-asphalt-500">Version des tarifs en vigueur : {versionNumber}</p>
      </div>

      <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-12 shrink-0 items-center gap-2 rounded-2xl border-2 px-4 font-extrabold transition-colors",
              tab === t.id ? "border-asphalt-900 bg-asphalt-900 text-chalk" : "border-asphalt-200 bg-white text-asphalt-700 hover:border-asphalt-400",
            )}
          >
            <Icon name={t.icon} size={18} />
            {t.label}
          </button>
        ))}
      </div>

      {hasErrors ? (
        <div className="mb-5">
          <Alert tone="danger" title="Certaines valeurs ne sont pas valides">
            <ul className="list-disc pl-5">
              {Object.values(errors).slice(0, 6).map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </Alert>
        </div>
      ) : null}

      <div className="space-y-4">
        {tab === "base" ? (
          <>
            <SettingCard
              title="Prix minimum d'une intervention"
              help="Le client ne paiera jamais moins que ce montant, même pour un trajet très court."
              enabled={setting<boolean>("pricing.minimum.enabled")}
              onToggle={(v) => setSetting("pricing.minimum.enabled", v)}
              error={errors["setting:pricing.minimum.amountCents"]}
            >
              <FieldRow label="Montant">
                <MoneyInput cents={setting<number>("pricing.minimum.amountCents")} onChange={(v) => setSetting("pricing.minimum.amountCents", v)} ariaLabel="Montant minimum" />
              </FieldRow>
            </SettingCard>
            {rulesOf("fee").map((rule) => (
              <SettingCard
                key={rule.id}
                title={rule.label}
                help={rule.help}
                enabled={rule.enabled}
                onToggle={(enabled) => updateRule(rule.id, { enabled })}
                error={errors[`rule:${rule.id}`]}
              >
                <FieldRow label="Montant">
                  <MoneyInput
                    cents={rule.calculation.kind === "fixed" ? rule.calculation.amountCents : 0}
                    onChange={(amountCents) => updateRule(rule.id, { calculation: { kind: "fixed", amountCents } })}
                    ariaLabel={rule.label}
                  />
                </FieldRow>
              </SettingCard>
            ))}
            {rulesOf("leg").map((rule) =>
              rule.calculation.kind === "per_km" ? (
                <LegCard key={rule.id} rule={rule} advanced={mode === "advanced"} error={errors[`rule:${rule.id}`]} onChange={(patch) => updateRule(rule.id, patch)} />
              ) : null,
            )}
            {mode === "advanced" ? (
              <>
                <h2 className="pt-4 text-xl font-extrabold">Frais fixes</h2>
                <p className="text-sm text-asphalt-500">Ajoutés à chaque intervention (ex. frais de dossier). Aucun par défaut.</p>
                {rulesOf("fixed_fee").map((rule) => (
                  <SettingCard
                    key={rule.id}
                    title={rule.label}
                    enabled={rule.enabled}
                    onToggle={(enabled) => updateRule(rule.id, { enabled })}
                    error={errors[`rule:${rule.id}`]}
                    actions={<DeleteButton onClick={() => removeRule(rule)} />}
                  >
                    <FieldRow label="Nom">
                      <TextInput value={rule.label} onChange={(label) => updateRule(rule.id, { label, clientLabel: label })} ariaLabel="Nom du frais" className="max-w-xs" />
                    </FieldRow>
                    <FieldRow label="Montant">
                      <MoneyInput
                        cents={rule.calculation.kind === "fixed" ? rule.calculation.amountCents : 0}
                        onChange={(amountCents) => updateRule(rule.id, { calculation: { kind: "fixed", amountCents } })}
                        ariaLabel={rule.label}
                      />
                    </FieldRow>
                  </SettingCard>
                ))}
                <AddButton onClick={() => addRule("fixed_fee", "Nouveau frais", { kind: "fixed", amountCents: 1000 })}>Ajouter un frais fixe</AddButton>
                <SettingField settingKey="pricing.distance.billingPrecision" value={setting("pricing.distance.billingPrecision")} onChange={(v) => setSetting("pricing.distance.billingPrecision", v)} />
              </>
            ) : null}
          </>
        ) : null}

        {tab === "schedule" ? (
          <>
            {rulesOf("time_slot").map((rule) => (
              <SettingCard
                key={rule.id}
                title={rule.label}
                help={rule.system ? "Majoration appliquée pendant cette plage horaire, tous les jours." : null}
                enabled={rule.enabled}
                onToggle={(enabled) => updateRule(rule.id, { enabled })}
                error={errors[`rule:${rule.id}`]}
                actions={!rule.system ? <DeleteButton onClick={() => removeRule(rule)} /> : null}
              >
                {!rule.system ? (
                  <FieldRow label="Nom">
                    <TextInput value={rule.label} onChange={(label) => updateRule(rule.id, { label, clientLabel: `Majoration ${label.toLowerCase()}` })} ariaLabel="Nom de la plage" className="max-w-xs" />
                  </FieldRow>
                ) : null}
                <TimeRange
                  rule={rule}
                  onChange={(start, end) => updateRule(rule.id, { conditions: [{ type: "time_between", start, end }] })}
                />
                <AmountOrPercent
                  calculation={rule.calculation}
                  onChange={(calculation) => updateRule(rule.id, { calculation })}
                  label={rule.label}
                  percentHint="Pourcentage de la prestation complète (avec suppléments)."
                />
              </SettingCard>
            ))}
            <AddButton
              onClick={() => addRule("time_slot", "Soirée", { kind: "percent", rateBp: 1000, base: "full_service" }, [{ type: "time_between", start: "19:00", end: "22:00" }])}
            >
              Ajouter une plage horaire
            </AddButton>

            <h2 className="pt-4 text-xl font-extrabold">Jours</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {rulesOf("day", "holiday").map((rule) => (
                <SettingCard
                  key={rule.id}
                  title={rule.label}
                  enabled={rule.enabled}
                  onToggle={(enabled) => updateRule(rule.id, { enabled })}
                  error={errors[`rule:${rule.id}`]}
                >
                  <AmountOrPercent calculation={rule.calculation} onChange={(calculation) => updateRule(rule.id, { calculation })} label={rule.label} />
                </SettingCard>
              ))}
            </div>

            {mode === "advanced" ? (
              <>
                <h2 className="pt-4 text-xl font-extrabold">Quand plusieurs majorations tombent en même temps</h2>
                <SettingField settingKey="pricing.stacking.combined" value={setting("pricing.stacking.combined")} onChange={(v) => setSetting("pricing.stacking.combined", v)} />
                <SettingField settingKey="pricing.stacking.days" value={setting("pricing.stacking.days")} onChange={(v) => setSetting("pricing.stacking.days", v)} />
                <SettingField settingKey="pricing.stacking.timeSlots" value={setting("pricing.stacking.timeSlots")} onChange={(v) => setSetting("pricing.stacking.timeSlots", v)} />
                <SettingField settingKey="pricing.calendar.referenceTime" value={setting("pricing.calendar.referenceTime")} onChange={(v) => setSetting("pricing.calendar.referenceTime", v)} />
                <HolidaysEditor
                  holidays={holidays}
                  disabled={setting<string[]>("calendar.holidays.disabled")}
                  custom={setting<{ date: string; label: string }[]>("calendar.holidays.custom")}
                  onDisabled={(v) => setSetting("calendar.holidays.disabled", v)}
                  onCustom={(v) => setSetting("calendar.holidays.custom", v)}
                  error={errors["setting:calendar.holidays.custom"]}
                />
              </>
            ) : null}
          </>
        ) : null}

        {tab === "vehicles" ? (
          <VehiclesSection
            vehicles={draft.vehicles}
            errors={errors}
            advanced={mode === "advanced"}
            onUpdate={updateVehicle}
            onAdd={(label) =>
              setDraft((d) => ({
                ...d,
                vehicles: [
                  ...d.vehicles,
                  { code: "", tempId: newTempId(), label, icon: "autre", sortOrder: 0, clientVisible: true, acceptance: "on_request", active: true, isNew: true, supplement: { mode: "none", amountCents: 0, rateBp: 0 } },
                ],
              }))
            }
            onRemoveNew={(tempId) => setDraft((d) => ({ ...d, vehicles: d.vehicles.filter((v) => v.tempId !== tempId) }))}
          />
        ) : null}

        {tab === "situations" ? (
          <SituationsSection
            situations={draft.situations}
            errors={errors}
            advanced={mode === "advanced"}
            onUpdate={updateSituation}
            onAdd={(label, group) =>
              setDraft((d) => ({
                ...d,
                situations: [
                  ...d.situations,
                  {
                    code: "",
                    tempId: newTempId(),
                    label,
                    clientLabel: label,
                    icon: "other",
                    group,
                    sortOrder: 0,
                    clientVisible: group !== "detail",
                    onSitePossible: false,
                    active: true,
                    isNew: true,
                    supplement: { mode: "fixed", amountCents: 1000, rateBp: 0 },
                  },
                ],
              }))
            }
            onRemoveNew={(tempId) => setDraft((d) => ({ ...d, situations: d.situations.filter((s) => s.tempId !== tempId) }))}
          />
        ) : null}

        {tab === "fuel" ? (
          <FuelSection
            draft={draft}
            setting={setting}
            setSetting={setSetting}
            fuel={fuel}
            advanced={mode === "advanced"}
            errors={errors}
            onRefreshed={() => router.refresh()}
          />
        ) : null}

        {tab === "estimate" ? (
          <>
            <SettingField settingKey="estimate.enabled" value={setting("estimate.enabled")} onChange={(v) => setSetting("estimate.enabled", v)} />
            {mode === "advanced" ? (
              <>
                <SettingField settingKey="estimate.showSupplementLabels" value={setting("estimate.showSupplementLabels")} onChange={(v) => setSetting("estimate.showSupplementLabels", v)} />
                <SettingField settingKey="estimate.validityMinutes" value={setting("estimate.validityMinutes")} onChange={(v) => setSetting("estimate.validityMinutes", v)} error={errors["setting:estimate.validityMinutes"]} />
              </>
            ) : (
              <p className="text-sm text-asphalt-500">Passez en mode avancé pour régler la durée de validité et l&apos;affichage des suppléments.</p>
            )}
          </>
        ) : null}

        {tab === "costs" ? (
          <>
            <Alert tone="info">Les coûts internes ne sont jamais montrés au client. Ils servent à calculer votre marge.</Alert>
            {rulesOf("internal_cost").map((rule) => (
              <CostCard key={rule.id} rule={rule} error={errors[`rule:${rule.id}`]} onChange={(patch) => updateRule(rule.id, patch)} onRemove={() => removeRule(rule)} />
            ))}
            <AddButton onClick={() => addRule("internal_cost", "Autre frais", { kind: "per_km", centsPerKm: 5, legs: ["emptyOut", "loaded", "emptyBack"], freeKm: 0 })}>
              Ajouter un autre coût
            </AddButton>
            <SettingField settingKey="costs.handlingMinutes" value={setting("costs.handlingMinutes")} onChange={(v) => setSetting("costs.handlingMinutes", v)} error={errors["setting:costs.handlingMinutes"]} />
            <SettingField settingKey="vat.fuelRecoverableBp" value={setting("vat.fuelRecoverableBp")} onChange={(v) => setSetting("vat.fuelRecoverableBp", v)} />
          </>
        ) : null}

        {tab === "margin" ? (
          <>
            <Alert tone="info">
              Marge = prix hors taxes − coût interne. Les interventions sont signalées « marge faible » sous la marge visée, et « marge très faible »
              sous la marge minimale. Rien n&apos;est jamais bloqué.
            </Alert>
            <SettingField settingKey="margin.minimumCents" value={setting("margin.minimumCents")} onChange={(v) => setSetting("margin.minimumCents", v)} error={errors["setting:margin.minimumCents"]} />
            <SettingField settingKey="margin.targetBp" value={setting("margin.targetBp")} onChange={(v) => setSetting("margin.targetBp", v)} error={errors["setting:margin.targetBp"]} />
            <SettingField settingKey="margin.onlineBelowMinimum" value={setting("margin.onlineBelowMinimum")} onChange={(v) => setSetting("margin.onlineBelowMinimum", v)} />
          </>
        ) : null}

        {tab === "rounding" ? (
          <>
            <SettingField settingKey="rounding.enabled" value={setting("rounding.enabled")} onChange={(v) => setSetting("rounding.enabled", v)} />
            {setting<boolean>("rounding.enabled") ? (
              <>
                <SettingField settingKey="rounding.step" value={setting("rounding.step")} onChange={(v) => setSetting("rounding.step", v)} />
                <SettingField settingKey="rounding.mode" value={setting("rounding.mode")} onChange={(v) => setSetting("rounding.mode", v)} />
                <SettingField settingKey="rounding.afterAdjustments" value={setting("rounding.afterAdjustments")} onChange={(v) => setSetting("rounding.afterAdjustments", v)} />
                <RoundingExamples step={Number(setting("rounding.step")) * 100} mode={setting<"nearest" | "up">("rounding.mode")} />
              </>
            ) : null}
          </>
        ) : null}

        {tab === "vat" ? (
          <>
            <SettingField settingKey="vat.subject" value={setting("vat.subject")} onChange={(v) => setSetting("vat.subject", v)} />
            {setting<boolean>("vat.subject") ? (
              <>
                <SettingField settingKey="vat.rateBp" value={setting("vat.rateBp")} onChange={(v) => setSetting("vat.rateBp", v)} error={errors["setting:vat.rateBp"]} />
                <SettingField settingKey="vat.pricesInput" value={setting("vat.pricesInput")} onChange={(v) => setSetting("vat.pricesInput", v)} />
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Barre d'enregistrement */}
      {dirtyCount > 0 ? (
        <div className="fixed inset-x-3 bottom-[5.25rem] z-[60] mx-auto flex max-w-3xl items-center gap-3 rounded-3xl bg-asphalt-900 p-3 pl-5 text-chalk shadow-2xl animate-fade-up lg:bottom-6 lg:left-[300px]">
          <p className="flex-1 font-bold">
            {dirtyCount} modification{dirtyCount > 1 ? "s" : ""} non enregistrée{dirtyCount > 1 ? "s" : ""}
          </p>
          <button type="button" onClick={reset} className="h-12 rounded-2xl px-4 font-bold text-asphalt-200 hover:bg-white/10">
            Annuler
          </button>
          <button type="button" onClick={openPreview} disabled={pending} className={buttonClass("primary")}>
            {pending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-asphalt-950 border-t-transparent" /> : null}
            Enregistrer
          </button>
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Vérifier les modifications"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonClass("secondary")} onClick={() => setModalOpen(false)}>
              Revenir aux réglages
            </button>
            {preview && Object.keys(preview.errors).length === 0 ? (
              <button type="button" className={buttonClass("dark")} disabled={pending || !softConfirmed} onClick={save}>
                {pending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-chalk border-t-transparent" /> : <Icon name="check" size={18} />}
                Confirmer et enregistrer
              </button>
            ) : null}
          </div>
        }
      >
        {preview ? (
          <div className="space-y-5">
            {Object.keys(preview.errors).length > 0 ? (
              <Alert tone="danger" title="À corriger avant d'enregistrer">
                <ul className="list-disc pl-5">
                  {Object.values(preview.errors).map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </Alert>
            ) : null}
            {preview.changes.length > 0 ? (
              <div>
                <p className="font-extrabold">Vous allez modifier :</p>
                <ul className="mt-2 divide-y divide-asphalt-100 rounded-2xl border border-asphalt-200">
                  {preview.changes.map((change, index) => (
                    <li key={`${change.label}-${index}`} className="px-4 py-3">
                      <p className="font-semibold">{change.label}</p>
                      <p className="mt-0.5 text-sm">
                        <span className="text-asphalt-500 line-through decoration-asphalt-300">{change.before}</span>
                        <Icon name="arrowRight" size={14} className="mx-2 inline text-asphalt-400" />
                        <span className="font-bold">{change.after}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>Aucune modification.</p>
            )}
            {preview.softWarnings.length > 0 ? (
              <div className="rounded-2xl border border-signal-500 bg-signal-100 p-4">
                <p className="flex items-center gap-2 font-extrabold">
                  <Icon name="alert" size={18} />
                  Valeurs inhabituelles
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {preview.softWarnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
                <label className="mt-3 flex items-center gap-3 font-bold">
                  <input type="checkbox" checked={softConfirmed} onChange={(e) => setSoftConfirmed(e.target.checked)} className="h-5 w-5 accent-asphalt-900" />
                  Je confirme ces valeurs
                </label>
              </div>
            ) : null}
            {preview.impact.length > 0 ? (
              <div>
                <p className="font-extrabold">Effet sur vos trajets types (prix client) :</p>
                <ul className="mt-2 divide-y divide-asphalt-100 rounded-2xl border border-asphalt-200">
                  {preview.impact.map((row) => {
                    const delta = row.before !== null && row.after !== null ? row.after - row.before : null;
                    return (
                      <li key={row.name} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <span className="font-semibold">{row.name}</span>
                        <span className="shrink-0 tabular">
                          {row.before !== null ? formatEurosShort(row.before) : "sur demande"} →{" "}
                          <strong>{row.after !== null ? formatEurosShort(row.after) : "sur demande"}</strong>
                          {delta !== null && delta !== 0 ? (
                            <span className={cn("ml-2 font-bold", delta > 0 ? "text-orange-700" : "text-green-700")}>
                              {delta > 0 ? "▲" : "▼"} {formatEurosShort(Math.abs(delta))}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {Object.keys(preview.errors).length === 0 ? (
              <label className="block">
                <span className="font-bold">Motif (facultatif)</span>
                <TextInput value={reason} onChange={setReason} ariaLabel="Motif de la modification" placeholder="Ex. : hausse du prix du carburant" maxLength={300} className="mt-2" />
              </label>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Toast
        message={toast?.message ?? null}
        tone={toast?.tone}
        onClose={() => setToast(null)}
        action={toast?.undoVersionId ? { label: "Annuler", onClick: () => toast.undoVersionId && undo(toast.undoVersionId) } : undefined}
      />
    </div>
  );
}

// ─── Morceaux ────────────────────────────────────────────────────────────────

function AddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-asphalt-300 font-extrabold text-asphalt-600 transition-colors hover:border-asphalt-900 hover:text-asphalt-900"
    >
      <Icon name="plus" size={20} strokeWidth={2.6} />
      {children}
    </button>
  );
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="ml-2 rounded-xl p-2 text-asphalt-400 hover:bg-red-50 hover:text-red-700" aria-label="Supprimer">
      <Icon name="trash" size={20} />
    </button>
  );
}

function LegCard({
  rule,
  advanced,
  error,
  onChange,
}: {
  rule: PricingRule;
  advanced: boolean;
  error?: string;
  onChange: (patch: Partial<PricingRule>) => void;
}) {
  if (rule.calculation.kind !== "per_km") return null;
  const calc = rule.calculation;
  const exampleKm = 20;
  return (
    <SettingCard title={rule.label} help={rule.help} enabled={rule.enabled} onToggle={(enabled) => onChange({ enabled })} error={error}>
      <FieldRow label="Prix au kilomètre" hint={`Exemple : ${exampleKm} km = ${formatEuros(Math.round(Math.max(0, exampleKm - calc.freeKm) * calc.centsPerKm))}`}>
        <MoneyInput cents={calc.centsPerKm} onChange={(centsPerKm) => onChange({ calculation: { ...calc, centsPerKm } })} unit="€/km" ariaLabel={`${rule.label} : prix au kilomètre`} width="w-40" />
      </FieldRow>
      {advanced ? (
        <FieldRow label="Kilomètres offerts" hint="Les premiers kilomètres de ce trajet ne sont pas facturés.">
          <NumberInput value={calc.freeKm} onChange={(freeKm) => onChange({ calculation: { ...calc, freeKm } })} unit="km" decimals={1} ariaLabel={`${rule.label} : kilomètres offerts`} />
        </FieldRow>
      ) : null}
    </SettingCard>
  );
}

function CostCard({
  rule,
  error,
  onChange,
  onRemove,
}: {
  rule: PricingRule & { isNew?: boolean };
  error?: string;
  onChange: (patch: Partial<PricingRule>) => void;
  onRemove: () => void;
}) {
  const calc = rule.calculation;
  return (
    <SettingCard
      title={rule.label}
      help={rule.help}
      enabled={rule.enabled}
      onToggle={(enabled) => onChange({ enabled })}
      error={error}
      actions={!rule.system ? <DeleteButton onClick={onRemove} /> : null}
    >
      {!rule.system ? (
        <>
          <FieldRow label="Nom">
            <TextInput value={rule.label} onChange={(label) => onChange({ label })} ariaLabel="Nom du coût" className="max-w-xs" />
          </FieldRow>
          <FieldRow label="Calcul">
            <Segmented
              value={calc.kind === "fixed" ? "fixed" : "per_km"}
              onChange={(kind) =>
                onChange({
                  calculation: kind === "fixed" ? { kind: "fixed", amountCents: 500 } : { kind: "per_km", centsPerKm: 5, legs: ["emptyOut", "loaded", "emptyBack"], freeKm: 0 },
                })
              }
              options={[
                { value: "per_km", label: "Par km" },
                { value: "fixed", label: "Par intervention" },
              ]}
              ariaLabel="Type de calcul"
              size="sm"
            />
          </FieldRow>
        </>
      ) : null}
      {calc.kind === "per_km" ? (
        <FieldRow label="Par kilomètre (les 3 trajets)">
          <MoneyInput cents={calc.centsPerKm} onChange={(centsPerKm) => onChange({ calculation: { ...calc, centsPerKm } })} unit="€/km" ariaLabel={`${rule.label} par kilomètre`} width="w-40" />
        </FieldRow>
      ) : null}
      {calc.kind === "fixed" ? (
        <FieldRow label="Par intervention">
          <MoneyInput cents={calc.amountCents} onChange={(amountCents) => onChange({ calculation: { kind: "fixed", amountCents } })} ariaLabel={`${rule.label} par intervention`} />
        </FieldRow>
      ) : null}
      {calc.kind === "per_hour" ? (
        <>
          <FieldRow label="Coût d'une heure">
            <MoneyInput cents={calc.centsPerHour} onChange={(centsPerHour) => onChange({ calculation: { ...calc, centsPerHour } })} unit="€/h" ariaLabel={`${rule.label} par heure`} width="w-36" />
          </FieldRow>
          <FieldRow label="Compter le temps de chargement">
            <Toggle checked={calc.includeHandling} onChange={(includeHandling) => onChange({ calculation: { ...calc, includeHandling } })} label="Compter le temps de chargement" />
          </FieldRow>
        </>
      ) : null}
      {calc.kind === "fuel" ? <p className="text-sm text-asphalt-500">Calculé automatiquement : consommation × kilomètres × prix du litre (onglet Carburant).</p> : null}
    </SettingCard>
  );
}

function VehiclesSection({
  vehicles,
  errors,
  advanced,
  onUpdate,
  onAdd,
  onRemoveNew,
}: {
  vehicles: VehicleDraft[];
  errors: Record<string, string>;
  advanced: boolean;
  onUpdate: (key: string, patch: Partial<VehicleDraft>) => void;
  onAdd: (label: string) => void;
  onRemoveNew: (tempId: string) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  return (
    <div className="space-y-3">
      <Alert tone="info">
        « Prix automatique » : le client voit un prix en ligne. « Sur demande » : il envoie sa demande et vous le rappelez avec un prix.
      </Alert>
      {vehicles
        .filter((v) => v.active)
        .map((vehicle) => {
          const key = vehicle.code || vehicle.tempId || "";
          return (
            <div key={key} className={cn("rounded-3xl border bg-white p-5", errors[`vehicle:${key}`] ? "border-red-400" : "border-asphalt-200")}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {advanced || vehicle.isNew ? (
                  <TextInput value={vehicle.label} onChange={(label) => onUpdate(key, { label })} ariaLabel="Nom du véhicule" className="max-w-xs" />
                ) : (
                  <h3 className="text-lg font-extrabold uppercase tracking-wide">{vehicle.label}</h3>
                )}
                <label className="flex items-center gap-3 text-sm font-bold text-asphalt-600">
                  Proposé au client
                  <Toggle checked={vehicle.clientVisible} onChange={(clientVisible) => onUpdate(key, { clientVisible })} label={`${vehicle.label} proposé au client`} />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <Segmented
                  value={vehicle.acceptance}
                  onChange={(acceptance) => onUpdate(key, { acceptance })}
                  options={[
                    { value: "accepted", label: "Prix automatique" },
                    { value: "on_request", label: "Sur demande" },
                    { value: "refused", label: "Non pris en charge" },
                  ]}
                  ariaLabel={`${vehicle.label} : prix`}
                  size="sm"
                />
                <SupplementEditor value={vehicle.supplement} onChange={(supplement) => onUpdate(key, { supplement })} label={vehicle.label} />
              </div>
              {advanced && !vehicle.isNew ? (
                <button type="button" onClick={() => onUpdate(key, { active: false })} className="mt-3 text-sm font-bold text-red-700">
                  Retirer ce type de véhicule
                </button>
              ) : null}
              {vehicle.isNew && vehicle.tempId ? (
                <button type="button" onClick={() => onRemoveNew(vehicle.tempId as string)} className="mt-3 text-sm font-bold text-red-700">
                  Ne pas ajouter
                </button>
              ) : null}
              {errors[`vehicle:${key}`] ? <p className="mt-2 text-sm font-bold text-red-700">{errors[`vehicle:${key}`]}</p> : null}
            </div>
          );
        })}
      <div className="flex flex-col gap-2 rounded-3xl border-2 border-dashed border-asphalt-300 p-4 sm:flex-row">
        <TextInput value={newLabel} onChange={setNewLabel} ariaLabel="Nouveau type de véhicule" placeholder="Nouveau type (ex. Camping-car)" maxLength={60} />
        <button
          type="button"
          disabled={newLabel.trim().length < 2}
          onClick={() => {
            onAdd(newLabel.trim());
            setNewLabel("");
          }}
          className={buttonClass("dark")}
        >
          <Icon name="plus" size={18} />
          Ajouter
        </button>
      </div>
    </div>
  );
}

function SituationsSection({
  situations,
  errors,
  advanced,
  onUpdate,
  onAdd,
  onRemoveNew,
}: {
  situations: SituationDraft[];
  errors: Record<string, string>;
  advanced: boolean;
  onUpdate: (key: string, patch: Partial<SituationDraft>) => void;
  onAdd: (label: string, group: SituationDraft["group"]) => void;
  onRemoveNew: (tempId: string) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newGroup, setNewGroup] = useState<SituationDraft["group"]>("detail");
  const groups: SituationDraft["group"][] = ["problem", "state", "detail"];
  return (
    <div className="space-y-6">
      <Alert tone="info">
        « Proposée au client » : la situation apparaît dans la demande en ligne. Sinon, vous l&apos;ajoutez vous-même sur une demande (ex. treuillage).
      </Alert>
      {groups.map((group) => (
        <div key={group} className="space-y-3">
          <h2 className="text-xl font-extrabold">{group === "problem" ? "Problèmes" : group === "state" ? "État du véhicule" : "Particularités"}</h2>
          {situations
            .filter((s) => s.group === group && s.active)
            .map((situation) => {
              const key = situation.code || situation.tempId || "";
              return (
                <div key={key} className={cn("rounded-3xl border bg-white p-5", errors[`situation:${key}`] ? "border-red-400" : "border-asphalt-200")}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {advanced || situation.isNew ? (
                      <TextInput value={situation.label} onChange={(label) => onUpdate(key, { label, clientLabel: situation.isNew ? label : situation.clientLabel })} ariaLabel="Nom" className="max-w-xs" />
                    ) : (
                      <h3 className="text-lg font-extrabold uppercase tracking-wide">{situation.label}</h3>
                    )}
                    <label className="flex items-center gap-3 text-sm font-bold text-asphalt-600">
                      Proposée au client
                      <Toggle checked={situation.clientVisible} onChange={(clientVisible) => onUpdate(key, { clientVisible })} label={`${situation.label} proposée au client`} />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold text-asphalt-500">Supplément</p>
                    <SupplementEditor value={situation.supplement} onChange={(supplement) => onUpdate(key, { supplement })} label={situation.label} />
                  </div>
                  {advanced ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm font-bold text-asphalt-600">
                        Nom affiché au client
                        <TextInput value={situation.clientLabel} onChange={(clientLabel) => onUpdate(key, { clientLabel })} ariaLabel="Nom affiché au client" className="mt-1" />
                      </label>
                      <label className="flex items-center justify-between gap-3 rounded-2xl bg-asphalt-50 px-4 text-sm font-bold text-asphalt-600">
                        Peut se régler sur place
                        <Toggle checked={situation.onSitePossible} onChange={(onSitePossible) => onUpdate(key, { onSitePossible })} label="Peut se régler sur place" />
                      </label>
                    </div>
                  ) : null}
                  {advanced && !situation.isNew ? (
                    <button type="button" onClick={() => onUpdate(key, { active: false })} className="mt-3 text-sm font-bold text-red-700">
                      Retirer cette situation
                    </button>
                  ) : null}
                  {situation.isNew && situation.tempId ? (
                    <button type="button" onClick={() => onRemoveNew(situation.tempId as string)} className="mt-3 text-sm font-bold text-red-700">
                      Ne pas ajouter
                    </button>
                  ) : null}
                  {errors[`situation:${key}`] ? <p className="mt-2 text-sm font-bold text-red-700">{errors[`situation:${key}`]}</p> : null}
                </div>
              );
            })}
        </div>
      ))}
      <div className="space-y-3 rounded-3xl border-2 border-dashed border-asphalt-300 p-4">
        <p className="font-extrabold">Ajouter une situation</p>
        <TextInput value={newLabel} onChange={setNewLabel} ariaLabel="Nom de la situation" placeholder="Ex. : Véhicule très bas" maxLength={60} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={newGroup}
            onChange={setNewGroup}
            options={groups.map((g) => ({ value: g, label: SITUATION_GROUP_LABELS[g] }))}
            ariaLabel="Type de situation"
            size="sm"
          />
          <button
            type="button"
            disabled={newLabel.trim().length < 2}
            onClick={() => {
              onAdd(newLabel.trim(), newGroup);
              setNewLabel("");
            }}
            className={buttonClass("dark")}
          >
            <Icon name="plus" size={18} />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

function FuelSection({
  setting,
  setSetting,
  fuel,
  advanced,
  errors,
  onRefreshed,
}: {
  draft: PricingDraft;
  setting: <T>(key: SettingKey) => T;
  setSetting: (key: SettingKey, value: unknown) => void;
  fuel: FuelInfo;
  advanced: boolean;
  errors: Record<string, string>;
  onRefreshed: () => void;
}) {
  const [refreshing, startRefresh] = useTransition();
  const [refreshMessage, setRefreshMessage] = useState<{ ok: boolean; message: string } | null>(null);
  const indexationShare = setting<number>("fuel.indexation.shareBp");
  const exampleBp = Math.min(setting<number>("fuel.indexation.capBp"), Math.round(indexationShare * 0.1));
  return (
    <>
      <SettingCard title="Prix du carburant utilisé en ce moment">
        <p className="font-display text-5xl text-asphalt-950">{formatFuelPrice(fuel.priceTtcMillis)}</p>
        <p className="text-sm text-asphalt-500">
          {fuel.origin}
          {fuel.observedAt ? ` · dernière mise à jour : ${formatDateTime(fuel.observedAt)}` : ""}
        </p>
        {setting<string>("fuel.mode") === "auto" ? (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={refreshing}
              className={buttonClass("dark", "sm")}
              onClick={() =>
                startRefresh(async () => {
                  const result = await refreshFuelAction();
                  setRefreshMessage(result);
                  if (result.ok) onRefreshed();
                })
              }
            >
              <Icon name="refresh" size={16} className={refreshing ? "animate-spin" : undefined} />
              Actualiser maintenant
            </button>
            {refreshMessage ? <p className={cn("text-sm font-semibold", refreshMessage.ok ? "text-green-700" : "text-orange-700")}>{refreshMessage.message}</p> : null}
          </div>
        ) : null}
      </SettingCard>
      <SettingField settingKey="truck.consumptionEmptyL100" value={setting("truck.consumptionEmptyL100")} onChange={(v) => setSetting("truck.consumptionEmptyL100", v)} error={errors["setting:truck.consumptionEmptyL100"]} />
      <SettingField settingKey="truck.consumptionLoadedL100" value={setting("truck.consumptionLoadedL100")} onChange={(v) => setSetting("truck.consumptionLoadedL100", v)} error={errors["setting:truck.consumptionLoadedL100"]} />
      <SettingField settingKey="fuel.mode" value={setting("fuel.mode")} onChange={(v) => setSetting("fuel.mode", v)} />
      <SettingField settingKey="fuel.manualPriceMillis" value={setting("fuel.manualPriceMillis")} onChange={(v) => setSetting("fuel.manualPriceMillis", v)} error={errors["setting:fuel.manualPriceMillis"]} />
      {advanced ? (
        <>
          <SettingField settingKey="fuel.type" value={setting("fuel.type")} onChange={(v) => setSetting("fuel.type", v)} />
          <SettingField settingKey="fuel.auto.radiusKm" value={setting("fuel.auto.radiusKm")} onChange={(v) => setSetting("fuel.auto.radiusKm", v)} />
          <SettingField settingKey="fuel.auto.maxAgeHours" value={setting("fuel.auto.maxAgeHours")} onChange={(v) => setSetting("fuel.auto.maxAgeHours", v)} />
          <SettingField settingKey="fuel.auto.minPriceMillis" value={setting("fuel.auto.minPriceMillis")} onChange={(v) => setSetting("fuel.auto.minPriceMillis", v)} />
          <SettingField settingKey="fuel.auto.maxPriceMillis" value={setting("fuel.auto.maxPriceMillis")} onChange={(v) => setSetting("fuel.auto.maxPriceMillis", v)} />
          <SettingCard
            title="Impact du carburant sur le prix client"
            help="Si activé, vos prix au kilomètre suivent automatiquement le prix du carburant."
            enabled={setting<boolean>("fuel.indexation.enabled")}
            onToggle={(v) => setSetting("fuel.indexation.enabled", v)}
          >
            <FieldRow label="Prix du carburant de référence">
              <NumberInput value={setting<number>("fuel.indexation.referencePriceMillis") / 1000} onChange={(v) => setSetting("fuel.indexation.referencePriceMillis", Math.round(v * 1000))} unit="€/L" decimals={3} ariaLabel="Prix de référence" width="w-40" />
            </FieldRow>
            <FieldRow label="Part du carburant dans vos prix au km">
              <NumberInput value={indexationShare / 100} onChange={(v) => setSetting("fuel.indexation.shareBp", Math.round(v * 100))} unit="%" decimals={1} ariaLabel="Part du carburant" width="w-32" />
            </FieldRow>
            <FieldRow label="Variation maximale">
              <NumberInput value={setting<number>("fuel.indexation.capBp") / 100} onChange={(v) => setSetting("fuel.indexation.capBp", Math.round(v * 100))} unit="%" decimals={1} ariaLabel="Variation maximale" width="w-32" />
            </FieldRow>
            <p className="rounded-2xl bg-asphalt-50 p-3 text-sm font-semibold">
              Si le carburant coûte 10 % de plus que le prix de référence, vos prix au kilomètre augmentent de {formatPercentBp(exampleBp)}.
            </p>
          </SettingCard>
        </>
      ) : null}
    </>
  );
}

function RoundingExamples({ step, mode }: { step: number; mode: "nearest" | "up" }) {
  const samples = [8713, 8400, 13_260];
  return (
    <div className="rounded-3xl border border-asphalt-200 bg-white p-5">
      <p className="font-extrabold">Exemples</p>
      <ul className="mt-2 space-y-1 tabular">
        {samples.map((cents) => (
          <li key={cents}>
            {formatEuros(cents)} <Icon name="arrowRight" size={14} className="mx-1 inline text-asphalt-400" />
            <strong>{formatEurosShort(roundToStep(cents, step, mode))}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HolidaysEditor({
  holidays,
  disabled,
  custom,
  onDisabled,
  onCustom,
  error,
}: {
  holidays: Holiday[];
  disabled: string[];
  custom: { date: string; label: string }[];
  onDisabled: (value: string[]) => void;
  onCustom: (value: { date: string; label: string }[]) => void;
  error?: string;
}) {
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  return (
    <SettingCard title="Jours fériés" help="Calculés automatiquement chaque année. Désactivez ceux que vous ne majorez pas, ajoutez vos propres dates." error={error}>
      <ul className="divide-y divide-asphalt-100">
        {holidays.map((holiday) => {
          const active = !disabled.includes(holiday.code);
          return (
            <li key={holiday.code} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="font-bold">{HOLIDAY_LABELS[holiday.code as keyof typeof HOLIDAY_LABELS] ?? holiday.label}</span>
                <span className="ml-2 text-sm text-asphalt-500">prochain : {formatDate(`${holiday.date}T12:00:00Z`)}</span>
              </span>
              <Toggle
                checked={active}
                onChange={(on) => onDisabled(on ? disabled.filter((code) => code !== holiday.code) : [...disabled, holiday.code])}
                label={holiday.label}
              />
            </li>
          );
        })}
      </ul>
      <div className="space-y-2">
        <p className="font-bold">Dates ajoutées</p>
        {custom.length === 0 ? <p className="text-sm text-asphalt-500">Aucune.</p> : null}
        {custom.map((entry) => (
          <div key={`${entry.date}-${entry.label}`} className="flex items-center justify-between rounded-2xl bg-asphalt-50 px-4 py-2">
            <span>
              <strong>{entry.label}</strong> — {formatDate(`${entry.date}T12:00:00Z`)}
            </span>
            <DeleteButton onClick={() => onCustom(custom.filter((c) => c !== entry))} />
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" className="h-12 rounded-2xl border-2 border-asphalt-200 px-3 font-bold" />
          <TextInput value={label} onChange={setLabel} ariaLabel="Nom du jour" placeholder="Ex. : Veille de Noël" maxLength={60} />
          <button
            type="button"
            disabled={!date || label.trim().length < 2}
            onClick={() => {
              onCustom([...custom, { date, label: label.trim() }]);
              setDate("");
              setLabel("");
            }}
            className={buttonClass("dark")}
          >
            Ajouter
          </button>
        </div>
      </div>
    </SettingCard>
  );
}
