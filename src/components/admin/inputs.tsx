"use client";

/**
 * Champs de saisie de l'administration : interrupteur, euros, pourcentage, heure, choix…
 * Les valeurs sont manipulées dans les unités du projet (centimes, points de base, millièmes d'euro).
 */
import { useEffect, useId, useState } from "react";
import { centsToInput } from "@/core/format";
import { parseEurosToCents, parseFrenchNumber } from "@/core/money";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50",
        size === "lg" ? "h-9 w-[4.25rem]" : "h-8 w-14",
        checked ? "bg-green-600" : "bg-asphalt-300",
      )}
    >
      <span
        className={cn(
          "absolute left-1 flex items-center justify-center rounded-full bg-white shadow transition-transform duration-200",
          size === "lg" ? "h-7 w-7" : "h-6 w-6",
          checked ? (size === "lg" ? "translate-x-8" : "translate-x-6") : "translate-x-0",
        )}
      >
        {checked ? <Icon name="check" size={14} strokeWidth={3.2} className="text-green-700" /> : null}
      </span>
      <span className="sr-only">{checked ? "Activé" : "Désactivé"}</span>
    </button>
  );
}

/** Texte « ACTIVÉ / DÉSACTIVÉ » à côté d'un interrupteur. */
export function ToggleState({ checked }: { checked: boolean }) {
  return (
    <span className={cn("text-xs font-extrabold uppercase tracking-wider", checked ? "text-green-700" : "text-asphalt-400")}>
      {checked ? "Activé" : "Désactivé"}
    </span>
  );
}

const baseInput =
  "h-12 w-full rounded-2xl border-2 border-asphalt-200 bg-white px-4 text-lg font-bold tabular text-asphalt-950 outline-none transition-colors placeholder:font-normal placeholder:text-asphalt-400 focus:border-asphalt-900 disabled:bg-asphalt-100 disabled:text-asphalt-400";

function UnitInput({
  text,
  setText,
  onCommit,
  unit,
  invalid,
  disabled,
  ariaLabel,
  inputMode = "decimal",
  width = "w-36",
}: {
  text: string;
  setText: (value: string) => void;
  onCommit: () => void;
  unit: string;
  invalid: boolean;
  disabled?: boolean;
  ariaLabel: string;
  inputMode?: "decimal" | "numeric";
  width?: string;
}) {
  return (
    <div className={cn("relative", width)}>
      <input
        type="text"
        inputMode={inputMode}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={onCommit}
        onKeyDown={(event) => {
          if (event.key === "Enter") (event.target as HTMLInputElement).blur();
        }}
        className={cn(baseInput, "pr-16 text-right", invalid && "border-red-500 focus:border-red-600")}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-asphalt-500">{unit}</span>
    </div>
  );
}

/** Montant en euros (valeur en centimes). */
export function MoneyInput({
  cents,
  onChange,
  unit = "€",
  ariaLabel,
  disabled,
  width,
}: {
  cents: number;
  onChange: (cents: number) => void;
  unit?: string;
  ariaLabel: string;
  disabled?: boolean;
  width?: string;
}) {
  const [text, setText] = useState(centsToInput(cents));
  const [invalid, setInvalid] = useState(false);
  // Valeur reçue de l'extérieur (bouton « Annuler »…) : on réaffiche. Pendant la frappe, on ne touche à rien.
  const [synced, setSynced] = useState(cents);
  if (cents !== synced) {
    setSynced(cents);
    setText(centsToInput(cents));
  }
  return (
    <UnitInput
      text={text}
      setText={(value) => {
        setText(value);
        const parsed = parseEurosToCents(value);
        setInvalid(parsed === null || parsed < 0);
        if (parsed !== null && parsed >= 0) {
          setSynced(parsed);
          onChange(parsed);
        }
      }}
      onCommit={() => {
        const parsed = parseEurosToCents(text);
        if (parsed === null || parsed < 0) {
          setText(centsToInput(cents));
          setInvalid(false);
        } else setText(centsToInput(parsed));
      }}
      unit={unit}
      invalid={invalid}
      disabled={disabled}
      ariaLabel={ariaLabel}
      width={width}
    />
  );
}

/** Pourcentage (valeur en points de base : 25 % = 2500). */
export function PercentInput({ bp, onChange, ariaLabel, disabled }: { bp: number; onChange: (bp: number) => void; ariaLabel: string; disabled?: boolean }) {
  const format = (value: number) => String(value / 100).replace(".", ",");
  const [text, setText] = useState(format(bp));
  const [invalid, setInvalid] = useState(false);
  const [synced, setSynced] = useState(bp);
  if (bp !== synced) {
    setSynced(bp);
    setText(format(bp));
  }
  return (
    <UnitInput
      text={text}
      setText={(value) => {
        setText(value);
        const parsed = parseFrenchNumber(value, 2);
        setInvalid(parsed === null || parsed < 0);
        if (parsed !== null && parsed >= 0) {
          const next = Math.round(parsed * 100);
          setSynced(next);
          onChange(next);
        }
      }}
      onCommit={() => {
        const parsed = parseFrenchNumber(text, 2);
        setText(parsed === null || parsed < 0 ? format(bp) : format(Math.round(parsed * 100)));
        setInvalid(false);
      }}
      unit="%"
      invalid={invalid}
      disabled={disabled}
      ariaLabel={ariaLabel}
      width="w-32"
    />
  );
}

/** Nombre (décimal ou entier) avec unité. */
export function NumberInput({
  value,
  onChange,
  unit,
  decimals = 0,
  ariaLabel,
  disabled,
  width = "w-36",
}: {
  value: number;
  onChange: (value: number) => void;
  unit: string;
  decimals?: number;
  ariaLabel: string;
  disabled?: boolean;
  width?: string;
}) {
  const format = (v: number) => String(v).replace(".", ",");
  const [text, setText] = useState(format(value));
  const [invalid, setInvalid] = useState(false);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setText(format(value));
  }
  return (
    <UnitInput
      text={text}
      setText={(next) => {
        setText(next);
        const parsed = parseFrenchNumber(next, decimals);
        const ok = parsed !== null && parsed >= 0 && (decimals > 0 || Number.isInteger(parsed));
        setInvalid(!ok);
        if (ok && parsed !== null) {
          setSynced(parsed);
          onChange(parsed);
        }
      }}
      onCommit={() => {
        const parsed = parseFrenchNumber(text, decimals);
        setText(parsed === null || parsed < 0 ? format(value) : format(parsed));
        setInvalid(false);
      }}
      unit={unit}
      invalid={invalid}
      disabled={disabled}
      ariaLabel={ariaLabel}
      inputMode={decimals > 0 ? "decimal" : "numeric"}
      width={width}
    />
  );
}

/** Prix du carburant (valeur en millièmes d'euro : 2,349 €/L = 2349). */
export function FuelPriceInput({ millis, onChange, ariaLabel, disabled }: { millis: number; onChange: (millis: number) => void; ariaLabel: string; disabled?: boolean }) {
  return (
    <NumberInput
      value={millis / 1000}
      onChange={(v) => onChange(Math.round(v * 1000))}
      unit="€/L"
      decimals={3}
      ariaLabel={ariaLabel}
      disabled={disabled}
      width="w-40"
    />
  );
}

export function TimeInput({ value, onChange, ariaLabel, disabled }: { value: string; onChange: (value: string) => void; ariaLabel: string; disabled?: boolean }) {
  return (
    <input
      type="time"
      aria-label={ariaLabel}
      disabled={disabled}
      value={value}
      onChange={(event) => event.target.value && onChange(event.target.value)}
      className={cn(baseInput, "w-32 text-center")}
    />
  );
}

/** Choix entre quelques options (gros boutons). */
export function Segmented<V extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  disabled,
  size = "md",
}: {
  value: V;
  onChange: (value: V) => void;
  options: readonly { value: V; label: string }[];
  ariaLabel: string;
  disabled?: boolean;
  size?: "md" | "sm";
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("inline-flex flex-wrap gap-1 rounded-2xl bg-asphalt-100 p-1", disabled && "opacity-50")}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-xl px-4 font-extrabold transition-colors",
            size === "md" ? "h-10 text-sm" : "h-8 text-xs",
            value === option.value ? "bg-asphalt-900 text-chalk shadow" : "text-asphalt-600 hover:text-asphalt-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Liste de choix avec explication (boutons radio en grosses cartes). */
export function ChoiceCards<V extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: V;
  onChange: (value: V) => void;
  options: readonly { value: V; label: string; help?: string }[];
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex min-h-14 items-start gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors",
            value === option.value ? "border-asphalt-900 bg-asphalt-50" : "border-asphalt-200 bg-white hover:border-asphalt-400",
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
              value === option.value ? "border-asphalt-900" : "border-asphalt-300",
            )}
          >
            {value === option.value ? <span className="h-2.5 w-2.5 rounded-full bg-asphalt-900" /> : null}
          </span>
          <span>
            <span className="block font-bold">{option.label}</span>
            {option.help ? <span className="mt-0.5 block text-sm text-asphalt-500">{option.help}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  type = "text",
  maxLength,
  className,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  type?: "text" | "email" | "tel" | "password";
  maxLength?: number;
  className?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <input
      id={id}
      type={type}
      aria-label={ariaLabel}
      value={value}
      maxLength={maxLength}
      placeholder={placeholder}
      autoComplete={autoComplete}
      inputMode={type === "tel" ? "tel" : type === "email" ? "email" : undefined}
      onChange={(event) => onChange(event.target.value)}
      className={cn(baseInput, "font-semibold", className)}
    />
  );
}

export function TextArea({ value, onChange, placeholder, ariaLabel, rows = 3, maxLength }: { value: string; onChange: (value: string) => void; placeholder?: string; ariaLabel: string; rows?: number; maxLength?: number }) {
  return (
    <textarea
      aria-label={ariaLabel}
      value={value}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-2xl border-2 border-asphalt-200 bg-white p-4 text-base font-medium outline-none focus:border-asphalt-900"
    />
  );
}

/** Fenêtre de confirmation (dialogue natif accessible). */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-asphalt-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92dvh] w-full max-w-xl flex-col rounded-t-[2rem] bg-white shadow-2xl animate-fade-up sm:rounded-[2rem]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-asphalt-100 px-6 py-5">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-asphalt-500 hover:bg-asphalt-100" aria-label="Fermer">
            <Icon name="x" size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-asphalt-100 px-6 py-4 safe-bottom">{footer}</div> : null}
      </div>
    </div>
  );
}

/** Message temporaire en bas de l'écran. */
export function Toast({ message, tone = "good", onClose, action }: { message: string | null; tone?: "good" | "danger"; onClose: () => void; action?: { label: string; onClick: () => void } }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 8000);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="fixed inset-x-3 bottom-24 z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-asphalt-900 px-4 py-3 text-chalk shadow-2xl animate-fade-up lg:bottom-6" role="status">
      <Icon name={tone === "good" ? "checkCircle" : "alert"} size={22} className={tone === "good" ? "text-green-400" : "text-red-400"} />
      <p className="flex-1 font-semibold">{message}</p>
      {action ? (
        <button type="button" onClick={action.onClick} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-extrabold text-signal-400">
          {action.label}
        </button>
      ) : null}
      <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-1 text-asphalt-300">
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}
