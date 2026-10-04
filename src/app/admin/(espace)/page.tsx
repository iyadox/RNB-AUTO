import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, gte, sql } from "drizzle-orm";
import { toParisLocal } from "@/core/calendar/paris";
import { formatEurosShort, formatFuelPrice, formatRelative } from "@/core/format";
import type { InterventionStatus } from "@/core/interventions/status";
import { StatusBadge } from "@/components/admin/status-badge";
import { Alert, Card, LinkButton, PageHeader, StatTile } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { interventions } from "@/server/db/schema";
import { currentFuelPrice } from "@/server/fuel/service";
import { isSimulationMode } from "@/server/geo/service";
import { countByStatus } from "@/server/interventions/service";
import { loadSettingsValues } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = { title: "Accueil" };

/** Début de la journée en cours, heure de Paris. */
function startOfParisDay(): Date {
  const now = new Date();
  const local = toParisLocal(now);
  const [h, m] = local.time.split(":").map(Number) as [number, number];
  return new Date(now.getTime() - (h * 60 + m) * 60_000 - now.getSeconds() * 1000);
}

export default async function AdminHome() {
  const user = await requireAdmin();
  const db = await getDb();
  const since = startOfParisDay();
  const [values, counts, recent, today, version] = await Promise.all([
    loadSettingsValues(db),
    countByStatus(db),
    db.select().from(interventions).orderBy(desc(interventions.createdAt)).limit(6),
    db
      .select({
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${interventions.status} = 'completed')::int`,
        revenue: sql<number>`coalesce(sum(${interventions.confirmedPriceCents}) filter (where ${interventions.status} = 'completed'), 0)::int`,
      })
      .from(interventions)
      .where(and(gte(interventions.createdAt, since))),
    getLatestVersion(db),
  ]);
  const fuel = version ? await currentFuelPrice(db, version.snapshot.fuel) : null;
  const waiting = (counts.new ?? 0) + (counts.to_call_back ?? 0);
  const inProgress = (counts.accepted ?? 0) + (counts.en_route ?? 0) + (counts.arrived ?? 0) + (counts.loaded ?? 0) + (counts.in_transit ?? 0);

  const todo: { label: string; href: string; icon: IconName }[] = [];
  if (!values["company.phone"]) todo.push({ label: "Indiquer le numéro de téléphone affiché sur le site", href: "/admin/parametres/entreprise", icon: "phone" });
  if (!values["company.whatsapp"] && !values["company.phone"]) todo.push({ label: "Indiquer le numéro WhatsApp", href: "/admin/parametres/entreprise", icon: "phone" });
  if (!values["company.email"]) todo.push({ label: "Indiquer l'email de contact", href: "/admin/parametres/entreprise", icon: "mail" });
  if (!values["company.depot"].confirmed) todo.push({ label: "Vérifier la position du dépôt sur la carte", href: "/admin/parametres/depot", icon: "pin" });
  if (!values["legal.siret"] || !values["legal.companyName"] || !values["legal.host"]) {
    todo.push({ label: "Compléter les mentions légales (SIRET, hébergeur…)", href: "/admin/parametres/mentions-legales", icon: "shield" });
  }
  if (!values["company.availability"]) todo.push({ label: "Indiquer votre disponibilité (ex. 24h/24 · 7j/7)", href: "/admin/parametres/entreprise", icon: "clock" });

  return (
    <>
      <PageHeader title={`Bonjour ${user.name.split(" ")[0]}`} description="Voici l'essentiel de la journée." />

      {isSimulationMode() ? (
        <div className="mb-5">
          <Alert tone="danger" title="Mode simulation des trajets activé">
            Les distances sont approximatives (variable GEO_PROVIDER=simulation). À n&apos;utiliser que pour des essais.
          </Alert>
        </div>
      ) : null}

      {todo.length > 0 ? (
        <Card tone="warn" className="mb-6">
          <p className="flex items-center gap-2 text-lg font-extrabold">
            <Icon name="sparkles" size={20} />
            Pour démarrer
          </p>
          <ul className="mt-3 grid gap-2">
            {todo.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 font-bold hover:bg-asphalt-50">
                  <Icon name={item.icon} size={20} className="text-asphalt-500" />
                  <span className="flex-1">{item.label}</span>
                  <Icon name="chevronRight" size={18} className="text-asphalt-400" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="En attente" value={waiting} hint="nouvelles ou à rappeler" icon="phone" tone={waiting > 0 ? "yellow" : "white"} />
        <StatTile label="En cours" value={inProgress} hint="acceptées ou en route" icon="truck" />
        <StatTile label="Aujourd'hui" value={today[0]?.total ?? 0} hint={`${today[0]?.completed ?? 0} terminée(s)`} icon="calendar" />
        <StatTile label="Encaissé aujourd'hui" value={formatEurosShort(today[0]?.revenue ?? 0)} hint="prix confirmés, terminées" icon="euro" tone="dark" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <LinkButton href="/admin/demandes/nouvelle" size="lg">
          <Icon name="phone" size={20} />
          Nouvelle demande
        </LinkButton>
        <LinkButton href="/admin/tester" size="lg" variant="dark">
          <Icon name="flask" size={20} />
          Tester mes tarifs
        </LinkButton>
        <LinkButton href="/admin/tarifs" size="lg" variant="secondary">
          <Icon name="euro" size={20} />
          Mes tarifs
        </LinkButton>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Dernières demandes</h2>
        <Link href="/admin/demandes" className="font-bold text-asphalt-600 hover:text-asphalt-900">
          Tout voir
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {recent.length === 0 ? (
          <Card tone="muted">
            <p className="text-asphalt-600">Aucune demande pour le moment. Les demandes envoyées depuis le site apparaîtront ici.</p>
          </Card>
        ) : (
          recent.map((item) => {
            const status = item.status as InterventionStatus;
            return (
              <Link key={item.id} href={`/admin/demandes/${item.id}`} className="flex items-center gap-4 rounded-3xl border border-asphalt-200 bg-white p-4 hover:border-asphalt-400">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold">{item.contactName}</span>
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-asphalt-500">
                    {item.pickupCity ?? item.pickupAddress}
                    {item.dropoffKind === "on_site" ? " · sur place" : item.dropoffCity ? ` → ${item.dropoffCity}` : ""} · {formatRelative(item.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-lg font-extrabold tabular">
                  {item.confirmedPriceCents !== null
                    ? formatEurosShort(item.confirmedPriceCents)
                    : item.currentPriceCents !== null
                      ? formatEurosShort(item.currentPriceCents)
                      : "—"}
                </span>
                <Icon name="chevronRight" size={18} className="text-asphalt-400" />
              </Link>
            );
          })
        )}
      </div>

      {fuel ? (
        <p className="mt-8 text-sm text-asphalt-500">
          Carburant utilisé dans les calculs : <strong>{formatFuelPrice(fuel.priceTtcMillis)}</strong> ({fuel.origin}). Tarifs en vigueur : version{" "}
          {version?.versionNumber}.
        </p>
      ) : null}
    </>
  );
}
