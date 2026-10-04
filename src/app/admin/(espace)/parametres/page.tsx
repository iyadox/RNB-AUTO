import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime } from "@/core/format";
import { keysOfSection, SECTIONS, SETTINGS, type SettingDef, type SettingsValues } from "@/core/settings/registry";
import { SETTINGS_PAGES } from "@/core/settings/settings-pages";
import { Badge, PageHeader, SectionTitle } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { recentSettingChanges } from "@/server/settings/admin";
import { loadSettingsValues } from "@/server/settings/repository";

export const metadata: Metadata = { title: "Paramètres" };

/** Nombre d'informations encore à compléter dans une section. */
function missingCount(section: (typeof SETTINGS_PAGES)[number]["section"], values: SettingsValues): number {
  if (section === "depot") return values["company.depot"].confirmed ? 0 : 1;
  return keysOfSection(section).filter((key) => {
    const def = SETTINGS[key] as SettingDef;
    return "toComplete" in def && def.toComplete && String(values[key] ?? "").trim() === "";
  }).length;
}

function Tile({ href, icon, title, description, badge }: { href: string; icon: IconName; title: string; description: string; badge?: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-3xl border border-asphalt-200 bg-white p-5 hover:border-asphalt-400">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-asphalt-900 text-signal-500">
        <Icon name={icon} size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-extrabold">{title}</span>
          {badge}
        </span>
        <span className="block text-sm text-asphalt-500">{description}</span>
      </span>
      <Icon name="chevronRight" size={20} className="shrink-0 text-asphalt-400" />
    </Link>
  );
}

export default async function SettingsHome() {
  await requireAdmin();
  const db = await getDb();
  const [values, changes] = await Promise.all([loadSettingsValues(db), recentSettingChanges(db, 10)]);
  const tiles = (group: "company" | "trips") =>
    SETTINGS_PAGES.filter((page) => page.group === group).map((page) => {
      const missing = missingCount(page.section, values);
      return (
        <Tile
          key={page.slug}
          href={`/admin/parametres/${page.slug}`}
          icon={page.icon}
          title={SECTIONS[page.section].label}
          description={SECTIONS[page.section].description}
          badge={missing > 0 ? <Badge tone="warn">{page.section === "depot" ? "À vérifier" : `${missing} à compléter`}</Badge> : null}
        />
      );
    });

  return (
    <>
      <PageHeader title="Paramètres" description="Les informations de l'entreprise, ce qu'affiche le site, et d'où part la dépanneuse." />
      <SectionTitle icon="home">Entreprise et site</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">{tiles("company")}</div>
      <SectionTitle icon="truck">Trajets</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">{tiles("trips")}</div>
      <SectionTitle icon="settings">Compte et services</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        <Tile href="/admin/parametres/compte" icon="lock" title="Mon compte" description="Nom, email et mot de passe." />
        <Tile href="/admin/parametres/services" icon="sliders" title="Services externes" description="Itinéraires, prix du carburant, emails : état et essais." />
      </div>

      <SectionTitle icon="history" description="Qui a changé quoi, et quand.">
        Dernières modifications
      </SectionTitle>
      {changes.length === 0 ? (
        <p className="text-asphalt-500">Aucune modification pour le moment.</p>
      ) : (
        <ul className="divide-y divide-asphalt-100 rounded-3xl border border-asphalt-200 bg-white">
          {changes.map((change) => (
            <li key={change.id} className="px-5 py-3">
              <p className="font-semibold">{change.label}</p>
              <p className="break-words text-sm text-asphalt-600">
                <span className="line-through decoration-asphalt-300">{change.displayOld}</span>
                <Icon name="arrowRight" size={13} className="mx-1.5 inline text-asphalt-400" />
                <strong className="text-asphalt-900">{change.displayNew}</strong>
              </p>
              <p className="text-xs text-asphalt-400">
                {formatDateTime(change.at)} · {change.userLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
