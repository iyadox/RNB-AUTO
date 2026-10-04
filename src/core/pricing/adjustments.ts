import { formatEuros, formatPercentBp } from "@/core/format";
import { htToTtc, percentOf, roundToStep, ttcToHt } from "@/core/money";
import { addMarginWarnings, marginLevelOf, marginRate } from "./engine";
import { roundingLabel } from "./stages";
import type { AdjustedPrice, ManualAdjustment, PricingConfig, QuoteLine, QuoteResult, Warning } from "./types";

/**
 * Étape 10 : ajustements manuels de l'administration sur une intervention.
 * Ils ne modifient jamais les règles. Les contrôles (minimum, marge) donnent des avertissements,
 * jamais de blocage. Le calcul repart du prix de l'estimation, avec les réglages de sa photographie.
 */
export function applyAdjustments(
  result: QuoteResult,
  adjustments: ManualAdjustment[],
  config: PricingConfig,
): AdjustedPrice {
  const start = result.totals.finalPriceCents;
  const lines: QuoteLine[] = [];
  let sum = 0;
  adjustments.forEach((adjustment, index) => {
    const raw = adjustment.mode === "amount" ? adjustment.value : percentOf(start, adjustment.value);
    const signed = adjustment.effect === "discount" ? -raw : raw;
    sum += signed;
    lines.push({
      stage: "adjustments",
      kind: "adjustment",
      code: `adjustment.${index + 1}`,
      label: adjustment.reason,
      clientVisible: false,
      amountCents: signed,
      detail: adjustment.mode === "percent" ? `${formatPercentBp(adjustment.value)} de ${formatEuros(start)}` : undefined,
      ledger: "client_price",
    });
  });

  const beforeRounding = Math.max(0, start + sum);
  let final = beforeRounding;
  const { rounding, vat, minimumPrice } = config;
  if (adjustments.length > 0 && rounding.enabled && rounding.afterAdjustments && rounding.stepCents > 1) {
    final = roundToStep(beforeRounding, rounding.stepCents, rounding.mode);
    if (final !== beforeRounding) {
      lines.push({
        stage: "adjustments",
        kind: "rounding",
        code: "adjustment.rounding",
        label: `Arrondi (${roundingLabel(rounding.stepCents, rounding.mode)})`,
        clientVisible: false,
        amountCents: final - beforeRounding,
        detail: `${formatEuros(beforeRounding)} → ${formatEuros(final)}`,
        ledger: "client_price",
      });
    }
  }

  let priceTtc = final;
  let priceHt = final;
  if (vat.subject) {
    priceTtc = vat.pricesIncludeVat ? final : htToTtc(final, vat.rateBp);
    priceHt = vat.pricesIncludeVat ? ttcToHt(final, vat.rateBp) : final;
  }

  const warnings: Warning[] = [];
  if (minimumPrice.enabled && final < minimumPrice.amountCents) {
    warnings.push({
      code: "below_minimum_price",
      message: `Prix sous le prix minimum d'une intervention (${formatEuros(minimumPrice.amountCents)}).`,
    });
  }
  const marginCents = priceHt - result.totals.internalCostCents;
  const rateBp = marginRate(marginCents, priceHt);
  const level = marginLevelOf(marginCents, rateBp, config);
  addMarginWarnings({ warnings }, level, marginCents, rateBp, config);

  return {
    lines,
    startCents: start,
    adjustmentsCents: sum,
    beforeRoundingCents: beforeRounding,
    finalPriceCents: final,
    priceTtcCents: priceTtc,
    priceHtCents: priceHt,
    marginCents,
    marginRateBp: rateBp,
    marginLevel: level,
    warnings,
  };
}

/** « Fixer le prix final » : transforme un prix voulu en ajustement avec motif. */
export function adjustmentToReachPrice(currentCents: number, targetCents: number, reason: string): ManualAdjustment | null {
  const delta = targetCents - currentCents;
  if (delta === 0) return null;
  return { effect: delta > 0 ? "supplement" : "discount", mode: "amount", value: Math.abs(delta), reason };
}
