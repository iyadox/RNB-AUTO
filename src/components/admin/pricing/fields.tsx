"use client";

/**
 * Champs de « Mes tarifs ». Les réglages simples sont générés à partir du registre (libellé,
 * aide, unité, bornes) : aucun nom technique n'est jamais affiché.
 */
import { formatEuros, formatPercentBp } from "@/core/format";
import type { Calculation, PricingRule } from "@/core/pricing/types";
import type { SupplementDraft } from "@/core/settings/editor";
import { SETTINGS, type NumberDef, type SettingDef, type SettingKey } from "@/core/settings/registry";
import { softLimitWarning } from "@/core/settings/validation";
import {
  ChoiceCards,
  FuelPriceInput,
  MoneyInput,
  NumberInput,
  PercentInput,
  Segmented,
  TextArea,
  TextInput,
  TimeInput,
  Toggle,
  ToggleState,
} from "@/components/admin/inputs";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

/** Carte d'un réglage : titre, aide, interrupteur éventuel, champs. */
export function SettingCard({
  title,
  help,
  enabled,
  onToggle,
  children,
  error,
  warning,
  badge,
  actions,
}: {
  title: string;
  help?: string | null;
  enabled?: boolean;
  onToggle?: (value: boolean) => void;
  children?: React.ReactNode;
  error?: string;
  warning?: string | null;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const muted = enabled === false;
  return (
    <div className={cn("rounded-3xl border bg-white p-5 transition-colors", error ? "border-red-400" : "border-asphalt-200", muted && "bg-asphalt-50")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("text-lg font-extrabold uppercase tracking-wide", muted && "text-asphalt-500")}>{title}</h3>
            {badge}
          </div>
          {help ? <p className="mt-1 text-sm text-asphalt-500">{help}</p> : null}
        </div>
        {onToggle && enabled !== undefined ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Toggle checked={enabled} onChange={onToggle} label={title} size="lg" />
            <ToggleState checked={enabled} />
          </div>
        ) : null}
        {actions}
      </div>
      {children && !muted ? <div className="mt-4 space-y-4">{children}</div> : null}
      {warning ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-signal-100 px-3 py-2 text-sm font-semibold text-asphalt-900">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {warning}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

/** Une ligne « libellé ……… champ ». */
export function FieldRow({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div>
        <p className="font-bold text-asphalt-800">{label}</p>
        {hint ? <p className="text-sm text-asphalt-500">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function NumberControl({ def, value, onChange, label }: { def: NumberDef; value: number; onChange: (v: number) => void; label: string }) {
  switch (def.input) {
    case "money":
      return <MoneyInput cents={value} onChange={onChange} ariaLabel={label} />;
    case "fuel_price":
      return <FuelPriceInput millis={value} onChange={onChange} ariaLabel={label} />;
    case "percent":
      return <PercentInput bp={value} onChange={onChange} ariaLabel={label} />;
    case "decimal":
      return <NumberInput value={value} onChange={onChange} unit={def.unit ?? ""} decimals={def.decimals ?? 1} ariaLabel={label} />;
    case "integer":
      return <NumberInput value={value} onChange={onChange} unit={def.unit ?? ""} decimals={0} ariaLabel={label} />;
  }
}

/** Réglage générique, entièrement décrit par le registre. */
export function SettingField({
  settingKey,
  value,
  onChange,
  error,
  compact = false,
}: {
  settingKey: SettingKey;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  compact?: boolean;
}) {
  const def = SETTINGS[settingKey] as SettingDef;
  const warning = softLimitWarning(settingKey, value);
  if (def.input === "toggle") {
    return (
      <SettingCard title={def.label} help={def.help} enabled={Boolean(value)} onToggle={onChange} error={error} />
    );
  }
  let control: React.ReactNode = null;
  if (def.input === "money" || def.input === "fuel_price" || def.input === "percent" || def.input === "decimal" || def.input === "integer") {
    control = <NumberControl def={def} value={Number(value)} onChange={onChange} label={def.label} />;
  } else if (def.input === "choice") {
    const options = def.options;
    const useCards = options.some((o) => o.help) || options.length > 3 || options.some((o) => o.label.length > 22);
    control = useCards ? (
      <ChoiceCards value={String(value)} onChange={onChange} options={options} name={def.label} />
    ) : (
      <Segmented value={String(value)} onChange={onChange} options={options} ariaLabel={def.label} />
    );
  } else if (def.input === "text" || def.input === "phone" || def.input === "email") {
    control = (
      <TextInput
        value={String(value ?? "")}
        onChange={onChange}
        ariaLabel={def.label}
        placeholder={def.placeholder}
        maxLength={def.maxLength}
        type={def.input === "phone" ? "tel" : def.input === "email" ? "email" : "text"}
      />
    );
  } else if (def.input === "textarea") {
    control = <TextArea value={String(value ?? "")} onChange={onChange} ariaLabel={def.label} maxLength={def.maxLength} rows={4} />;
  }
  const inline = !compact && (def.input === "money" || def.input === "fuel_price" || def.input === "percent" || def.input === "decimal" || def.input === "integer" || (def.input === "choice" && !(def.options.some((o) => o.help) || def.options.length > 3)));
  return (
    <SettingCard title={def.label} help={def.help} error={error} warning={warning}>
      {inline ? <div className="flex flex-wrap items-center justify-end">{control}</div> : control}
    </SettingCard>
  );
}

// ─── Règles ──────────────────────────────────────────────────────────────────

/** Montant fixe ou pourcentage, au choix. */
export function AmountOrPercent({
  calculation,
  onChange,
  label,
  percentHint,
}: {
  calculation: Calculation;
  onChange: (calc: Calculation) => void;
  label: string;
  percentHint?: string;
}) {
  const mode = calculation.kind === "percent" ? "percent" : "fixed";
  const amount = calculation.kind === "fixed" ? calculation.amountCents : 0;
  const rate = calculation.kind === "percent" ? calculation.rateBp : 0;
  const base = calculation.kind === "percent" ? calculation.base : "full_service";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Segmented
        value={mode}
        onChange={(next) =>
          onChange(next === "percent" ? { kind: "percent", rateBp: rate || 2000, base } : { kind: "fixed", amountCents: amount || 2000 })
        }
        options={[
          { value: "percent", label: "Pourcentage" },
          { value: "fixed", label: "Montant fixe" },
        ]}
        ariaLabel={`${label} : type de supplément`}
      />
      <div className="flex items-center gap-2">
        <span className="text-xl font-extrabold text-asphalt-400">+</span>
        {mode === "percent" ? (
          <PercentInput bp={rate} onChange={(bp) => onChange({ kind: "percent", rateBp: bp, base })} ariaLabel={`${label} : pourcentage`} />
        ) : (
          <MoneyInput cents={amount} onChange={(cents) => onChange({ kind: "fixed", amountCents: cents })} ariaLabel={`${label} : montant`} />
        )}
      </div>
      {mode === "percent" && percentHint ? <p className="w-full text-right text-sm text-asphalt-500">{percentHint}</p> : null}
    </div>
  );
}

/** Supplément d'un véhicule ou d'une situation : aucun, montant fixe ou pourcentage. */
export function SupplementEditor({ value, onChange, label }: { value: SupplementDraft; onChange: (value: SupplementDraft) => void; label: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Segmented
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode, amountCents: mode === "fixed" && value.amountCents === 0 ? 1000 : value.amountCents, rateBp: mode === "percent" && value.rateBp === 0 ? 1000 : value.rateBp })}
        options={[
          { value: "none", label: "Aucun" },
          { value: "fixed", label: "€" },
          { value: "percent", label: "%" },
        ]}
        ariaLabel={`${label} : supplément`}
        size="sm"
      />
      {value.mode === "fixed" ? (
        <MoneyInput cents={value.amountCents} onChange={(amountCents) => onChange({ ...value, amountCents })} ariaLabel={`${label} : montant du supplément`} width="w-32" />
      ) : null}
      {value.mode === "percent" ? <PercentInput bp={value.rateBp} onChange={(rateBp) => onChange({ ...value, rateBp })} ariaLabel={`${label} : pourcentage du supplément`} /> : null}
    </div>
  );
}

export function describeSupplement(value: SupplementDraft): string {
  if (value.mode === "none") return "Aucun supplément";
  return value.mode === "fixed" ? `+ ${formatEuros(value.amountCents)}` : `+ ${formatPercentBp(value.rateBp)}`;
}

export function timeRangeOf(rule: PricingRule): { start: string; end: string } {
  const condition = rule.conditions.find((c) => c.type === "time_between");
  return condition && condition.type === "time_between" ? { start: condition.start, end: condition.end } : { start: "22:00", end: "06:00" };
}

export function TimeRange({ rule, onChange }: { rule: PricingRule; onChange: (start: string, end: string) => void }) {
  const { start, end } = timeRangeOf(rule);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-bold text-asphalt-700">De</span>
      <TimeInput value={start} onChange={(value) => onChange(value, end)} ariaLabel={`${rule.label} : début`} />
      <span className="font-bold text-asphalt-700">à</span>
      <TimeInput value={end} onChange={(value) => onChange(start, value)} ariaLabel={`${rule.label} : fin`} />
    </div>
  );
}
