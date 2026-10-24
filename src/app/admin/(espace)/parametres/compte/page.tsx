import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { formatDate, formatDateTime } from "@/core/format";
import { AdminIcon } from "@/components/admin/admin-icons";
import { ProfileForm, PasswordForm } from "@/components/admin/settings/account-forms";
import { DevicesList } from "@/components/admin/settings/access-controls";
import { Card, PageHeader, SectionTitle } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";
import { listDevices } from "@/server/auth/accounts";
import { getCurrentUser, requireAdmin } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { users } from "@/server/db/schema";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireAdmin();
  const session = await getCurrentUser();
  const db = await getDb();
  const [devices, [row]] = await Promise.all([
    listDevices(db, user.id, session?.sessionId ?? ""),
    db.select({ lastLoginAt: users.lastLoginAt, passwordChangedAt: users.passwordChangedAt }).from(users).where(eq(users.id, user.id)).limit(1),
  ]);
  return (
    <>
      <PageHeader back={{ href: "/admin/parametres", label: "Paramètres" }} title="Mon compte" description="Vos informations de connexion et la sécurité de votre accès." />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-asphalt-200 bg-white p-4">
          <p className="text-sm font-bold text-asphalt-500">Dernière connexion</p>
          <p className="mt-1 font-extrabold">{row?.lastLoginAt ? formatDateTime(row.lastLoginAt) : "—"}</p>
        </div>
        <div className="rounded-3xl border border-asphalt-200 bg-white p-4">
          <p className="text-sm font-bold text-asphalt-500">Mot de passe changé le</p>
          <p className="mt-1 font-extrabold">{row?.passwordChangedAt ? formatDate(row.passwordChangedAt) : "—"}</p>
        </div>
        <div className="rounded-3xl border border-asphalt-200 bg-white p-4">
          <p className="text-sm font-bold text-asphalt-500">Appareils connectés</p>
          <p className="mt-1 font-extrabold tabular">{devices.length}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SectionTitle icon="user">Mes informations</SectionTitle>
          <Card>
            <ProfileForm name={user.name} email={user.email} />
          </Card>
        </div>
        <div>
          <SectionTitle icon="lock">Mot de passe</SectionTitle>
          <Card>
            <PasswordForm />
          </Card>
        </div>
      </div>

      <SectionTitle icon="shield" description="Un téléphone perdu ou un ordinateur partagé ? Déconnectez-le ici.">
        Appareils connectés
      </SectionTitle>
      <DevicesList devices={devices.map((d) => ({ ref: d.ref, device: d.device, since: formatDateTime(d.createdAt), current: d.current }))} />

      <Link href="/admin/parametres/acces" className="mt-6 flex items-center gap-4 rounded-3xl border border-asphalt-200 bg-white p-5 hover:border-asphalt-400">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-asphalt-900 text-signal-500">
          <AdminIcon name="users" size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-extrabold">Accès à l&apos;espace</span>
          <span className="block text-sm text-asphalt-500">Donner ou retirer l&apos;accès à une autre personne.</span>
        </span>
        <Icon name="chevronRight" size={20} className="shrink-0 text-asphalt-400" />
      </Link>

      <p className="mt-6 text-sm text-asphalt-500">
        Mot de passe oublié ? Une autre personne ayant accès vous en donne un nouveau dans « Accès à l&apos;espace ». Si vous êtes seul à avoir accès, la personne qui a installé le site
        peut le réinitialiser (notice d&apos;installation, « Mot de passe oublié »).
      </p>
    </>
  );
}
