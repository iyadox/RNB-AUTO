import { describe, expect, it } from "vitest";
import { applyAdjustments, adjustmentToReachPrice } from "./adjustments";
import { isTimeInRange } from "./conditions";
import { computeQuote, EngineInputError } from "./engine";
import { PRICE_PIPELINE } from "./pipeline";
import { cergyMontreuilInput, docExampleConfig, drancyBatteryInput, rule } from "./test-fixtures";
import type { PricingConfig } from "./types";

const lineAmount = (result: ReturnType<typeof computeQuote>, code: string) =>
  result.lines.find((l) => l.code === code)?.amountCents;

describe("ordre des étapes", () => {
  it("est déclaré une seule fois, dans l'ordre documenté", () => {
    expect(PRICE_PIPELINE.map((s) => s.id)).toEqual([
      "eligibility",
      "internal_costs",
      "legs",
      "base",
      "fuel_indexation",
      "supplements",
      "calendar",
      "discounts",
      "rounding",
      "minimum",
      "profitability",
      "vat",
    ]);
  });
});

describe("exemple 1 du document 03 — dimanche 23:00, SUV non roulant, Cergy → Montreuil", () => {
  const config = docExampleConfig();
  const result = computeQuote(cergyMontreuilInput(), config);

  it("calcule chaque trajet au bon tarif", () => {
    expect(lineAmount(result, "fee.pickup")).toBe(3000);
    expect(lineAmount(result, "leg.empty_out")).toBe(3800);
    expect(lineAmount(result, "leg.loaded")).toBe(9000);
    expect(lineAmount(result, "leg.empty_back")).toBe(400);
    expect(result.totals.basePriceCents).toBe(16_200);
  });

  it("ajoute les suppléments puis les majorations sur la prestation complète", () => {
    expect(result.totals.fullServiceCents).toBe(19_200);
    expect(lineAmount(result, "calendar.night")).toBe(3840);
    expect(lineAmount(result, "calendar.sunday")).toBe(3840);
    expect(result.totals.computedPriceCents).toBe(26_880);
  });

  it("arrondit aux 5 € au-dessus et ne déclenche pas le minimum", () => {
    expect(result.totals.roundedPriceCents).toBe(27_000);
    expect(result.flags.minimumApplied).toBe(false);
    expect(result.totals.priceTtcCents).toBe(27_000);
    expect(result.totals.priceHtCents).toBe(22_500);
  });

  it("calcule le coût interne sur les trois trajets", () => {
    expect(result.totals.fuelLiters).toBeCloseTo(14.09, 2);
    expect(lineAmount(result, "cost.fuel")).toBe(2114);
    expect(lineAmount(result, "cost.wear")).toBe(1365);
    expect(lineAmount(result, "cost.depreciation")).toBe(910);
    expect(lineAmount(result, "cost.overhead")).toBe(500);
    expect(lineAmount(result, "cost.labor")).toBe(5625);
    expect(result.totals.internalCostCents).toBe(10_514);
  });

  it("donne la marge hors taxes", () => {
    expect(result.totals.marginCents).toBe(11_986);
    expect(result.totals.marginRateBp).toBe(5327);
    expect(result.totals.marginLevel).toBe("ok");
  });

  it("n'expose au client que le prix, les distances utiles et des libellés", () => {
    expect(result.client).toEqual({
      priceTtcCents: 27_000,
      includedLabels: [
        "Prise en charge",
        "Déplacement jusqu'au client",
        "Trajet avec véhicule chargé",
        "Retour au dépôt",
        "Supplément SUV",
        "Véhicule non roulant",
        "Majoration nuit",
        "Majoration dimanche",
      ],
      vehicleTripKm: 45,
      approachKm: 38,
    });
  });

  it("la somme des lignes du prix client est égale au prix final", () => {
    const sum = result.lines.filter((l) => l.ledger === "client_price").reduce((acc, l) => acc + l.amountCents, 0);
    expect(sum).toBe(result.totals.finalPriceCents);
    const cost = result.lines.filter((l) => l.ledger === "internal_cost").reduce((acc, l) => acc + l.amountCents, 0);
    expect(cost).toBe(result.totals.internalCostCents);
  });

  it("est déterministe", () => {
    expect(computeQuote(cergyMontreuilInput(), config)).toEqual(result);
  });
});

describe("exemple 2 du document 03 — batterie à Drancy, sans transport", () => {
  const result = computeQuote(drancyBatteryInput(), docExampleConfig());

  it("ignore le trajet chargé et applique le prix minimum après l'arrondi", () => {
    expect(lineAmount(result, "leg.loaded")).toBeUndefined();
    expect(result.totals.computedPriceCents).toBe(3600);
    expect(result.totals.roundedPriceCents).toBe(4000);
    expect(result.flags.minimumApplied).toBe(true);
    expect(result.totals.priceTtcCents).toBe(4500);
    expect(result.totals.priceHtCents).toBe(3750);
  });

  it("calcule le coût interne et signale une marge sous la marge visée", () => {
    expect(result.totals.internalCostCents).toBe(2951);
    expect(result.totals.marginCents).toBe(799);
    expect(result.totals.marginLevel).toBe("below_target");
    expect(result.warnings.map((w) => w.code)).toContain("margin_below_target");
    expect(result.client.vehicleTripKm).toBeNull();
  });
});

describe("exemple 3 du document 03 — l'arrondi passe avant le minimum", () => {
  it("respecte le minimum exactement avec un arrondi aux 10 € au-dessus", () => {
    const config = docExampleConfig({ rounding: { enabled: true, stepCents: 1000, mode: "up", afterAdjustments: true } });
    const result = computeQuote(drancyBatteryInput(), config);
    expect(result.totals.roundedPriceCents).toBe(4000);
    expect(result.totals.finalPriceCents).toBe(4500);
  });

  it("n'applique pas le minimum quand il est désactivé", () => {
    const config = docExampleConfig({ minimumPrice: { enabled: false, amountCents: 4500 } });
    const result = computeQuote(drancyBatteryInput(), config);
    expect(result.totals.finalPriceCents).toBe(4000);
    expect(result.flags.minimumApplied).toBe(false);
  });
});

describe("plages horaires", () => {
  it("début inclus, fin exclue, passage de minuit", () => {
    expect(isTimeInRange("21:59", "22:00", "06:00")).toBe(false);
    expect(isTimeInRange("22:00", "22:00", "06:00")).toBe(true);
    expect(isTimeInRange("00:00", "22:00", "06:00")).toBe(true);
    expect(isTimeInRange("05:59", "22:00", "06:00")).toBe(true);
    expect(isTimeInRange("06:00", "22:00", "06:00")).toBe(false);
    expect(isTimeInRange("12:00", "08:00", "18:00")).toBe(true);
    expect(isTimeInRange("18:00", "08:00", "18:00")).toBe(false);
    expect(isTimeInRange("03:00", "00:00", "00:00")).toBe(true);
  });
});

describe("cumul des majorations", () => {
  const holidaySunday = cergyMontreuilInput({ local: { isoWeekday: 7, time: "14:00", publicHoliday: "Noël" } });

  it("dimanche + jour férié : seule la plus élevée s'applique (groupe « jours » en « max »)", () => {
    const result = computeQuote(holidaySunday, docExampleConfig());
    expect(lineAmount(result, "calendar.holiday")).toBe(4800);
    expect(lineAmount(result, "calendar.sunday")).toBe(0);
    expect(result.lines.find((l) => l.code === "calendar.sunday")?.informative).toBe(true);
    expect(result.totals.surchargesCents).toBe(4800);
  });

  it("dimanche + jour férié en « sum » : les deux s'additionnent", () => {
    const config = docExampleConfig({ stacking: { days: "sum", timeSlots: "max", combined: "sum" } });
    const result = computeQuote(holidaySunday, config);
    expect(result.totals.surchargesCents).toBe(4800 + 3840);
  });

  it("nuit + dimanche en « max » combiné : une seule majoration", () => {
    const config = docExampleConfig({ stacking: { days: "max", timeSlots: "max", combined: "max" } });
    const result = computeQuote(cergyMontreuilInput(), config);
    expect(result.totals.surchargesCents).toBe(3840);
  });

  it("les pourcentages ne se multiplient pas", () => {
    const result = computeQuote(cergyMontreuilInput(), docExampleConfig());
    expect(result.totals.surchargesCents).toBe(Math.round(19_200 * 0.4));
  });
});

describe("vérifications avant d'afficher un prix au client", () => {
  it("véhicule « sur demande » : pas de prix client, mais le calcul reste visible pour l'admin", () => {
    const result = computeQuote(cergyMontreuilInput({ vehicleCategory: "grand_fourgon" }), docExampleConfig());
    expect(result.client.priceTtcCents).toBeNull();
    expect(result.flags.hiddenReasons).toEqual(["vehicle_on_request"]);
    expect(result.totals.priceTtcCents).toBeGreaterThan(0);
  });

  it("client trop loin du dépôt : pas de prix client", () => {
    const input = cergyMontreuilInput();
    input.legs.emptyOut.km = 120;
    const result = computeQuote(input, docExampleConfig());
    expect(result.flags.hiddenReasons).toContain("out_of_zone_approach");
    expect(result.client.priceTtcCents).toBeNull();
  });

  it("refuse les entrées incohérentes", () => {
    expect(() => computeQuote(cergyMontreuilInput({ serviceKind: "tow", legs: { emptyOut: { km: 1, minutes: 1 }, loaded: null, emptyBack: { km: 1, minutes: 1 } } }), docExampleConfig())).toThrow(EngineInputError);
    const bad = cergyMontreuilInput();
    bad.legs.emptyOut.km = Number.NaN;
    expect(() => computeQuote(bad, docExampleConfig())).toThrow(EngineInputError);
  });
});

describe("rentabilité des estimations en ligne", () => {
  const farApproach = () => {
    const input = drancyBatteryInput({ channel: "online" });
    input.legs.emptyOut = { km: 60, minutes: 60 };
    input.legs.emptyBack = { km: 60, minutes: 60 };
    return input;
  };
  const lowPrices = (policy: "raise" | "warn" | "hide"): PricingConfig => {
    const config = docExampleConfig({ margin: { minimumCents: 1500, targetBp: 3000, onlineBelowMinimum: policy } });
    config.rules = config.rules.map((r) =>
      r.code === "leg.empty_out" || r.code === "leg.empty_back"
        ? { ...r, calculation: { kind: "per_km", centsPerKm: 10, legs: r.code === "leg.empty_out" ? ["emptyOut"] : ["emptyBack"], freeKm: 0 } }
        : r,
    );
    return config;
  };

  it("relève le prix jusqu'à la marge minimale, arrondi au-dessus", () => {
    const result = computeQuote(farApproach(), lowPrices("raise"));
    expect(result.flags.profitabilityApplied).toBe(true);
    expect(result.totals.priceHtCents - result.totals.internalCostCents).toBeGreaterThanOrEqual(1500);
    expect(result.totals.finalPriceCents % 500).toBe(0);
    expect(result.client.priceTtcCents).toBe(result.totals.priceTtcCents);
  });

  it("peut masquer le prix au lieu de le relever", () => {
    const result = computeQuote(farApproach(), lowPrices("hide"));
    expect(result.client.priceTtcCents).toBeNull();
    expect(result.flags.hiddenReasons).toContain("not_profitable");
  });

  it("dans l'administration : avertit sans modifier le prix", () => {
    const input = farApproach();
    input.channel = "admin";
    const result = computeQuote(input, lowPrices("raise"));
    expect(result.flags.profitabilityApplied).toBe(false);
    expect(result.totals.marginLevel).toBe("loss");
    expect(result.warnings.map((w) => w.code)).toContain("loss");
  });
});

describe("règles et conditions", () => {
  it("désactiver un supplément ne fait jamais monter le prix", () => {
    const config = docExampleConfig();
    const withSupplement = computeQuote(cergyMontreuilInput(), config).totals.finalPriceCents;
    config.rules = config.rules.map((r) => (r.code === "vehicle.suv" ? { ...r, enabled: false } : r));
    expect(computeQuote(cergyMontreuilInput(), config).totals.finalPriceCents).toBeLessThanOrEqual(withSupplement);
  });

  it("forfait différent selon remorquage ou dépannage sur place", () => {
    const config = docExampleConfig();
    config.rules = [
      ...config.rules.filter((r) => r.code !== "fee.pickup"),
      rule("fee.tow", "fee", { kind: "fixed", amountCents: 7500 }, { conditions: [{ type: "service_kind", kind: "tow" }] }),
      rule("fee.on_site", "fee", { kind: "fixed", amountCents: 5500 }, { conditions: [{ type: "service_kind", kind: "on_site" }] }),
    ];
    const onSite = computeQuote(drancyBatteryInput(), config);
    expect(lineAmount(onSite, "fee.on_site")).toBe(5500);
    expect(lineAmount(onSite, "fee.tow")).toBeUndefined();
  });

  it("kilomètres offerts et facturation au km supérieur", () => {
    const config = docExampleConfig({ distance: { billingPrecision: "ceil" } });
    config.rules = config.rules.map((r) =>
      r.code === "leg.loaded" ? { ...r, calculation: { kind: "per_km", centsPerKm: 200, legs: ["loaded"], freeKm: 5 } } : r,
    );
    const input = cergyMontreuilInput();
    input.legs.loaded = { km: 44.2, minutes: 50 };
    const result = computeQuote(input, config);
    expect(result.billedKm.loaded).toBe(45);
    expect(lineAmount(result, "leg.loaded")).toBe((45 - 5) * 200);
  });

  it("remise automatique en pourcentage de l'estimation", () => {
    const config = docExampleConfig();
    config.rules.push(
      rule("discount.pro", "discount", { kind: "percent", rateBp: 1000, base: "estimate" }, { effect: "subtract", label: "Remise professionnelle" }),
    );
    const result = computeQuote(cergyMontreuilInput(), config);
    expect(lineAmount(result, "discount.pro")).toBe(-2688);
    expect(result.totals.computedPriceCents).toBe(26_880 - 2688);
  });

  it("indexation du carburant plafonnée", () => {
    const config = docExampleConfig({ fuelIndexation: { enabled: true, referencePriceMillis: 1800, shareBp: 3000, capBp: 200 } });
    const result = computeQuote(cergyMontreuilInput({ fuelPriceTtcMillis: 1980 }), config);
    // +10 % de carburant × 30 % = +3 %, plafonné à +2 % de la part kilométrique (132 €).
    expect(lineAmount(result, "fuel.indexation")).toBe(264);
  });

  it("TVA non applicable : HT = TTC", () => {
    const config = docExampleConfig({ vat: { subject: false, rateBp: 2000, pricesIncludeVat: true, fuelRecoverableBp: 10_000 } });
    const result = computeQuote(cergyMontreuilInput(), config);
    expect(result.totals.priceHtCents).toBe(result.totals.priceTtcCents);
    expect(lineAmount(result, "cost.fuel")).toBe(Math.round(14.09 * 180));
  });
});

describe("ajustements manuels", () => {
  const config = docExampleConfig();
  const result = computeQuote(cergyMontreuilInput(), config);

  it("supplément en euros puis remise en pourcentage, arrondis ensuite", () => {
    const adjusted = applyAdjustments(
      result,
      [
        { effect: "supplement", mode: "amount", value: 1000, reason: "Attente supplémentaire" },
        { effect: "discount", mode: "percent", value: 1000, reason: "Client régulier" },
      ],
      config,
    );
    expect(adjusted.adjustmentsCents).toBe(1000 - 2700);
    expect(adjusted.beforeRoundingCents).toBe(25_300);
    expect(adjusted.finalPriceCents).toBe(25_500);
    expect(adjusted.priceHtCents).toBe(21_250);
  });

  it("avertit sous le minimum et en cas de perte, sans bloquer", () => {
    const adjusted = applyAdjustments(result, [{ effect: "discount", mode: "amount", value: 25_000, reason: "Geste commercial" }], config);
    expect(adjusted.finalPriceCents).toBe(2000);
    expect(adjusted.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(["below_minimum_price", "loss"]));
  });

  it("« fixer le prix final » devient un ajustement avec motif", () => {
    expect(adjustmentToReachPrice(27_000, 25_000, "Prix convenu")).toEqual({
      effect: "discount",
      mode: "amount",
      value: 2000,
      reason: "Prix convenu",
    });
    expect(adjustmentToReachPrice(27_000, 27_000, "x")).toBeNull();
  });
});
