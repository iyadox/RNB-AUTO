import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/admin/auth-actions";
import { AuthForm } from "@/components/admin/auth-form";
import { AuthShell } from "@/components/admin/auth-shell";
import { getCurrentUser } from "@/server/auth/session";
import { hasAnyUser } from "@/server/auth/setup";

export const metadata: Metadata = { title: "Connexion" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (!(await hasAnyUser())) redirect("/admin/installation");
  if (await getCurrentUser()) redirect("/admin");
  return (
    <AuthShell title="Connexion" subtitle="Accès réservé à RNB AUTO.">
      <AuthForm
        action={loginAction}
        submitLabel="Se connecter"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "username", placeholder: "vous@exemple.fr" },
          { name: "password", label: "Mot de passe", type: "password", autoComplete: "current-password" },
        ]}
      />
      <p className="mt-6 text-sm text-asphalt-500">
        Mot de passe oublié ? Il peut être réinitialisé depuis l&apos;ordinateur qui a installé le site avec la commande{" "}
        <code className="rounded bg-asphalt-100 px-1.5 py-0.5">npm run admin:create</code>.
      </p>
    </AuthShell>
  );
}
