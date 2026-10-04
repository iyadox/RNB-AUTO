"use client";

/**
 * Feuille de route de la demande (docs/09, F.8) : le récapitulatif des choix, présenté comme la
 * feuille d'un chauffeur. Mêmes données que le récapitulatif existant ; chaque ligne ramène à
 * son étape par le `goTo` existant (aucune logique nouvelle).
 *
 * - `RoutePlan` : le Plan RNB (schématique) avec les VRAIES positions : dépôt (réglage), épingle
 *   « Vous », drapeau de destination, et les trois trajets tracés entre eux.
 * - `RouteSheetColumn` : ordinateur, colonne collante à droite (plan + lignes remplies).
 * - `RouteSheetBar` : mobile, barre NON collante sous la route des étapes, qui se déplie.
 * - `RouteRecap` : le récapitulatif de l'étape « Coordonnées », avec ses boutons « Modifier ».
 */
import { useId, useState, type ReactNode } from "react";
import { VehicleIcon } from "@/components/brand/vehicle-icon";
import { FlagGlyph, PinGlyph } from "@/components/scenes/kit/glyphs";
import { PlanIdf, planPoint, resolveDepotPosition } from "@/components/scenes/kit/plan-idf/plan-idf";
import type { PlanVariant } from "@/components/scenes/kit/plan-idf/projection";
import { RoutePaths, type RouteLeg } from "@/components/scenes/kit/route-paths";
import { formatSvgNumber as f, type Point } from "@/components/scenes/kit/svg-path";
import { PROBLEM_VOYANTS, Voyant } from "@/components/scenes/kit/voyant";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import type { PublicSiteInfo } from "@/server/site/public-info";
import styles from "./request.module.css";

export type SheetRow<T extends string> = {
  kind: "pickup" | "dropoff" | "vehicle" | "problem" | "price";
  label: string;
  value: string;
  /** Étape où l'on modifie cette ligne. */
  target: T;
  /** Code du véhicule ou du problème (pictogramme). */
  code?: string | null;
};

type LatLng = { lat: number | null; lng: number | null } | null;

const located = (place: LatLng): place is { lat: number; lng: number } =>
  Boolean(place) && place!.lat !== null && place!.lng !== null;

// ─── Pictogrammes des lignes ──────────────────────────────────────────────────

function RowGlyph({ kind, code }: { kind: SheetRow<string>["kind"]; code?: string | null }) {
  if (kind === "pickup") {
    return (
      <svg viewBox="-15 -32 30 36" width="22" height="26" aria-hidden="true">
        <PinGlyph />
      </svg>
    );
  }
  if (kind === "dropoff") {
    return (
      <svg viewBox="-8 -35 32 38" width="22" height="26" aria-hidden="true">
        <FlagGlyph />
      </svg>
    );
  }
  if (kind === "vehicle") return <VehicleIcon code={code ?? ""} className="h-5 w-8" />;
  if (kind === "problem") {
    const glyph = (code && PROBLEM_VOYANTS[code]) || "question";
    return <Voyant glyph={glyph} label="" showLabel={false} size={34} tone={code === "accident" ? "red" : "amber"} />;
  }
  return <Icon name="ticket" size={20} strokeWidth={2.2} />;
}

// ─── Plan avec les vraies positions ───────────────────────────────────────────

/** Courbe douce de a vers b, cambrée sur le côté (`bend` en proportion de la longueur). */
function arc(a: Point, b: Point, bend: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const cx = (a.x + b.x) / 2 - dy * bend;
  const cy = (a.y + b.y) / 2 + dx * bend;
  return `M${f(a.x)} ${f(a.y)}Q${f(cx)} ${f(cy)} ${f(b.x)} ${f(b.y)}`;
}
const far = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y) > 6;

export function RoutePlan({
  depot,
  pickup,
  dropoff,
  onSite,
  sweep = false,
  idPrefix,
  className,
}: {
  depot: PublicSiteInfo["depot"];
  pickup: LatLng;
  dropoff: LatLng;
  onSite: boolean;
  sweep?: boolean;
  idPrefix: string;
  className?: string;
}) {
  const depotPosition = resolveDepotPosition(depot);
  const known = [pickup, onSite ? null : dropoff].filter(located);
  // Plan du dépôt (12 km) si tout y tient, sinon le disque régional.
  let variant: PlanVariant = depotPosition ? "depot" : "region";
  if (variant === "depot") {
    for (const place of known) {
      const p = planPoint(place.lat, place.lng, "depot", depot);
      if (p.x < 40 || p.x > 560 || p.y < 40 || p.y > 560) variant = "region";
    }
  }
  const at = (place: { lat: number; lng: number }) => planPoint(place.lat, place.lng, variant, depot);
  const a = depotPosition ? at(depotPosition) : null;
  const b = located(pickup) ? at(pickup) : null;
  const c = !onSite && located(dropoff) ? at(dropoff) : null;

  const legs: RouteLeg[] = [];
  if (b) {
    if (a && far(a, b)) legs.push({ key: "aller", style: "aller", d: arc(a, b, 0.16) });
    if (c && far(b, c)) legs.push({ key: "transport", style: "transport", d: arc(b, c, -0.14) });
    const last = c ?? b;
    if (a && far(last, a)) legs.push({ key: "retour", style: "retour", d: arc(last, a, 0.22) });
  }
  const signature = legs.map((leg) => leg.d).join("|");

  const points: { kind: "vous" | "destination"; lat: number; lng: number }[] = [];
  if (located(pickup)) points.push({ kind: "vous", lat: pickup.lat, lng: pickup.lng });
  if (!onSite && located(dropoff)) points.push({ kind: "destination", lat: dropoff.lat, lng: dropoff.lng });

  return (
    <PlanIdf depot={depot} variant={variant} sweep={sweep} labels="major" points={points} className={className}>
      {legs.length > 0 ? (
        // Nouvelle clé quand les points changent : le trajet se redessine.
        <RoutePaths key={signature} legs={legs} mode="view" truck="top" idPrefix={idPrefix} scale={1.5} truckScale={1.25} />
      ) : null}
    </PlanIdf>
  );
}

// ─── Lignes ───────────────────────────────────────────────────────────────────

function RowText({ row }: { row: SheetRow<string> }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="font-plate text-plate block text-asphalt-300">{row.label}</span>
      <span className="mt-0.5 block text-[1.0625rem] font-semibold leading-snug text-chalk [overflow-wrap:anywhere]">{row.value}</span>
    </span>
  );
}

function SheetButtons<T extends string>({ rows, onEdit, className }: { rows: SheetRow<T>[]; onEdit: (target: T) => void; className?: string }) {
  return (
    <ul className={cn(styles.sheetRows, className)}>
      {rows.map((row) => (
        <li key={row.kind}>
          <button type="button" className={styles.sheetRow} onClick={() => onEdit(row.target)}>
            <span className={styles.sheetNode}>
              <RowGlyph kind={row.kind} code={row.code} />
            </span>
            <RowText row={row} />
            <Icon name="edit" size={18} className={styles.sheetEdit} />
            <span className="sr-only">Modifier</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Ordinateur : colonne collante, plan schématique puis lignes remplies. */
export function RouteSheetColumn<T extends string>({
  plan,
  rows,
  onEdit,
  className,
}: {
  plan: ReactNode;
  rows: SheetRow<T>[];
  onEdit: (target: T) => void;
  className?: string;
}) {
  return (
    <aside className={cn(styles.sheetColumn, className)} aria-label="Feuille de route">
      <div className={cn(styles.panel, styles.sheetPlan, "p-2")}>
        {plan}
        <p className="text-small flex items-center justify-between gap-3 px-2 pb-1 pt-2 text-asphalt-300">
          <span>Plan schématique</span>
          <span className="font-plate text-plate text-asphalt-300" aria-hidden="true">
            RNB AUTO
          </span>
        </p>
      </div>
      {rows.length > 0 ? (
        <div className={cn(styles.panel, "mt-4 px-4 pb-3 pt-4")}>
          <p className="font-plate text-plate flex items-center gap-2 text-signal-500">
            <Icon name="route" size={16} strokeWidth={2.4} />
            Feuille de route
          </p>
          <SheetButtons rows={rows} onEdit={onEdit} className="mt-2" />
        </div>
      ) : null}
    </aside>
  );
}

/** Mobile : barre non collante, « Pantin → Paris 11e · Berline · Panne », qui se déplie. */
export function RouteSheetBar<T extends string>({
  summary,
  rows,
  onEdit,
  className,
}: {
  summary: string;
  rows: SheetRow<T>[];
  onEdit: (target: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  if (rows.length === 0) return null;
  return (
    <div className={cn(styles.panel, className)}>
      <button
        type="button"
        className={styles.sheetBar}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="route" size={20} strokeWidth={2.2} className="shrink-0 text-signal-500" />
        <span className="line-clamp-2 min-w-0 flex-1 text-[1.0625rem] font-semibold leading-snug text-asphalt-100">
          <span className="sr-only">Feuille de route : </span>
          {summary}
        </span>
        <Icon name="chevronDown" size={20} className={cn(styles.sheetChevron, "text-asphalt-300")} />
      </button>
      {/* Rendu seulement une fois dépliée : rien de caché en double dans la page. */}
      {open ? (
        <div id={panelId} className="px-3 pb-2">
          <SheetButtons rows={rows} onEdit={onEdit} />
        </div>
      ) : null}
    </div>
  );
}

/** Étape « Coordonnées » : le récapitulatif en feuille de route, avec « Modifier » sur chaque ligne. */
export function RouteRecap<T extends string>({
  rows,
  price,
  onEdit,
}: {
  rows: SheetRow<T>[];
  price: string | null;
  onEdit: (target: T) => void;
}) {
  return (
    <div className={cn(styles.panel, "mt-10")}>
      <div className="flex items-center justify-between gap-4 px-5 pb-3 pt-5">
        <p className="flex items-center gap-2.5 text-lg font-extrabold">
          <Icon name="route" size={20} strokeWidth={2.4} className="text-signal-500" />
          Récapitulatif
        </p>
        {price !== null ? <p className="font-figure text-4xl leading-none text-signal-500">{price}</p> : null}
      </div>
      <dl className={cn(styles.sheetRows, "px-4 pb-3")}>
        {rows.map((row) => (
          <div key={row.kind} className={styles.sheetRow}>
            <span className={styles.sheetNode} aria-hidden="true">
              <RowGlyph kind={row.kind} code={row.code} />
            </span>
            <div className="min-w-0 flex-1">
              <dt className="font-plate text-plate text-asphalt-300">{row.label}</dt>
              <dd className="mt-0.5 font-semibold leading-snug text-chalk [overflow-wrap:anywhere]">{row.value}</dd>
            </div>
            <button
              type="button"
              onClick={() => onEdit(row.target)}
              className="-mr-2 flex h-12 shrink-0 items-center rounded-2xl px-3 text-[0.9375rem] font-bold text-signal-400 transition-colors hover:text-signal-300"
            >
              Modifier
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
}
