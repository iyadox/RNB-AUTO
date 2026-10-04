import type { Metadata } from "next";
import { formatDateTime } from "@/core/format";
import { RevertButton } from "@/components/admin/revert-button";
import { Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { listPricingHistory } from "@/server/pricing-admin/service";

export const metadata: Metadata = { title: "Historique des tarifs" };

export default async function PricingHistoryPage() {
  await requireAdmin();
  const history = await listPricingHistory(await getDb());
  const latest = history[0]?.versionNumber;
  return (
    <>
      <PageHeader
        title="Historique des tarifs"
        description="Chaque modification est conservée. Les interventions déjà créées gardent toujours leurs propres tarifs."
        back={{ href: "/admin/tarifs", label: "Mes tarifs" }}
      />
      {history.length === 0 ? (
        <EmptyState icon="history" title="Aucun historique pour le moment" />
      ) : (
        <ol className="space-y-4">
          {history.map((version) => (
            <li key={version.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-asphalt-500">
                      Version {version.versionNumber} · {formatDateTime(version.createdAt)}
                      {version.entries[0] ? ` · ${version.entries[0].userLabel}` : " · Système"}
                    </p>
                    <p className="mt-1 text-lg font-extrabold">{version.summary}</p>
                    {version.reason ? <p className="mt-1 text-asphalt-600">Motif : {version.reason}</p> : null}
                  </div>
                  {version.versionNumber === latest ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold uppercase text-green-800">En vigueur</span>
                  ) : (
                    <RevertButton versionId={version.id} versionNumber={version.versionNumber} />
                  )}
                </div>
                {version.entries.length > 1 || (version.entries[0] && version.entries[0].displayOld) ? (
                  <ul className="mt-4 divide-y divide-asphalt-100 rounded-2xl border border-asphalt-100">
                    {version.entries.map((entry) => (
                      <li key={entry.id} className="px-4 py-2.5 text-sm">
                        <p className="font-semibold">{entry.label}</p>
                        {entry.displayOld || entry.displayNew ? (
                          <p className="text-asphalt-600">
                            <span className="line-through decoration-asphalt-300">{entry.displayOld}</span>
                            <Icon name="arrowRight" size={13} className="mx-1.5 inline text-asphalt-400" />
                            <strong className="text-asphalt-900">{entry.displayNew}</strong>
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
