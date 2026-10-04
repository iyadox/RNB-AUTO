/**
 * Détail complet d'un calcul, réservé à l'administration : trajets, prix client ligne par ligne,
 * coûts internes, marge et avertissements. Composant sans état (page serveur ou simulateur).
 */
import { MARGIN_LEVEL_LABELS } from "@/core/pricing";
import type { LineKind, QuoteLine, QuoteResult } from "@/core/pricing/types";
import type { QuoteContext, QuoteRequestInput } from "@/core/quotes/types";
import { formatEuros, formatFuelPrice, formatKm, formatMinutes, formatPercentBp, formatSignedEuros, WEEKDAY_LABELS } from "@/core/format";
import { Badge } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";

/** Ordre d'affichage du prix client : ce qui compose le prix, puis ce qui le corrige. */
const BUILD_KINDS: LineKind[] = ["fee", "fixed_fee", "leg", "indexation", "supplement", "surcharge", "discount"];
const CORRECTION_KINDS: LineKind[] = ["rounding", "minimum", "profitability"];

function placeName(place: { city: string | null; label: string }): string {
  return place.city ?? place.label;
}

export function legNames(input: QuoteRequestInput): { emptyOut: string; loaded: string | null; emptyBack: string } {
  const pickup = placeName(input.pickup);
  const dropoff = input.dropoff.kind === "address" ? placeName(input.dropoff.place) : null;
  return {
    emptyOut: `Dépôt → ${pickup}`,
    loaded: dropoff ? `${pickup} → ${dropoff}` : null,
    emptyBack: `${dropoff ?? pickup} → Dépôt`,
  };
}

function Row({
  label,
  detail,
  amount,
  strong,
  muted,
  className,
}: {
  label: React.ReactNode;
  detail?: React.ReactNode;
  amount: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2", className)}>
      <div className="min-w-0">
        <p className={cn("font-semibold", strong && "font-extrabold", muted && "text-asphalt-400 line-through decoration-asphalt-300")}>{label}</p>
        {detail ? <p className="text-sm text-asphalt-500">{detail}</p> : null}
      </div>
      <p className={cn("shrink-0 text-right tabular font-semibold", strong && "text-lg font-extrabold", muted && "text-asphalt-400")}>{amount}</p>
    </div>
  );
}

function Block({
  title,
  icon,
  children,
  note,
  footer,
}: {
  title: string;
  icon: IconName;
  children: React.ReactNode;
  note?: string;
  footer?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-asphalt-200 bg-white">
      <div className="p-5">
        <h3 className="flex items-center gap-2 text-base font-extrabold uppercase tracking-wide">
          <Icon name={icon} size={18} className="text-asphalt-500" />
          {title}
        </h3>
        {note ? <p className="mt-0.5 text-sm text-asphalt-500">{note}</p> : null}
        <div className="mt-2 divide-y divide-asphalt-100">{children}</div>
      </div>
      {footer}
    </section>
  );
}

function lineAmount(line: QuoteLine): string {
  if (line.informative) return "—";
  return line.amountCents < 0 ? formatSignedEuros(line.amountCents) : formatEuros(line.amountCents);
}

export function MarginBadge({ level }: { level: QuoteResult["totals"]["marginLevel"] }) {
  const meta = MARGIN_LEVEL_LABELS[level];
  return <Badge tone={meta.tone === "good" ? "good" : meta.tone === "warn" ? "warn" : meta.tone === "bad" ? "bad" : "danger"}>{meta.label}</Badge>;
}

export function QuoteBreakdown({
  result,
  context,
  input,
  minimum,
}: {
  result: QuoteResult;
  context: QuoteContext | null;
  input: QuoteRequestInput;
  minimum?: { enabled: boolean; amountCents: number } | null;
}) {
  const names = legNames(input);
  const legs = context?.legs;
  const clientLines = result.lines.filter((line) => line.ledger === "client_price");
  const build = clientLines.filter((line) => BUILD_KINDS.includes(line.kind)).sort((a, b) => BUILD_KINDS.indexOf(a.kind) - BUILD_KINDS.indexOf(b.kind));
  const corrections = clientLines.filter((line) => CORRECTION_KINDS.includes(line.kind));
  const costs = result.lines.filter((line) => line.ledger === "internal_cost");
  const totals = result.totals;
  const provider = legs ? [...new Set([legs.emptyOut.provider, legs.loaded?.provider, legs.emptyBack.provider].filter(Boolean))].join(", ") : null;
  const moment = context
    ? `${WEEKDAY_LABELS[context.local.isoWeekday]} à ${context.local.time.replace(":", " h ")}${context.local.publicHoliday ? ` · ${context.local.publicHoliday}` : ""}`
    : null;

  return (
    <div className="grid gap-4">
      <Block title="Trajets" icon="route" note={provider ? `Distances : ${provider}` : undefined}>
        <Row label={`① ${names.emptyOut}`} detail="à vide" amount={`${formatKm(result.km.emptyOut)} · ${formatMinutes(result.minutes.emptyOut)}`} />
        {names.loaded ? (
          <Row label={`② ${names.loaded}`} detail="véhicule chargé" amount={`${formatKm(result.km.loaded)} · ${formatMinutes(result.minutes.loaded)}`} />
        ) : (
          <Row label="② Pas de transport" detail="dépannage sur place" amount="—" />
        )}
        <Row label={`③ ${names.emptyBack}`} detail="à vide" amount={`${formatKm(result.km.emptyBack)} · ${formatMinutes(result.minutes.emptyBack)}`} />
        <Row label="Kilométrage total" amount={formatKm(result.km.total)} strong />
        <Row
          label="Temps estimé"
          detail={`dont ${formatMinutes(result.minutes.handling)} de prise en charge`}
          amount={formatMinutes(result.minutes.driving + result.minutes.handling)}
        />
        {moment ? <Row label="Moment pris en compte" amount={moment} /> : null}
      </Block>

      <Block
        title="Prix client"
        icon="euro"
        note={totals.vatCents > 0 ? "Montants TTC" : undefined}
        footer={
          <div className="bg-asphalt-900 px-5 py-4 text-chalk">
            <div className="flex items-end justify-between gap-4">
              <p className="text-lg font-extrabold">Prix final client</p>
              <p className="text-3xl font-extrabold tabular text-signal-400">{formatEuros(totals.priceTtcCents)}</p>
            </div>
            {totals.vatCents > 0 ? (
              <p className="mt-1 text-right text-sm text-asphalt-300">
                soit {formatEuros(totals.priceHtCents)} HT + {formatEuros(totals.vatCents)} de TVA
              </p>
            ) : null}
          </div>
        }
      >
        {build.map((line, index) => (
          <Row
            key={`${line.code}-${index}`}
            label={line.label}
            detail={line.detail}
            amount={lineAmount(line)}
            muted={line.informative}
          />
        ))}
        <Row label="Prix calculé" amount={formatEuros(totals.computedPriceCents)} strong className="bg-asphalt-50 -mx-2 px-2 rounded-xl" />
        {corrections.map((line, index) => (
          <Row key={`${line.code}-${index}`} label={line.label} detail={line.detail} amount={formatSignedEuros(line.amountCents)} />
        ))}
        {minimum ? (
          <Row
            label="Prix minimum"
            detail={!minimum.enabled ? "désactivé" : result.flags.minimumApplied ? "appliqué" : "non atteint : rien à ajouter"}
            amount={formatEuros(minimum.amountCents)}
            muted={!minimum.enabled}
          />
        ) : null}
      </Block>

      <Block title="Coûts de l'entreprise" icon="wrench" note="Jamais montrés au client.">
        {costs.length === 0 ? <Row label="Aucun coût interne activé" amount="—" /> : null}
        {costs.map((line, index) => (
          <Row key={`${line.code}-${index}`} label={line.label} detail={line.detail} amount={formatEuros(line.amountCents)} />
        ))}
        {context?.fuel ? (
          <Row label="Prix du gazole utilisé" detail={context.fuel.origin} amount={formatFuelPrice(context.fuel.priceTtcMillis)} />
        ) : null}
        <Row label="Coût estimé pour l'entreprise" amount={formatEuros(totals.internalCostCents)} strong />
      </Block>

      <section
        className={cn(
          "rounded-3xl border p-5",
          totals.marginLevel === "ok" && "border-green-300 bg-green-50",
          totals.marginLevel === "below_target" && "border-signal-500/60 bg-signal-100",
          totals.marginLevel === "below_minimum" && "border-orange-300 bg-orange-50",
          totals.marginLevel === "loss" && "border-red-300 bg-red-50",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-extrabold uppercase tracking-wide">Marge estimée</p>
            <p className="text-sm text-asphalt-600">Prix hors taxes moins les coûts de l&apos;entreprise.</p>
          </div>
          <MarginBadge level={totals.marginLevel} />
        </div>
        <p className="mt-3 text-3xl font-extrabold tabular">
          {formatSignedEuros(totals.marginCents)} <span className="text-lg text-asphalt-600">({formatPercentBp(totals.marginRateBp)} du prix HT)</span>
        </p>
      </section>

      {result.warnings.length > 0 ? (
        <section className="rounded-3xl border border-signal-500/60 bg-signal-100 p-5">
          <p className="flex items-center gap-2 font-extrabold">
            <Icon name="alert" size={18} />
            À savoir
          </p>
          <ul className="mt-2 grid gap-1.5">
            {result.warnings.map((warning) => (
              <li key={warning.code} className="text-asphalt-800">
                {warning.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
