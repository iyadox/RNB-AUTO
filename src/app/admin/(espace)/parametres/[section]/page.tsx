import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { keysOfSection, SECTIONS } from "@/core/settings/registry";
import { settingsPageOf } from "@/core/settings/settings-pages";
import { DepotEditor } from "@/components/admin/settings/depot-editor";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { DeviceAlerts } from "@/components/admin/settings/device-alerts";
import { ServiceTestButton } from "@/components/admin/settings/service-tests";
import { Alert, Badge, PageHeader, SectionTitle } from "@/components/admin/ui";
import { formatDateTime } from "@/core/format";
import { emailOverview, type EmailOverview } from "@/server/notifications/service";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { loadSettingsValues } from "@/server/settings/repository";

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const page = settingsPageOf((await params).section);
  return { title: page ? SECTIONS[page.section].label : "Paramètres" };
}

/** Explications propres à certaines sections. */
const INTROS: Partial<Record<string, string>> = {
  company: "Ces informations s'affichent sur tout le site (boutons Appeler et WhatsApp, pied de page, contact). Tant qu'un numéro manque, le site affiche « À COMPLÉTER ».",
  legal: "Informations obligatoires des mentions légales. N'inscrivez que des informations exactes : elles engagent l'entreprise.",
  zone: "Au-delà de ces distances, le site ne montre pas de prix automatique : il propose d'être rappelé.",
  routing: "Ce réglage change la façon de calculer les itinéraires pour toutes les prochaines estimations.",
  notifications: "Chaque nouvelle demande s'affiche dans l'espace avec une alerte. Elle peut aussi vous être envoyée par email.",
};

export default async function SettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  await requireAdmin();
  const page = settingsPageOf((await params).section);
  if (!page) notFound();
  const db = await getDb();
  const values = await loadSettingsValues(db);
  const meta = SECTIONS[page.section];
  const keys = keysOfSection(page.section);
  const intro = INTROS[page.section];
  const email = page.section === "notifications" ? await emailOverview(db) : null;

  return (
    <>
      <PageHeader back={{ href: "/admin/parametres", label: "Paramètres" }} title={meta.label} description={meta.description} />
      {intro ? (
        <div className="mb-5">
          <Alert tone="info">{intro}</Alert>
        </div>
      ) : null}
      {page.section === "depot" ? (
        <DepotEditor initial={values["company.depot"]} />
      ) : (
        <SettingsForm section={page.section} keys={keys} initial={Object.fromEntries(keys.map((key) => [key, values[key]]))} />
      )}
      {email ? <NotificationsExtras email={email} /> : null}
    </>
  );
}

const SEND_STATUS: Record<string, { label: string; tone: "good" | "warn" | "danger" | "neutral" }> = {
  sent: { label: "Envoyé", tone: "good" },
  skipped: { label: "Non envoyé", tone: "warn" },
  failed: { label: "Échec", tone: "danger" },
  pending: { label: "En cours", tone: "neutral" },
};

/** Page « Notifications » : état des emails, comment les activer, alertes sur cet appareil. */
function NotificationsExtras({ email }: { email: EmailOverview }) {
  return (
    <div className="-mt-20">
      <SectionTitle icon="mail" description="Chaque nouvelle demande du site vous est envoyée par email, avec un bouton pour l'ouvrir.">
        Emails des nouvelles demandes
      </SectionTitle>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 rounded-3xl border border-asphalt-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-extrabold">{email.serviceConfigured ? "Envoi des emails activé" : "Envoi des emails pas encore activé"}</p>
          <Badge tone={email.serviceConfigured ? "good" : "warn"} className="shrink-0">{email.serviceConfigured ? "Activé" : "À activer"}</Badge>
        </div>
        <p className="text-asphalt-600">
          Destinataire : <strong className="break-all text-asphalt-900">{email.recipient || "aucun pour le moment (indiquez un email ci-dessus ou dans « Entreprise »)"}</strong>
        </p>
        {!email.serviceConfigured ? (
          <Alert tone="warn" title="Comment l'activer (une seule fois)">
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              <li>Créez un compte gratuit sur resend.com et ajoutez-y votre nom de domaine.</li>
              <li>Chez votre hébergeur (Netlify : Configuration du site → Variables d&apos;environnement), ajoutez RESEND_API_KEY (la clé donnée par Resend) et EMAIL_FROM (l&apos;adresse d&apos;envoi, sur votre domaine).</li>
              <li>Relancez la mise en ligne, puis touchez « Envoyer un email d&apos;essai ».</li>
            </ol>
            <p className="mt-2">En attendant, rien n&apos;est perdu : toutes les demandes arrivent ici, avec une alerte.</p>
          </Alert>
        ) : null}
        <ServiceTestButton kind="email" />
        {email.recent.length > 0 ? (
          <ul className="divide-y divide-asphalt-100 rounded-2xl border border-asphalt-100 text-sm">
            {email.recent.map((n) => {
              const meta = SEND_STATUS[n.status] ?? SEND_STATUS.pending!;
              return (
                <li key={n.id} className="min-w-0 px-4 py-2.5">
                  <p className="truncate font-semibold">{n.subject.replace(/^\P{L}+/u, "")}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-asphalt-500">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    {formatDateTime(n.createdAt)}
                  </p>
                  {n.lastError ? <p className="mt-0.5 text-asphalt-500">{n.lastError}</p> : null}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      <SectionTitle icon="phone" description="Réglage propre au téléphone ou à l'ordinateur que vous utilisez en ce moment.">
        Alertes sur cet appareil
      </SectionTitle>
      <div className="rounded-3xl border border-asphalt-200 bg-white p-5">
        <DeviceAlerts />
      </div>
    </div>
  );
}
