"use client";

/** Mon compte : nom, email et mot de passe. Fonctionne aussi sans JavaScript (formulaires classiques). */
import { useActionState } from "react";
import { changePasswordAction, updateProfileAction, type AccountFormState } from "@/app/admin/(espace)/parametres/actions";
import { Alert, buttonClass } from "@/components/admin/ui";

function Field({ label, name, type = "text", defaultValue, autoComplete, error }: { label: string; name: string; type?: string; defaultValue?: string; autoComplete?: string; error?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-bold">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required
        className="h-14 rounded-2xl border-2 border-asphalt-200 bg-white px-4 text-lg font-semibold outline-none focus:border-asphalt-900"
      />
      {error ? <span className="text-sm font-bold text-red-700">{error}</span> : null}
    </label>
  );
}

function Feedback({ state }: { state: AccountFormState }) {
  if (!state?.message) return null;
  return <Alert tone={state.ok ? "good" : "danger"}>{state.message}</Alert>;
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Nom affiché" name="name" defaultValue={name} autoComplete="name" error={state?.errors?.name} />
      <Field label="Email de connexion" name="email" type="email" defaultValue={email} autoComplete="email" error={state?.errors?.email} />
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={buttonClass("dark")}>
        Enregistrer
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="grid gap-4">
      <Field label="Mot de passe actuel" name="current" type="password" autoComplete="current-password" error={state?.errors?.current} />
      <Field label="Nouveau mot de passe" name="password" type="password" autoComplete="new-password" error={state?.errors?.password} />
      <Field label="Nouveau mot de passe (encore)" name="confirm" type="password" autoComplete="new-password" error={state?.errors?.confirm} />
      <p className="text-sm text-asphalt-500">Au moins 10 caractères, avec au moins une lettre et un chiffre. Une phrase facile à retenir fonctionne très bien.</p>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={buttonClass("dark")}>
        Changer le mot de passe
      </button>
    </form>
  );
}
