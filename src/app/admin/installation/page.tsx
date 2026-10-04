import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setupAction } from "@/app/admin/auth-actions";
import { AuthForm } from "@/components/admin/auth-form";
import { AuthShell } from "@/components/admin/auth-shell";
import { hasAnyUser, setupRequiresToken } from "@/server/auth/setup";

export const metadata: Metadata = { title: "Installation" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await hasAnyUser()) redirect("/admin/connexion");
  const needsToken = setupRequiresToken();
  return (
    <AuthShell title="Bienvenue" subtitle="Créez le compte administrateur de RNB AUTO. Cette page disparaît ensuite.">
      <AuthForm
        action={setupAction}
        submitLabel="Créer mon compte"
        fields={[
          ...(needsToken
            ? [
                {
                  name: "token",
                  label: "Code d'installation",
                  type: "password",
                  autoComplete: "off",
                  hint: "La valeur de la variable SETUP_TOKEN définie chez votre hébergeur.",
                },
              ]
            : []),
          { name: "name", label: "Votre nom", type: "text", autoComplete: "name", placeholder: "Administrateur" },
          { name: "email", label: "Email de connexion", type: "email", autoComplete: "username", placeholder: "vous@exemple.fr" },
          { name: "password", label: "Mot de passe", type: "password", autoComplete: "new-password", hint: "10 caractères minimum, avec au moins une lettre et un chiffre." },
          { name: "confirm", label: "Confirmez le mot de passe", type: "password", autoComplete: "new-password" },
        ]}
      />
    </AuthShell>
  );
}
