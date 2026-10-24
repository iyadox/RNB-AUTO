import type { Metadata } from "next";
import Link from "next/link";
import { formatFuelPrice } from "@/core/format";
import { serviceKindOf, WAITING_STATUSES, type InterventionStatus } from "@/core/interventions/status";
import { checklistProgress, setupChecklist, type ChecklistItem } from "@/core/settings/checklist";
import { AdminIcon } from "@/components/admin/admin-icons";
import { QuickAdvance } from "@/components/admin/quick-advance";
import { RequestCard } from "@/components/admin/request-card";
import { RevenueCard } from "@/components/admin/revenue-card";
import { Alert, LinkButton } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { currentFuelPrice } from "@/server/fuel/service";
import { isSimulationMode } from "@/server/geo/service";
import { loadDashboard } from "@/server/interventions/dashboard";
import { emailConfigured } from "@/server/notifications/service";
import { loadSettingsValues } from "@/server/settings/repository";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = { title: "Accueil" };

const WAITING_SHOWN = 4;
const WAITING = new Set<string>(WAITING_STATUSES);
const CHECKLIST_SHOWN = 4;

const todayFormatter = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" });

function Counter({ href, label, value, hint, icon, tone }: { href: string; label: string; value: number; hint: string; icon: IconName; tone: "yellow" | "white" | "dark" }) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-32 flex-col justify-between rounded-3xl border p-4 transition-[transform,border-color] active:scale-[0.98] sm:p-5",
        tone === "yellow" && "border-signal-500 bg-signal-500 text-asphalt-950",
        tone === "white" && "border-asphalt-200 bg-white hover:border-asphalt-400",
        tone === "dark" && "border-asphalt-800 bg-asphalt-900 text-chalk",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cn("text-sm font-extrabold", tone === "white" && "text-asphalt-600", tone === "dark" && "text-asphalt-300")}>{label}</span>
        <Icon name={icon} size={20} className={tone === "yellow" ? "text-asphalt-900" : tone === "dark" ? "text-signal-500" : "text-asphalt-400"} />
      </span>
      <span className="mt-2 block text-4xl font-extrabold leading-none tabular">{value}</span>
      <span className={cn("mt-1.5 flex items-center gap-1 text-xs font-semibold", tone === "yellow" ? "text-asphalt-800" : tone === "dark" ? "text-asphalt-300" : "text-asphalt-500")}>
        {hint}
        <Icon name="chevronRight" size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ChecklistLink({ item }: { item: ChecklistItem }) {
  return (
    <li>
      <Link href={item.href} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 transition-colors hover:bg-asphalt-50">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", item.level === "required" ? "bg-signal-500 text-asphalt-950" : "bg-asphalt-100 text-asphalt-600")}>
          <Icon name={item.icon} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold leading-snug">{item.label}</span>
          <span className="block text-xs text-asphalt-500">
            {item.level === "required" ? <strong className="text-asphalt-900">Indispensable · </strong> : null}
            {item.why}
          </span>
        </span>
        <Icon name="chevronRight" size={18} className="shrink-0 text-asphalt-400" />
      </Link>
    </li>
  );
}

export default async function AdminHome() {
  const user = await requireAdmin();
  const db = await getDb();
  const [values, dashboard, version] = await Promise.all([loadSettingsValues(db), loadDashboard(db), getLatestVersion(db)]);
  const fuel = version ? await currentFuelPrice(db, version.snapshot.fuel) : null;
  const vehicleLabels = new Map((version?.snapshot.pricing.vehicles ?? []).map((v) => [v.code, v.label]));
  const emailService = emailConfigured();
  const checklist = setupChecklist(values, { emailService });
  const progress = checklistProgress(checklist);
  const missing = checklist.filter((item) => !item.done).sort((a, b) => (a.level === b.level ? 0 : a.level === "required" ? -1 : 1));
  const firstName = user.name.trim().split(/\s+/)[0] ?? "";
  const toCallBack = dashboard.counts.to_call_back ?? 0;
  const newOnes = dashboard.counts.new ?? 0;
  const waitingRows = dashboard.open.filter((item) => WAITING.has(item.status));
  const progressRows = dashboard.open.filter((item) => !WAITING.has(item.status));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-asphalt-500 first-letter:uppercase">{todayFormatter.format(new Date())}</p>
          <h1 className="mt-0.5 text-3xl font-extrabold tracking-tight sm:text-4xl">Bonjour {firstName}</h1>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-asphalt-600 ring-1 ring-asphalt-200">
          <span className="h-2.5 w-2.5 rounded-full bg-green-600 ring-4 ring-green-100" aria-hidden="true" />
          Mis à jour automatiquement
        </p>
      </div>

      {isSimulationMode() ? (
        <div className="mb-5">
          <Alert tone="danger" title="Mode simulation des trajets activé">
            Les distances sont approximatives. À n&apos;utiliser que pour des essais.
          </Alert>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Counter href="/admin/demandes?statut=nouvelles" label="Nouvelles" value={newOnes} hint="à accepter" icon="sparkles" tone={newOnes > 0 ? "yellow" : "white"} />
        <Counter href="/admin/demandes?statut=a-rappeler" label="À rappeler" value={toCallBack} hint="clients à recontacter" icon="phone" tone="white" />
        <Counter href="/admin/demandes?statut=sur-la-route" label="En cours" value={dashboard.inProgress} hint="acceptées ou en route" icon="truck" tone="dark" />
        <Counter href="/admin/demandes?statut=toutes&periode=aujourd-hui" label="Reçues aujourd'hui" value={dashboard.createdToday} hint="toutes les demandes" icon="calendar" tone="white" />
      </div>

      <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-6">
          <section aria-labelledby="a-traiter">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="a-traiter" className="text-xl font-extrabold">
                À traiter
              </h2>
              {dashboard.waiting > 0 ? (
                <Link href="/admin/demandes?statut=en-cours" className="text-sm font-bold text-asphalt-600 hover:text-asphalt-900">
                  Tout voir
                </Link>
              ) : null}
            </div>
            {waitingRows.length === 0 ? (
              <div className="flex items-center gap-4 rounded-3xl border-2 border-dashed border-asphalt-200 bg-white p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                  <Icon name="checkCircle" size={26} />
                </span>
                <p className="text-asphalt-600">
                  <strong className="block text-asphalt-900">Aucune demande en attente.</strong>
                  Une nouvelle demande s&apos;affichera ici toute seule, avec une alerte.
                </p>
              </div>
            ) : (
              <ul className="grid gap-2.5">
                {waitingRows.slice(0, WAITING_SHOWN).map((item) => (
                  <RequestCard
                    key={item.id}
                    item={item}
                    vehicleLabel={vehicleLabels.get(item.vehicleCategory)}
                    action={<QuickAdvance id={item.id} status={item.status as InterventionStatus} serviceKind={serviceKindOf(item.dropoffKind)} name={item.contactName} />}
                  />
                ))}
              </ul>
            )}
            {dashboard.waiting > WAITING_SHOWN ? (
              <Link
                href="/admin/demandes?statut=en-cours"
                className="mt-2.5 flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-asphalt-300 text-sm font-extrabold text-asphalt-700 hover:border-asphalt-500"
              >
                Voir les {dashboard.waiting - WAITING_SHOWN} autres demandes en attente
                <Icon name="chevronRight" size={16} />
              </Link>
            ) : null}
          </section>

          {progressRows.length > 0 ? (
            <section aria-labelledby="en-cours">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="en-cours" className="text-xl font-extrabold">
                  En cours
                </h2>
                <Link href="/admin/demandes?statut=sur-la-route" className="text-sm font-bold text-asphalt-600 hover:text-asphalt-900">
                  Tout voir
                </Link>
              </div>
              <ul className="grid gap-2.5">
                {progressRows.map((item) => (
                  <RequestCard
                    key={item.id}
                    item={item}
                    vehicleLabel={vehicleLabels.get(item.vehicleCategory)}
                    action={<QuickAdvance id={item.id} status={item.status as InterventionStatus} serviceKind={serviceKindOf(item.dropoffKind)} name={item.contactName} />}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-6 lg:sticky lg:top-6">
          <RevenueCard revenue={dashboard.revenue} pendingCents={dashboard.pendingConfirmedCents} pendingCount={dashboard.pendingConfirmedCount} />

          <section aria-labelledby="raccourcis" className="grid gap-2.5">
            <h2 id="raccourcis" className="sr-only">
              Raccourcis
            </h2>
            <LinkButton href="/admin/demandes/nouvelle" size="lg">
              <Icon name="phone" size={20} />
              Saisir un appel
            </LinkButton>
            <div className="grid grid-cols-2 gap-2.5">
              <LinkButton href="/admin/tester" variant="dark" size="custom" className="h-12 whitespace-nowrap px-3 text-base">
                <Icon name="flask" size={18} />
                Tester un prix
              </LinkButton>
              <LinkButton href="/admin/tarifs" variant="secondary" size="custom" className="h-12 whitespace-nowrap px-3 text-base">
                <Icon name="euro" size={18} />
                Mes tarifs
              </LinkButton>
            </div>
          </section>

          {missing.length > 0 ? (
            <section aria-labelledby="pour-demarrer" className="rounded-3xl border border-signal-500/60 bg-signal-100 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 id="pour-demarrer" className="flex items-center gap-2 text-lg font-extrabold">
                  <Icon name="sparkles" size={20} />
                  Pour démarrer
                </h2>
                <span className="text-sm font-extrabold tabular">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-label="Informations complétées" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
                <div className="h-full rounded-full bg-asphalt-900" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
              </div>
              <p className="mt-3 text-sm text-asphalt-700">
                {progress.missingRequired > 0
                  ? `Il manque ${progress.missingRequired} information${progress.missingRequired > 1 ? "s" : ""} indispensable${progress.missingRequired > 1 ? "s" : ""}. Touchez une ligne pour la compléter.`
                  : "L'essentiel est fait. Quelques conseils restent :"}
              </p>
              <ul className="mt-3 grid gap-2">
                {missing.slice(0, CHECKLIST_SHOWN).map((item) => (
                  <ChecklistLink key={item.id} item={item} />
                ))}
              </ul>
              {missing.length > CHECKLIST_SHOWN ? (
                <details className="group mt-2">
                  <summary className="flex h-11 cursor-pointer list-none items-center justify-center gap-1.5 rounded-2xl text-sm font-extrabold text-asphalt-800 hover:bg-white/60">
                    <span className="group-open:hidden">Voir les {missing.length - CHECKLIST_SHOWN} autres</span>
                    <span className="hidden group-open:inline">Masquer</span>
                    <Icon name="chevronDown" size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="mt-2 grid gap-2">
                    {missing.slice(CHECKLIST_SHOWN).map((item) => (
                      <ChecklistLink key={item.id} item={item} />
                    ))}
                  </ul>
                </details>
              ) : null}
            </section>
          ) : null}

          <Link
            href="/admin/parametres/notifications"
            className="flex items-center gap-3 rounded-3xl border border-asphalt-200 bg-white p-4 transition-colors hover:border-asphalt-400"
          >
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", emailService ? "bg-green-50 text-green-700" : "bg-asphalt-100 text-asphalt-600")}>
              <AdminIcon name="bell" size={20} />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-extrabold">{emailService ? "Alertes par email activées" : "Alertes par email pas encore activées"}</span>
              <span className="block text-asphalt-500">
                {emailService ? "Chaque nouvelle demande vous est aussi envoyée par email." : "Les demandes arrivent ici. Pour les recevoir aussi par email, voir comment faire."}
              </span>
            </span>
            <Icon name="chevronRight" size={18} className="shrink-0 text-asphalt-400" />
          </Link>

          {fuel ? (
            <p className="px-1 text-sm text-asphalt-500">
              Carburant utilisé dans les calculs : <strong>{formatFuelPrice(fuel.priceTtcMillis)}</strong> ({fuel.origin}). Tarifs en vigueur : version {version?.versionNumber}.
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
