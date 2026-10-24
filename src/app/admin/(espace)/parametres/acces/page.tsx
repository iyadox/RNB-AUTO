import type { Metadata } from "next";
import { formatDateTime } from "@/core/format";
import { AccountsList, NewAccountForm } from "@/components/admin/settings/access-controls";
import { Alert, Card, PageHeader, SectionTitle } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { listAccounts, recentAccessChanges } from "@/server/auth/accounts";
import { requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";

export const metadata: Metadata = { title: "Accès à l'espace" };

export default async function AccessPage() {
  const user = await requireAdmin();
  const db = await getDb();
  const [accounts, changes] = await Promise.all([listAccounts(db), recentAccessChanges(db, 8)]);
  return (
    <>
      <PageHeader
        back={{ href: "/admin/parametres", label: "Paramètres" }}
        title="Accès à l'espace"
        description="Les personnes qui peuvent voir les demandes et modifier les tarifs. Chacune a son propre email et son mot de passe."
      />
      <div className="mb-5">
        <Alert tone="info">Toute personne ayant accès peut tout faire : demandes, tarifs et réglages. Ne donnez l&apos;accès qu&apos;à des personnes de confiance.</Alert>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <SectionTitle icon="user">Personnes ayant accès</SectionTitle>
          <AccountsList
            accounts={accounts.map((a) => ({
              id: a.id,
              name: a.name,
              email: a.email,
              active: a.active,
              lastLogin: a.lastLoginAt ? formatDateTime(a.lastLoginAt) : null,
              me: a.id === user.id,
            }))}
          />
          {changes.length > 0 ? (
            <>
              <SectionTitle icon="history">Derniers changements</SectionTitle>
              <ul className="divide-y divide-asphalt-100 rounded-3xl border border-asphalt-200 bg-white">
                {changes.map((change) => (
                  <li key={change.id} className="px-5 py-3">
                    <p className="font-semibold">{change.label}</p>
                    <p className="text-sm text-asphalt-600">
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
            </>
          ) : null}
        </div>
        <div>
          <SectionTitle icon="plus">Donner l&apos;accès à quelqu&apos;un</SectionTitle>
          <Card>
            <NewAccountForm />
          </Card>
        </div>
      </div>
    </>
  );
}
