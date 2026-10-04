/** Ce qui est montré au client : jamais les coûts internes, la marge ni le détail des règles. */
import type { LineKind, QuoteResult } from "@/core/pricing/types";

export type ClientEstimate = {
  quoteId: string | null;
  priceTtcCents: number | null;
  /** Explication lorsque aucun prix automatique n'est proposé. */
  message: string | null;
  includedLabels: string[];
  vehicleTripKm: number | null;
  approachKm: number | null;
  serviceKind: "tow" | "on_site" | "unknown";
  validUntil: string | null;
};

const BASE_KINDS: LineKind[] = ["fee", "leg", "fixed_fee"];
const SUPPLEMENT_KINDS: LineKind[] = ["supplement", "surcharge", "discount"];

export function clientIncludedLabels(result: QuoteResult, withSupplements: boolean): string[] {
  const kinds = withSupplements ? [...BASE_KINDS, ...SUPPLEMENT_KINDS] : BASE_KINDS;
  const ordered = [...result.lines]
    .filter((line) => kinds.includes(line.kind))
    .sort((a, b) => kinds.indexOf(a.kind) - kinds.indexOf(b.kind));
  const labels: string[] = [];
  for (const line of ordered) {
    if (!line.clientVisible || line.informative || !line.clientLabel) continue;
    if (line.amountCents === 0 && !BASE_KINDS.includes(line.kind)) continue;
    if (!labels.includes(line.clientLabel)) labels.push(line.clientLabel);
  }
  return labels;
}
