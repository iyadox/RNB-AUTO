import { describe, expect, it } from "vitest";
import { SEED_RULES, SEED_SITUATIONS, SEED_VEHICLES } from "@/server/db/seed-data";
import { computeQuote } from "@/core/pricing";
import { formatEuros } from "@/core/format";
import { scenarioToEngineInput } from "@/core/quotes/types";
import { applyDraft, pricingDraftSchema, toDraft, type CurrentPricingState } from "./editor";
import { initialSettingsValues } from "./registry";
import { buildPricingConfig } from "./snapshot";

function seedState(): CurrentPricingState {
  return {
    values: initialSettingsValues(),
    rules: SEED_RULES.map((rule, index) => ({ ...rule, id: `rule-${index}` })),
    vehicles: structuredClone(SEED_VEHICLES),
    situations: structuredClone(SEED_SITUATIONS),
  };
}

describe("éditeur des tarifs", () => {
  it("un brouillon non modifié ne produit aucun changement", () => {
    const state = seedState();
    const draft = toDraft(state);
    expect(pricingDraftSchema.safeParse(draft).success).toBe(true);
    const applied = applyDraft(state, draft);
    expect(applied.errors).toEqual({});
    expect(applied.changes).toEqual([]);
  });

  it("modifie le prix minimum avec un libellé lisible", () => {
    const state = seedState();
    const draft = toDraft(state);
    draft.settings["pricing.minimum.amountCents"] = 5000;
    const applied = applyDraft(state, draft);
    expect(applied.changes).toEqual([
      expect.objectContaining({ label: "Prix de base — Montant minimum", before: formatEuros(4500), after: formatEuros(5000) }),
    ]);
    expect(applied.settingWrites).toEqual([{ key: "pricing.minimum.amountCents", value: 5000 }]);
  });

  it("refuse une valeur hors bornes et signale une valeur inhabituelle", () => {
    const state = seedState();
    const draft = toDraft(state);
    draft.settings["pricing.minimum.amountCents"] = -100;
    expect(applyDraft(state, draft).errors["setting:pricing.minimum.amountCents"]).toBeDefined();

    const draft2 = toDraft(state);
    const leg = draft2.rules.find((rule) => rule.code === "leg.loaded");
    if (!leg || leg.calculation.kind !== "per_km") throw new Error("règle manquante");
    leg.calculation = { ...leg.calculation, centsPerKm: 1500 };
    const applied = applyDraft(state, draft2);
    expect(applied.errors).toEqual({});
    expect(applied.softWarnings[0]).toContain("paraît très élevé");
  });

  it("ne laisse pas modifier les trajets concernés par une règle système", () => {
    const state = seedState();
    const draft = toDraft(state);
    const leg = draft.rules.find((rule) => rule.code === "leg.empty_out");
    if (!leg || leg.calculation.kind !== "per_km") throw new Error("règle manquante");
    leg.calculation = { ...leg.calculation, legs: ["loaded"], centsPerKm: 120 };
    const applied = applyDraft(state, draft);
    const updated = applied.next.rules.find((rule) => rule.code === "leg.empty_out");
    expect(updated?.calculation).toEqual({ kind: "per_km", centsPerKm: 120, legs: ["emptyOut"], freeKm: 0 });
  });

  it("change la plage de nuit et la passe en montant fixe", () => {
    const state = seedState();
    const draft = toDraft(state);
    const night = draft.rules.find((rule) => rule.code === "calendar.night");
    if (!night) throw new Error("règle manquante");
    night.conditions = [{ type: "time_between", start: "21:00", end: "07:00" }];
    night.calculation = { kind: "fixed", amountCents: 3000 };
    const applied = applyDraft(state, draft);
    expect(applied.errors).toEqual({});
    expect(applied.changes.map((c) => c.label)).toEqual(["Nuit — Montant", "Nuit — Quand"]);
  });

  it("ajoute une plage horaire, un véhicule et une situation", () => {
    const state = seedState();
    const draft = toDraft(state);
    draft.rules.push({
      id: "tmp",
      code: "",
      label: "Soirée",
      category: "time_slot",
      ledger: "client_price",
      enabled: true,
      effect: "add",
      calculation: { kind: "percent", rateBp: 1000, base: "full_service" },
      conditions: [{ type: "time_between", start: "19:00", end: "22:00" }],
      priority: 0,
      clientVisible: true,
      system: false,
      isNew: true,
    });
    draft.vehicles.push({
      code: "",
      tempId: "v1",
      label: "Camping-car",
      icon: "autre",
      sortOrder: 0,
      clientVisible: true,
      acceptance: "on_request",
      active: true,
      isNew: true,
      supplement: { mode: "fixed", amountCents: 8000, rateBp: 0 },
    });
    draft.situations.push({
      code: "",
      tempId: "s1",
      label: "Véhicule très bas",
      clientLabel: "Véhicule très bas",
      icon: "other",
      group: "detail",
      sortOrder: 0,
      clientVisible: false,
      onSitePossible: false,
      active: true,
      isNew: true,
      supplement: { mode: "fixed", amountCents: 1500, rateBp: 0 },
    });
    const applied = applyDraft(state, draft);
    expect(applied.errors).toEqual({});
    expect(applied.ruleInserts.map((r) => r.code)).toEqual(["calendar.slot.soiree", "vehicle.camping_car", "situation.vehicule_tres_bas"]);
    expect(applied.vehicleInserts[0]?.code).toBe("camping_car");
    // Le moteur applique immédiatement la nouvelle situation.
    const config = buildPricingConfig(applied.next.values, applied.next.rules, applied.next.vehicles, applied.next.situations);
    const result = computeQuote(
      scenarioToEngineInput(
        {
          serviceKind: "tow",
          vehicleCategory: "berline",
          situations: ["vehicule_tres_bas"],
          legs: { emptyOut: { km: 5, minutes: 10 }, loaded: { km: 5, minutes: 10 }, emptyBack: { km: 5, minutes: 10 } },
          isoWeekday: 3,
          time: "20:00",
          holiday: false,
        },
        2350,
        "admin",
      ),
      config,
    );
    expect(result.lines.find((l) => l.code === "situation.vehicule_tres_bas")?.amountCents).toBe(1500);
    expect(result.lines.find((l) => l.code === "calendar.slot.soiree")?.amountCents).toBeGreaterThan(0);
  });

  it("supplément d'un véhicule : aucun → montant fixe", () => {
    const state = seedState();
    const draft = toDraft(state);
    const berline = draft.vehicles.find((v) => v.code === "berline");
    if (!berline) throw new Error("véhicule manquant");
    berline.supplement = { mode: "fixed", amountCents: 500, rateBp: 0 };
    const applied = applyDraft(state, draft);
    expect(applied.changes).toEqual([expect.objectContaining({ label: "Véhicule « Berline » — Supplément", before: "Aucun", after: formatEuros(500) })]);
  });

  it("une règle système ne peut pas être supprimée", () => {
    const state = seedState();
    const draft = toDraft(state);
    const fee = draft.rules.find((rule) => rule.code === "fee.tow");
    if (!fee) throw new Error("règle manquante");
    fee.archived = true;
    expect(Object.values(applyDraft(state, draft).errors)[0]).toContain("ne peut pas être supprimée");
  });
});

describe("valeurs de départ", () => {
  it("donnent des prix dans la moyenne du marché francilien", () => {
    const state = seedState();
    const config = buildPricingConfig(state.values, state.rules, state.vehicles, state.situations);
    const price = (scenario: Parameters<typeof scenarioToEngineInput>[0]) =>
      computeQuote(scenarioToEngineInput(scenario, 2350, "online"), config).client.priceTtcCents;
    // Remorquage court en journée (≈ 6 km d'approche, 10 km chargé).
    const shortTow = price({
      serviceKind: "tow",
      vehicleCategory: "citadine",
      situations: ["breakdown"],
      legs: { emptyOut: { km: 6, minutes: 15 }, loaded: { km: 10, minutes: 22 }, emptyBack: { km: 8, minutes: 18 } },
      isoWeekday: 2,
      time: "14:00",
      holiday: false,
    });
    expect(shortTow).toBe(10_500);
    // Batterie sur place à Drancy.
    const battery = price({
      serviceKind: "on_site",
      vehicleCategory: "citadine",
      situations: ["battery"],
      legs: { emptyOut: { km: 4.2, minutes: 11 }, loaded: null, emptyBack: { km: 4.2, minutes: 11 } },
      isoWeekday: 2,
      time: "10:00",
      holiday: false,
    });
    expect(battery).toBe(6000);
  });
});
