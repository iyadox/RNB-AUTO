import type { Metadata } from "next";
import { nationalHolidays, type Holiday } from "@/core/calendar/holidays";
import { toParisLocal } from "@/core/calendar/paris";
import { PricingEditor } from "@/components/admin/pricing/pricing-editor";
import { LinkButton, PageHeader } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { currentFuelPrice } from "@/server/fuel/service";
import { loadPricingEditor } from "@/server/pricing-admin/service";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = { title: "Mes tarifs" };

/** Prochaine date de chaque jour férié national (pour l'affichage). */
function nextHolidays(): Holiday[] {
  const today = toParisLocal(new Date()).date;
  const year = Number(today.slice(0, 4));
  const list = [...nationalHolidays(year), ...nationalHolidays(year + 1)];
  const byCode = new Map<string, Holiday>();
  for (const holiday of list) {
    if (holiday.date >= today && !byCode.has(holiday.code)) byCode.set(holiday.code, holiday);
  }
  return [...byCode.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export default async function PricingPage() {
  await requireAdmin();
  const db = await getDb();
  const [{ draft, versionNumber }, version] = await Promise.all([loadPricingEditor(db), getLatestVersion(db)]);
  const fuel = version
    ? await currentFuelPrice(db, version.snapshot.fuel)
    : { priceTtcMillis: 0, source: "manual", observedAt: null, origin: "—" };
  return (
    <>
      <PageHeader
        title="Mes tarifs"
        description="Tous les éléments qui composent vos prix. Rien n'est enregistré tant que vous n'avez pas confirmé."
        actions={
          <>
            <LinkButton href="/admin/tester" variant="secondary">
              <Icon name="flask" size={18} />
              Tester mes tarifs
            </LinkButton>
            <LinkButton href="/admin/tarifs/historique" variant="ghost">
              <Icon name="history" size={18} />
              Historique
            </LinkButton>
          </>
        }
      />
      <PricingEditor key={versionNumber} initialDraft={draft} versionNumber={versionNumber} fuel={fuel} holidays={nextHolidays()} />
    </>
  );
}
