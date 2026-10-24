/** Carte d'une demande dans les listes (accueil, demandes) : qui, où, quoi, combien, et Appeler. */
import Link from "next/link";
import { phoneLink } from "@/core/contact";
import { formatEurosShort, formatRelative, formatTime } from "@/core/format";
import { STATUS_META, type InterventionStatus } from "@/core/interventions/status";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import type { Intervention } from "@/server/interventions/service";

export const TONE_BAR: Record<string, string> = {
  info: "bg-sky-500",
  warn: "bg-signal-500",
  good: "bg-green-600",
  progress: "bg-violet-600",
  done: "bg-asphalt-900",
  muted: "bg-asphalt-300",
};

export function routeLabel(item: Pick<Intervention, "pickupCity" | "pickupAddress" | "dropoffKind" | "dropoffCity" | "dropoffAddress">): string {
  const from = item.pickupCity ?? item.pickupAddress;
  if (item.dropoffKind === "on_site") return `${from} · sur place`;
  if (item.dropoffKind === "unknown") return `${from} · destination à préciser`;
  return `${from} → ${item.dropoffCity ?? item.dropoffAddress ?? ""}`;
}

export function RequestCard({
  item,
  vehicleLabel,
  action,
  timeStyle = "relative",
}: {
  item: Intervention;
  vehicleLabel?: string;
  /** Bouton d'étape suivante (accueil). */
  action?: React.ReactNode;
  timeStyle?: "relative" | "clock";
}) {
  const status = item.status as InterventionStatus;
  const price = item.confirmedPriceCents ?? item.currentPriceCents;
  const phone = phoneLink(item.contactPhone);
  return (
    <li className="relative overflow-hidden rounded-3xl border border-asphalt-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.04)] transition-colors hover:border-asphalt-400">
      <span className={cn("absolute inset-y-0 left-0 w-1.5", TONE_BAR[STATUS_META[status].tone])} aria-hidden="true" />
      <div className="flex items-stretch">
        <Link href={`/admin/demandes/${item.id}`} className="min-w-0 flex-1 py-4 pl-5 pr-3">
          <span className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-lg font-extrabold leading-tight">{item.contactName}</span>
            <span className="shrink-0 text-lg font-extrabold leading-tight tabular">{price !== null ? formatEurosShort(price) : "—"}</span>
          </span>
          <span className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <StatusBadge status={status} />
            <span className={cn("text-xs font-bold", item.confirmedPriceCents !== null ? "text-green-700" : "text-asphalt-400")}>
              {item.confirmedPriceCents !== null ? "confirmé" : price !== null ? "à confirmer" : "sans prix"}
            </span>
          </span>
          <span className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-asphalt-700">
            <Icon name="pin" size={14} className="shrink-0 text-asphalt-400" />
            <span className="truncate">{routeLabel(item)}</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-asphalt-500">
            {timeStyle === "clock" ? formatTime(item.createdAt) : formatRelative(item.createdAt)} · {item.reference}
            {vehicleLabel ? ` · ${vehicleLabel}` : ""}
            {item.source !== "web" ? " · appel" : ""}
          </span>
        </Link>
        <a
          href={phone?.href ?? `tel:${item.contactPhone}`}
          className="flex w-14 shrink-0 items-center justify-center border-l border-asphalt-100 text-asphalt-700 transition-colors hover:bg-signal-500 hover:text-asphalt-950"
          aria-label={`Appeler ${item.contactName}`}
        >
          <Icon name="phone" size={22} />
        </a>
      </div>
      {action ? <div className="border-t border-asphalt-100 bg-asphalt-50/60 px-3 py-2.5 pl-5">{action}</div> : null}
    </li>
  );
}
