/**
 * Schéma de la base de données (PostgreSQL).
 * Montants en centimes (`_cents`), prix du carburant en millièmes d'euro (`_millis`).
 * Les noms techniques sont en anglais ; l'administration n'affiche que des libellés français.
 */
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Calculation, Condition, QuoteResult } from "@/core/pricing/types";
import type { ConfigSnapshot } from "@/core/settings/snapshot";
import type { QuoteContext, QuoteRequestInput, ReferenceScenario } from "@/core/quotes/types";

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

/** Données binaires (photos). Buffer à l'écriture : accepté par les deux pilotes. */
const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType: () => "bytea",
  toDriver: (value) => Buffer.from(value),
  fromDriver: (value) => new Uint8Array(value),
});

// ─── Utilisateurs et sécurité ────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  /** « admin » aujourd'hui ; plus tard « dispatcher », « driver ». */
  role: text("role").notNull().default("admin"),
  active: boolean("active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    /** Empreinte SHA-256 du jeton : le jeton lui-même n'est jamais stocké. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Compteurs de limitation des abus (connexion, estimations, envoi de demandes…). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
});

// ─── Réglages et tarifs ──────────────────────────────────────────────────────

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: updatedAt(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export const pricingRules = pgTable(
  "pricing_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    label: text("label").notNull(),
    help: text("help"),
    category: text("category").notNull(),
    ledger: text("ledger").notNull(),
    enabled: boolean("enabled").notNull(),
    effect: text("effect").notNull().default("add"),
    calculation: jsonb("calculation").$type<Calculation>().notNull(),
    conditions: jsonb("conditions").$type<Condition[]>().notNull().default([]),
    priority: integer("priority").notNull().default(100),
    clientVisible: boolean("client_visible").notNull().default(false),
    clientLabel: text("client_label"),
    system: boolean("system").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [uniqueIndex("pricing_rules_code_idx").on(t.code)],
);

export const vehicleCategories = pgTable("vehicle_categories", {
  code: text("code").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").notNull().default("car"),
  sortOrder: integer("sort_order").notNull().default(100),
  clientVisible: boolean("client_visible").notNull().default(true),
  acceptance: text("acceptance").notNull().default("accepted"),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const situations = pgTable("situations", {
  code: text("code").primaryKey(),
  label: text("label").notNull(),
  clientLabel: text("client_label").notNull(),
  icon: text("icon").notNull().default("wrench"),
  groupName: text("group_name").notNull().default("problem"),
  sortOrder: integer("sort_order").notNull().default(100),
  clientVisible: boolean("client_visible").notNull().default(true),
  onSitePossible: boolean("on_site_possible").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Versions non modifiables de l'ensemble des tarifs. */
export const pricingConfigVersions = pgTable("pricing_config_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  versionNumber: integer("version_number").notNull().unique(),
  snapshot: jsonb("snapshot").$type<ConfigSnapshot>().notNull(),
  hash: text("hash").notNull(),
  changeSummary: text("change_summary").notNull(),
  reason: text("reason"),
  createdAt: createdAt(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
});

/** Journal de toutes les modifications importantes. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    userLabel: text("user_label").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    field: text("field").notNull(),
    label: text("label").notNull(),
    oldValue: jsonb("old_value").$type<unknown>(),
    newValue: jsonb("new_value").$type<unknown>(),
    displayOld: text("display_old"),
    displayNew: text("display_new"),
    reason: text("reason"),
    configVersionId: uuid("config_version_id").references(() => pricingConfigVersions.id, { onDelete: "set null" }),
  },
  (t) => [index("audit_log_at_idx").on(t.at), index("audit_log_version_idx").on(t.configVersionId)],
);

/** Trajets types : servent à mesurer l'effet d'un changement de tarif. */
export const referenceTrips = pgTable("reference_trips", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  scenario: jsonb("scenario").$type<ReferenceScenario>().notNull(),
  sortOrder: integer("sort_order").notNull().default(100),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

// ─── Clients et interventions ────────────────────────────────────────────────

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("customers_phone_idx").on(t.phone)],
);

export const interventions = pgTable(
  "interventions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    status: text("status").notNull().default("new"),
    source: text("source").notNull(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    contactName: text("contact_name").notNull(),
    contactPhone: text("contact_phone").notNull(),
    contactEmail: text("contact_email"),
    pickupAddress: text("pickup_address").notNull(),
    pickupLat: doublePrecision("pickup_lat"),
    pickupLng: doublePrecision("pickup_lng"),
    pickupPostcode: text("pickup_postcode"),
    pickupCity: text("pickup_city"),
    pickupAfterRegulatedRoad: boolean("pickup_after_regulated_road").notNull().default(false),
    handoverNote: text("handover_note"),
    dropoffKind: text("dropoff_kind").notNull(),
    dropoffAddress: text("dropoff_address"),
    dropoffLat: doublePrecision("dropoff_lat"),
    dropoffLng: doublePrecision("dropoff_lng"),
    dropoffPostcode: text("dropoff_postcode"),
    dropoffCity: text("dropoff_city"),
    vehicleCategory: text("vehicle_category").notNull(),
    vehicleBrand: text("vehicle_brand"),
    vehicleModel: text("vehicle_model"),
    vehiclePlate: text("vehicle_plate"),
    situations: jsonb("situations").$type<string[]>().notNull().default([]),
    clientComment: text("client_comment"),
    internalNotes: text("internal_notes"),
    currentQuoteId: uuid("current_quote_id"),
    /** Prix montré au client au moment de sa demande (null : demande sans prix). */
    estimatedPriceCents: integer("estimated_price_cents"),
    /** Prix actuel pour l'administration : dernier calcul + ajustements (null : pas encore de prix). */
    currentPriceCents: integer("current_price_cents"),
    confirmedPriceCents: integer("confirmed_price_cents"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    confirmedBy: uuid("confirmed_by").references(() => users.id, { onDelete: "set null" }),
    /** Prévu pour la flotte : vides tant qu'il n'y a qu'une dépanneuse. */
    truckId: text("truck_id"),
    driverId: uuid("driver_id"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    enRouteAt: timestamp("en_route_at", { withTimezone: true }),
    arrivedAt: timestamp("arrived_at", { withTimezone: true }),
    loadedAt: timestamp("loaded_at", { withTimezone: true }),
    inTransitAt: timestamp("in_transit_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    /** Envoi de photos par le client : seule l'empreinte du jeton est gardée, avec sa date limite. */
    photoTokenHash: text("photo_token_hash"),
    photoTokenExpiresAt: timestamp("photo_token_expires_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("interventions_status_idx").on(t.status),
    index("interventions_photo_token_idx").on(t.photoTokenHash),
    index("interventions_created_idx").on(t.createdAt),
    index("interventions_phone_idx").on(t.contactPhone),
  ],
);

/** Estimations et leurs révisions : chaque ligne est une photographie complète. */
export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    interventionId: uuid("intervention_id").references(() => interventions.id, { onDelete: "cascade" }),
    revision: integer("revision").notNull().default(1),
    source: text("source").notNull(),
    status: text("status").notNull().default("estimated"),
    input: jsonb("input").$type<QuoteRequestInput>().notNull(),
    context: jsonb("context").$type<QuoteContext>(),
    result: jsonb("result").$type<QuoteResult>(),
    /** Pourquoi aucun prix n'a été montré au client (itinéraire indisponible, hors zone…). */
    hiddenReason: text("hidden_reason"),
    configVersionId: uuid("config_version_id").references(() => pricingConfigVersions.id, { onDelete: "restrict" }),
    engineVersion: text("engine_version"),
    priceTtcCents: integer("price_ttc_cents"),
    priceHtCents: integer("price_ht_cents"),
    clientPriceTtcCents: integer("client_price_ttc_cents"),
    internalCostCents: integer("internal_cost_cents"),
    marginCents: integer("margin_cents"),
    kmTotal: doublePrecision("km_total"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [index("quotes_intervention_idx").on(t.interventionId), index("quotes_created_idx").on(t.createdAt)],
);

export const interventionAdjustments = pgTable("intervention_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  interventionId: uuid("intervention_id")
    .notNull()
    .references(() => interventions.id, { onDelete: "cascade" }),
  effect: text("effect").notNull(),
  mode: text("mode").notNull(),
  value: integer("value").notNull(),
  reason: text("reason").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

/** Photos d'une intervention (envoyées par le client ou ajoutées par RNB AUTO). Stockage privé. */
export const interventionPhotos = pgTable(
  "intervention_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    interventionId: uuid("intervention_id")
      .notNull()
      .references(() => interventions.id, { onDelete: "cascade" }),
    mime: text("mime").notNull(),
    data: bytea("data").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    /** « client » ou « admin ». */
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("intervention_photos_intervention_idx").on(t.interventionId)],
);

/** Journal d'une intervention : statuts, appels, prix, notes. */
export const interventionEvents = pgTable(
  "intervention_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    interventionId: uuid("intervention_id")
      .notNull()
      .references(() => interventions.id, { onDelete: "cascade" }),
    at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
    byUserId: uuid("by_user_id").references(() => users.id, { onDelete: "set null" }),
    byLabel: text("by_label").notNull(),
    type: text("type").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status"),
    message: text("message"),
    data: jsonb("data").$type<Record<string, unknown>>(),
  },
  (t) => [index("intervention_events_intervention_idx").on(t.interventionId)],
);

// ─── Services externes ───────────────────────────────────────────────────────

export const routeCache = pgTable("route_cache", {
  key: text("key").primaryKey(),
  provider: text("provider").notNull(),
  distanceMeters: doublePrecision("distance_meters").notNull(),
  durationSeconds: doublePrecision("duration_seconds").notNull(),
  createdAt: createdAt(),
});

export const providerStatus = pgTable("provider_status", {
  provider: text("provider").primaryKey(),
  kind: text("kind").notNull(),
  lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
  lastFailureAt: timestamp("last_failure_at", { withTimezone: true }),
  lastError: text("last_error"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
});

export const fuelPrices = pgTable(
  "fuel_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
    fuelType: text("fuel_type").notNull(),
    priceTtcMillis: integer("price_ttc_millis").notNull(),
    source: text("source").notNull(),
    scope: text("scope").notNull(),
    sampleSize: integer("sample_size").notNull().default(1),
    status: text("status").notNull(),
    rejectionReason: text("rejection_reason"),
  },
  (t) => [index("fuel_prices_fetched_idx").on(t.fetchedAt)],
);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  interventionId: uuid("intervention_id").references(() => interventions.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

/** Compteurs atomiques (numéros de demande RNB-2026-00001…). */
export const counters = pgTable("counters", {
  key: text("key").primaryKey(),
  value: integer("value").notNull(),
});
