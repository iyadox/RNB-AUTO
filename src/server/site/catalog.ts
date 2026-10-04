/**
 * Ce que le client peut choisir (types de véhicule, problèmes), lu dans la version des tarifs
 * en vigueur pour rester cohérent avec les prix. Repli sur les données de départ si besoin.
 */
import { cache } from "react";
import type { Situation, VehicleCategory } from "@/core/pricing/types";
import { getDb } from "@/server/db/client";
import { SEED_SITUATIONS, SEED_VEHICLES } from "@/server/db/seed-data";
import { getLatestVersion } from "@/server/settings/versions";

export type PublicCatalog = {
  vehicles: Pick<VehicleCategory, "code" | "label" | "icon" | "acceptance">[];
  problems: Pick<Situation, "code" | "clientLabel" | "icon" | "onSitePossible">[];
  states: Pick<Situation, "code" | "clientLabel" | "icon">[];
  details: Pick<Situation, "code" | "clientLabel" | "icon">[];
};

function toCatalog(vehicles: VehicleCategory[], situations: Situation[]): PublicCatalog {
  const visibleSituations = situations.filter((s) => s.active && s.clientVisible).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    vehicles: vehicles
      .filter((v) => v.active && v.clientVisible && v.acceptance !== "refused")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(({ code, label, icon, acceptance }) => ({ code, label, icon, acceptance })),
    problems: visibleSituations
      .filter((s) => s.group === "problem")
      .map(({ code, clientLabel, icon, onSitePossible }) => ({ code, clientLabel, icon, onSitePossible })),
    states: visibleSituations.filter((s) => s.group === "state").map(({ code, clientLabel, icon }) => ({ code, clientLabel, icon })),
    details: visibleSituations.filter((s) => s.group === "detail").map(({ code, clientLabel, icon }) => ({ code, clientLabel, icon })),
  };
}

export const getPublicCatalog = cache(async (): Promise<PublicCatalog> => {
  try {
    const db = await getDb();
    const version = await getLatestVersion(db);
    if (version) return toCatalog(version.snapshot.pricing.vehicles, version.snapshot.pricing.situations);
  } catch {
    // Base indisponible : on garde les choix de départ, le site reste utilisable.
  }
  return toCatalog(SEED_VEHICLES, SEED_SITUATIONS);
});
