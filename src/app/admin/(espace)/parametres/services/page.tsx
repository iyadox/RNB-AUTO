import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { formatDateTime, formatFuelPrice } from "@/core/format";
import { ServiceTestButton } from "@/components/admin/settings/service-tests";
import { Alert, Badge, PageHeader } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb, isPostgresUrl } from "@/server/db/client";
import { fuelPrices, notifications, providerStatus } from "@/server/db/schema";
import { currentFuelPrice } from "@/server/fuel/service";
import { isSimulationMode, providerLabels } from "@/server/geo/service";
import { emailConfigured } from "@/server/notifications/service";
import { loadSettingsValues } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = { title: "Services externes" };

const NOTIFICATION_STATUS: Record<string, { label: string; tone: "good" | "warn" | "danger" | "neutral" }> = {
  sent: { label: "Envoyé", tone: "good" },
  skipped: { label: "Non envoyé", tone: "warn" },
  failed: { label: "Échec", tone: "danger" },
  pending: { label: "En cours", tone: "neutral" },
};

function Panel({ icon, title, status, children }: { icon: IconName; title: string; status: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl border border-asphalt-200 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <Icon name={icon} size={20} className="text-asphalt-500" />
          {title}
        </h2>
        {status}
      </div>
      <div className="grid grid-cols-1 gap-3">{children}</div>
    </section>
  );
}

export default async function ServicesPage() {
  await requireAdmin();
  const db = await getDb();
  const [statuses, version, values, lastFuel, lastNotifications] = await Promise.all([
    db.select().from(providerStatus),
    getLatestVersion(db),
    loadSettingsValues(db),
    db.select().from(fuelPrices).orderBy(desc(fuelPrices.observedAt)).limit(4),
    db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(5),
  ]);
  const fuel = version ? await currentFuelPrice(db, version.snapshot.fuel) : null;
  const labels = providerLabels();
  const simulation = isSimulationMode();
  const failing = statuses.filter((s) => s.consecutiveFailures > 0);
  const email = emailConfigured();
  const recipient = values["notifications.email"] || values["company.email"];
  const postgres = isPostgresUrl(process.env.DATABASE_URL ?? "");

  return (
    <>
      <PageHeader
        back={{ href: "/admin/parametres", label: "Paramètres" }}
        title="Services externes"
        description="Le site s'appuie sur des services publics gratuits. Si l'un d'eux ne répond pas, les clients peuvent toujours appeler et envoyer une demande."
      />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel
          icon="route"
          title="Adresses et itinéraires"
          status={simulation ? <Badge tone="danger">Simulation</Badge> : failing.length > 0 ? <Badge tone="warn">Perturbé</Badge> : <Badge tone="good">Actif</Badge>}
        >
          {simulation ? (
            <Alert tone="danger">Mode simulation (GEO_PROVIDER=simulation) : distances approximatives, à n&apos;utiliser que pour des essais.</Alert>
          ) : null}
          <p className="text-sm text-asphalt-600">
            Recherche d&apos;adresses : {labels.geocoding.join(", ") || "aucun"}.<br />
            Calcul des trajets : {labels.routing.join(", ") || "aucun"} (dans cet ordre, en cas de panne du premier).
          </p>
          {statuses.length > 0 ? (
            <ul className="divide-y divide-asphalt-100 rounded-2xl border border-asphalt-100 text-sm">
              {statuses.map((s) => (
                <li key={s.provider} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span className="font-semibold">{s.provider}</span>
                  <span className="text-asphalt-500">
                    {s.consecutiveFailures > 0
                      ? `${s.consecutiveFailures} échec(s) · ${s.lastFailureAt ? formatDateTime(s.lastFailureAt) : ""}`
                      : s.lastSuccessAt
                        ? `OK · ${formatDateTime(s.lastSuccessAt)}`
                        : "—"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <ServiceTestButton kind="routing" />
        </Panel>

        <Panel icon="fuel" title="Prix du carburant" status={<Badge tone={values["fuel.mode"] === "auto" ? "info" : "neutral"}>{values["fuel.mode"] === "auto" ? "Automatique" : "Manuel"}</Badge>}>
          {fuel ? (
            <p>
              Prix utilisé dans les calculs : <strong>{formatFuelPrice(fuel.priceTtcMillis)}</strong>
              <span className="block text-sm text-asphalt-500">{fuel.origin}</span>
            </p>
          ) : null}
          {lastFuel.length > 0 ? (
            <ul className="divide-y divide-asphalt-100 rounded-2xl border border-asphalt-100 text-sm">
              {lastFuel.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span>{formatDateTime(row.observedAt)}</span>
                  <span className="font-semibold">
                    {formatFuelPrice(row.priceTtcMillis)} {row.status === "rejected" ? <Badge tone="danger">ignoré</Badge> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-asphalt-500">Aucun relevé automatique pour le moment (source : données publiques prix-carburants).</p>
          )}
          <ServiceTestButton kind="fuel" />
        </Panel>

        <Panel icon="mail" title="Emails des nouvelles demandes" status={email ? <Badge tone="good">Configuré</Badge> : <Badge tone="warn">Non configuré</Badge>}>
          <p className="text-sm text-asphalt-600">
            Destinataire : <strong>{recipient || "aucun (Paramètres → Notifications)"}</strong>.
            {email ? null : " Pour recevoir les demandes par email, ajoutez RESEND_API_KEY et EMAIL_FROM chez votre hébergeur."} Les demandes restent toujours visibles ici, même sans
            email.
          </p>
          {lastNotifications.length > 0 ? (
            <ul className="divide-y divide-asphalt-100 rounded-2xl border border-asphalt-100 text-sm">
              {lastNotifications.map((n) => {
                const meta = NOTIFICATION_STATUS[n.status] ?? NOTIFICATION_STATUS.pending!;
                return (
                  <li key={n.id} className="px-4 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold">{n.subject}</span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>
                    <p className="text-asphalt-500">
                      {formatDateTime(n.createdAt)}
                      {n.lastError ? ` · ${n.lastError}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : null}
          <ServiceTestButton kind="email" />
        </Panel>

        <Panel icon="shield" title="Base de données" status={<Badge tone={postgres ? "good" : "warn"}>{postgres ? "PostgreSQL" : "Locale (essai)"}</Badge>}>
          <p className="text-sm text-asphalt-600">
            {postgres
              ? "Les données sont enregistrées dans votre base PostgreSQL. Pensez aux sauvegardes automatiques proposées par votre hébergeur."
              : "Base locale de développement : parfaite pour essayer, mais à remplacer par PostgreSQL pour la mise en ligne (variable DATABASE_URL)."}
          </p>
        </Panel>
      </div>
    </>
  );
}
