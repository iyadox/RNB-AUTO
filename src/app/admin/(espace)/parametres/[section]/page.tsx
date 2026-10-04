import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { keysOfSection, SECTIONS } from "@/core/settings/registry";
import { settingsPageOf } from "@/core/settings/settings-pages";
import { DepotEditor } from "@/components/admin/settings/depot-editor";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { Alert, PageHeader } from "@/components/admin/ui";
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
  notifications: "Chaque nouvelle demande envoyée depuis le site est aussi envoyée par email (si un service d'email est configuré).",
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
    </>
  );
}
