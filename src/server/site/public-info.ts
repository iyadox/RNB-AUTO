/**
 * Informations affichées sur le site public (téléphone, WhatsApp, disponibilité…).
 * Si la base est momentanément indisponible, le site reste utilisable avec les valeurs de départ.
 */
import { cache } from "react";
import { phoneLink, type PhoneLink } from "@/core/contact";
import { computeQuote } from "@/core/pricing";
import { scenarioToEngineInput } from "@/core/quotes/types";
import { initialSettingsValues, type SettingsValues } from "@/core/settings/registry";
import { getDb } from "@/server/db/client";
import { HOME_EXAMPLE_SCENARIO } from "@/server/db/seed-data";
import { loadSettingsValues } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

export type PublicSiteInfo = {
  name: string;
  phone: PhoneLink | null;
  whatsapp: PhoneLink | null;
  email: string | null;
  availability: string | null;
  serviceArea: string;
  announcement: string | null;
  depotLabel: string;
  regulatedRoads: { enabled: boolean; message: string };
  estimateEnabled: boolean;
  legal: {
    companyName: string | null;
    legalForm: string | null;
    siret: string | null;
    vatNumber: string | null;
    address: string | null;
    publicationDirector: string | null;
    host: string | null;
    insurance: string | null;
  };
  examplePrice: { priceTtcCents: number } | null;
  /** « defaults » : la base n'a pas pu être lue, valeurs de départ affichées. */
  source: "database" | "defaults";
};

const blankToNull = (value: string) => (value.trim() === "" ? null : value.trim());

function toInfo(v: SettingsValues, source: PublicSiteInfo["source"], examplePrice: PublicSiteInfo["examplePrice"]): PublicSiteInfo {
  const phone = phoneLink(v["company.phone"]);
  const whatsapp = phoneLink(v["company.whatsapp"]) ?? phone;
  return {
    name: v["company.name"] || "RNB AUTO",
    phone,
    whatsapp,
    email: blankToNull(v["company.email"]),
    availability: blankToNull(v["company.availability"]),
    serviceArea: v["company.serviceArea"],
    announcement: v["site.announcement.enabled"] ? blankToNull(v["site.announcement.text"]) : null,
    depotLabel: v["company.depot"].label,
    regulatedRoads: { enabled: v["zone.regulatedRoads.enabled"], message: v["zone.regulatedRoads.message"] },
    estimateEnabled: v["estimate.enabled"],
    legal: {
      companyName: blankToNull(v["legal.companyName"]),
      legalForm: blankToNull(v["legal.legalForm"]),
      siret: blankToNull(v["legal.siret"]),
      vatNumber: blankToNull(v["legal.vatNumber"]),
      address: blankToNull(v["legal.address"]),
      publicationDirector: blankToNull(v["legal.publicationDirector"]),
      host: blankToNull(v["legal.host"]),
      insurance: blankToNull(v["legal.insurance"]),
    },
    examplePrice: v["site.showExamplePrice"] ? examplePrice : null,
    source,
  };
}

export const getPublicSiteInfo = cache(async (): Promise<PublicSiteInfo> => {
  try {
    const db = await getDb();
    const [values, version] = await Promise.all([loadSettingsValues(db), getLatestVersion(db)]);
    let examplePrice: PublicSiteInfo["examplePrice"] = null;
    if (version) {
      const snapshot = version.snapshot;
      const result = computeQuote(
        scenarioToEngineInput(HOME_EXAMPLE_SCENARIO, snapshot.fuel.manualPriceMillis, "online"),
        snapshot.pricing,
      );
      if (result.client.priceTtcCents !== null) examplePrice = { priceTtcCents: result.client.priceTtcCents };
    }
    return toInfo(values, "database", examplePrice);
  } catch (error) {
    if (process.env.NEXT_PHASE !== "phase-production-build") {
      console.error("[site] lecture des réglages impossible, valeurs de départ affichées :", error);
    }
    return toInfo(initialSettingsValues(), "defaults", null);
  }
});

/** Description de l'exemple de prix affiché sur l'accueil. */
export const HOME_EXAMPLE_DESCRIPTION = {
  vehicle: "Citadine en panne",
  approachKm: HOME_EXAMPLE_SCENARIO.legs.emptyOut.km,
  loadedKm: HOME_EXAMPLE_SCENARIO.legs.loaded?.km ?? 0,
  when: "un mardi après-midi",
};
