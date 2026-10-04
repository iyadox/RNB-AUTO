import type { Metadata } from "next";
import { ProfileForm, PasswordForm } from "@/components/admin/settings/account-forms";
import { Card, PageHeader, SectionTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireAdmin();
  return (
    <>
      <PageHeader back={{ href: "/admin/parametres", label: "Paramètres" }} title="Mon compte" description="Vos informations de connexion à l'espace de gestion." />
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
      <p className="mt-6 text-sm text-asphalt-500">
        Mot de passe oublié ? Depuis l&apos;ordinateur qui a installé le site, la commande <code className="rounded bg-asphalt-100 px-1.5 py-0.5">npm run admin:create</code>{" "}
        permet de le réinitialiser.
      </p>
    </>
  );
}
