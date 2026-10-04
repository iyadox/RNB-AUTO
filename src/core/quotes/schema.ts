/**
 * Validation des demandes d'estimation et d'intervention, partagée entre le navigateur (confort)
 * et le serveur (sécurité). Le navigateur n'envoie jamais de prix.
 */
import { z } from "zod";
import { isValidTime } from "@/core/calendar/paris";
import { phoneToE164 } from "@/core/format";

const coordinate = (min: number, max: number) => z.number().min(min).max(max);

export const placeSchema = z.object({
  label: z.string().trim().min(3, { error: "Indiquez une adresse." }).max(200),
  lat: coordinate(-90, 90).nullable(),
  lng: coordinate(-180, 180).nullable(),
  postcode: z.string().trim().max(10).nullable(),
  city: z.string().trim().max(100).nullable(),
  source: z.enum(["gps", "search", "typed", "admin"]),
});

const legSchema = z.object({ km: z.number().min(0).max(2000), minutes: z.number().min(0).max(2000) });

export const quoteRequestSchema = z.object({
  pickup: placeSchema.extend({
    afterRegulatedRoad: z.boolean(),
    handoverNote: z.string().trim().max(300).nullable(),
  }),
  dropoff: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("address"), place: placeSchema }),
    z.object({ kind: z.literal("on_site") }),
    z.object({ kind: z.literal("unknown") }),
  ]),
  vehicleCategory: z.string().regex(/^[a-z0-9_]{1,40}$/, { error: "Choisissez un type de véhicule." }),
  situations: z.array(z.string().regex(/^[a-z0-9_]{1,40}$/)).max(12),
  when: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("now") }),
    z.object({
      kind: z.literal("simulated"),
      isoWeekday: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7)]),
      time: z.string().refine(isValidTime, { error: "Heure invalide." }),
      holiday: z.boolean(),
    }),
  ]),
  overrides: z
    .object({
      fuelPriceTtcMillis: z.number().int().min(100).max(10_000).optional(),
      legs: z.object({ emptyOut: legSchema, loaded: legSchema.nullable(), emptyBack: legSchema }).optional(),
    })
    .optional(),
});

/** Ce que le site public a le droit d'envoyer : pas de simulation, pas de forçage de valeurs. */
export const publicQuoteRequestSchema = quoteRequestSchema.extend({
  when: z.object({ kind: z.literal("now") }),
  overrides: z.undefined().optional(),
});

export const phoneSchema = z
  .string()
  .trim()
  .min(6, { error: "Indiquez votre numéro de téléphone." })
  .max(30)
  .refine((value) => phoneToE164(value) !== null, { error: "Ce numéro de téléphone ne semble pas valide." });

export const contactSchema = z.object({
  name: z.string().trim().min(2, { error: "Indiquez votre nom ou prénom." }).max(80),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .max(120)
    .refine((value) => value === "" || z.email().safeParse(value).success, { error: "Adresse email invalide." }),
});

export const vehicleDetailsSchema = z.object({
  brand: z.string().trim().max(40),
  model: z.string().trim().max(40),
  plate: z.string().trim().max(15),
});

export const submitRequestSchema = z.object({
  quoteId: z.uuid(),
  contact: contactSchema,
  vehicle: vehicleDetailsSchema,
  comment: z.string().trim().max(1000),
  consent: z.literal(true, { error: "Merci d'accepter que nous utilisions ces informations pour vous rappeler." }),
  /** Champ piège invisible : rempli uniquement par les robots. */
  website: z.string().max(0).optional(),
  /** Temps passé sur le formulaire (millisecondes), contre les envois automatiques. */
  elapsedMs: z.number().int().min(0).max(86_400_000),
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type SubmitRequest = z.infer<typeof submitRequestSchema>;
