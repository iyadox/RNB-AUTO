/**
 * Validation des réglages, construite automatiquement à partir du registre.
 * Utilisée côté navigateur (confort) et côté serveur (sécurité).
 */
import { z } from "zod";
import { isValidDate } from "@/core/calendar/paris";
import { HOLIDAY_CODES } from "@/core/calendar/holidays";
import {
  formatConsumption,
  formatEuros,
  formatFuelPrice,
  formatPercentBp,
} from "@/core/format";
import { phoneToE164 } from "@/core/format";
import { SETTINGS, type NumberDef, type SettingDef, type SettingKey, type SettingsValues } from "./registry";

function numberLabel(def: NumberDef, value: number): string {
  switch (def.input) {
    case "money":
      return formatEuros(value);
    case "fuel_price":
      return formatFuelPrice(value);
    case "percent":
      return formatPercentBp(value);
    case "decimal":
      return def.unit === "L/100 km"
        ? formatConsumption(value)
        : `${String(value).replace(".", ",")}${def.unit ? ` ${def.unit}` : ""}`;
    case "integer":
      return `${value}${def.unit ? ` ${def.unit}` : ""}`;
  }
}

/** Valeur lisible d'un réglage, pour l'historique et les confirmations (« 45,00 € », « Activé »). */
export function displaySettingValue(key: SettingKey, value: unknown): string {
  const def = SETTINGS[key] as SettingDef;
  switch (def.input) {
    case "toggle":
      return value ? "Activé" : "Désactivé";
    case "money":
    case "fuel_price":
    case "percent":
    case "decimal":
    case "integer":
      return typeof value === "number" ? numberLabel(def, value) : "—";
    case "choice":
      return def.options.find((o) => o.value === value)?.label ?? String(value);
    case "text":
    case "textarea":
    case "phone":
    case "email":
      return typeof value === "string" && value.trim() !== "" ? value : "(vide)";
    case "address": {
      const address = value as { label?: string } | null;
      return address?.label ?? "(vide)";
    }
    case "holidays_disabled":
      return Array.isArray(value) && value.length > 0 ? `${value.length} jour(s) ignoré(s)` : "Aucun";
    case "holidays_custom":
      return Array.isArray(value) && value.length > 0
        ? (value as { date: string; label: string }[]).map((d) => `${d.label} (${d.date.split("-").reverse().join("/")})`).join(", ")
        : "Aucun";
  }
}

function numberSchema(def: NumberDef) {
  const label = def.label;
  const base = z.number({ error: `${label} : un nombre est attendu.` });
  const withInt =
    def.input === "decimal"
      ? base.refine((v) => Number.isFinite(v) && Math.round(v * 10 ** (def.decimals ?? 2)) === v * 10 ** (def.decimals ?? 2), {
          error: `${label} : ${def.decimals ?? 2} chiffre(s) après la virgule au maximum.`,
        })
      : base.int({ error: `${label} : valeur invalide.` });
  return withInt
    .refine((v) => v >= def.min, { error: `${label} : la valeur doit être au moins ${numberLabel(def, def.min)}.` })
    .refine((v) => v <= def.max, { error: `${label} : la valeur doit être au plus ${numberLabel(def, def.max)}.` });
}

const holidaysCustomSchema = z
  .array(
    z.object({
      date: z.string().refine(isValidDate, { error: "Date invalide." }),
      label: z.string().trim().min(1, { error: "Donnez un nom à ce jour." }).max(60),
    }),
  )
  .max(60);

const addressSchema = z.object({
  label: z.string().trim().min(5, { error: "Adresse trop courte." }).max(200),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  postcode: z.string().max(10).nullable(),
  city: z.string().max(100).nullable(),
  confirmed: z.boolean(),
});

/** Schéma de validation d'un réglage. */
export function schemaFor(key: SettingKey): z.ZodType {
  const def = SETTINGS[key] as SettingDef;
  switch (def.input) {
    case "toggle":
      return z.boolean({ error: `${def.label} : choisissez activé ou désactivé.` });
    case "money":
    case "fuel_price":
    case "percent":
    case "decimal":
    case "integer":
      return numberSchema(def);
    case "choice":
      return z.enum(def.options.map((o) => o.value) as [string, ...string[]], {
        error: `${def.label} : choix invalide.`,
      });
    case "text":
    case "textarea":
      return z.string().trim().max(def.maxLength, { error: `${def.label} : ${def.maxLength} caractères au maximum.` });
    case "phone":
      return z
        .string()
        .trim()
        .max(def.maxLength)
        .refine((v) => v === "" || phoneToE164(v) !== null, { error: `${def.label} : numéro de téléphone invalide.` });
    case "email":
      return z
        .string()
        .trim()
        .max(def.maxLength)
        .refine((v) => v === "" || z.email().safeParse(v).success, { error: `${def.label} : adresse email invalide.` });
    case "address":
      return addressSchema;
    case "holidays_disabled":
      return z.array(z.enum(HOLIDAY_CODES)).max(HOLIDAY_CODES.length);
    case "holidays_custom":
      return holidaysCustomSchema;
  }
}

/** Avertissement « valeur inhabituelle » (bornes souples) : demande une confirmation, ne bloque pas. */
export function softLimitWarning(key: SettingKey, value: unknown): string | null {
  const def = SETTINGS[key] as SettingDef;
  if (def.input !== "money" && def.input !== "fuel_price" && def.input !== "percent" && def.input !== "decimal" && def.input !== "integer") {
    return null;
  }
  if (typeof value !== "number") return null;
  if (def.softMax !== undefined && value > def.softMax) {
    return `${def.label} : ${numberLabel(def, value)} paraît très élevé. Confirmez-vous ?`;
  }
  if (def.softMin !== undefined && value < def.softMin) {
    return `${def.label} : ${numberLabel(def, value)} paraît très bas. Confirmez-vous ?`;
  }
  return null;
}

export type FieldErrors = Record<string, string>;

/** Valide une liste de modifications de réglages. */
export function validateSettingChanges(changes: Partial<Record<string, unknown>>): {
  values: Partial<SettingsValues>;
  errors: FieldErrors;
} {
  const values: Record<string, unknown> = {};
  const errors: FieldErrors = {};
  for (const [key, raw] of Object.entries(changes)) {
    if (!Object.prototype.hasOwnProperty.call(SETTINGS, key)) {
      errors[key] = "Réglage inconnu.";
      continue;
    }
    const parsed = schemaFor(key as SettingKey).safeParse(raw);
    if (parsed.success) values[key] = parsed.data;
    else errors[key] = parsed.error.issues[0]?.message ?? "Valeur invalide.";
  }
  return { values: values as Partial<SettingsValues>, errors };
}
