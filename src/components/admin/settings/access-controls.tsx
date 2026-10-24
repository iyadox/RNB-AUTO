"use client";

/** Appareils connectés et personnes ayant accès à l'espace. Le serveur vérifie tout. */
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAccountAction,
  resetAccountPasswordAction,
  revokeDeviceAction,
  revokeOtherDevicesAction,
  setAccountActiveAction,
  type SimpleResult,
} from "@/app/admin/(espace)/parametres/actions";
import { AdminIcon, type AdminIconName } from "@/components/admin/admin-icons";
import { Modal, Toast } from "@/components/admin/inputs";
import { Alert, Badge, buttonClass } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import type { DeviceKind } from "@/core/auth/device";

function useResult() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; tone: "good" | "danger" } | null>(null);
  /** `inlineErrors` : l'erreur est déjà affichée dans la fenêtre ouverte, pas de bandeau en plus. */
  const run = (action: () => Promise<SimpleResult>, after?: () => void, inlineErrors = false) =>
    startTransition(async () => {
      const result = await action();
      if (result.ok || !inlineErrors) setToast({ text: result.message ?? "C'est fait.", tone: result.ok ? "good" : "danger" });
      if (result.ok) {
        after?.();
        router.refresh();
      }
    });
  const toastNode = <Toast message={toast?.text ?? null} tone={toast?.tone} onClose={() => setToast(null)} />;
  return { pending, run, toastNode };
}

export type DeviceView = { ref: string; device: string; kind: DeviceKind; since: string; current: boolean };

/** Pictogramme selon le type d'appareil : un ordinateur n'est pas un téléphone. */
const DEVICE_ICON: Record<DeviceKind, AdminIconName> = { phone: "smartphone", tablet: "tablet", computer: "laptop", unknown: "devices" };

const DEVICES_SHOWN = 4;

function DeviceItem({ device, pending, onRevoke }: { device: DeviceView; pending: boolean; onRevoke: () => void }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", device.current ? "bg-green-50 text-green-700" : "bg-asphalt-100 text-asphalt-600")}>
        <AdminIcon name={DEVICE_ICON[device.kind]} size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold leading-snug">{device.device}</span>
        <span className="block text-sm text-asphalt-500">{`Depuis le ${device.since}`}</span>
      </span>
      {!device.current ? (
        <button type="button" disabled={pending} onClick={onRevoke} className={cn(buttonClass("secondary", "custom"), "h-10 shrink-0 px-3 text-sm")} aria-label={`Déconnecter ${device.device}, connecté depuis le ${device.since}`}>
          Déconnecter
        </button>
      ) : (
        <Badge tone="good">Cet appareil</Badge>
      )}
    </li>
  );
}

export function DevicesList({ devices }: { devices: DeviceView[] }) {
  const { pending, run, toastNode } = useResult();
  const sorted = [...devices].sort((a, b) => Number(b.current) - Number(a.current));
  const others = devices.filter((d) => !d.current).length;
  const revoke = (device: DeviceView) => () => run(() => revokeDeviceAction({ ref: device.ref }));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
      <ul className="divide-y divide-asphalt-100 rounded-2xl border border-asphalt-200 bg-white">
        {sorted.slice(0, DEVICES_SHOWN).map((device) => (
          <DeviceItem key={device.ref} device={device} pending={pending} onRevoke={revoke(device)} />
        ))}
      </ul>
      {sorted.length > DEVICES_SHOWN ? (
        <details className="group">
          <summary className="flex h-11 cursor-pointer list-none items-center justify-center rounded-2xl text-sm font-extrabold text-asphalt-700 hover:bg-asphalt-100">
            <span className="group-open:hidden">Voir les {sorted.length - DEVICES_SHOWN} autres appareils</span>
            <span className="hidden group-open:inline">Masquer</span>
          </summary>
          <ul className="mt-2 divide-y divide-asphalt-100 rounded-2xl border border-asphalt-200 bg-white">
            {sorted.slice(DEVICES_SHOWN).map((device) => (
              <DeviceItem key={device.ref} device={device} pending={pending} onRevoke={revoke(device)} />
            ))}
          </ul>
        </details>
      ) : null}
      {others > 0 ? (
        <button type="button" disabled={pending} onClick={() => run(() => revokeOtherDevicesAction())} className={cn(buttonClass("dark", "custom"), "min-h-12 px-4 py-2 text-base")}>
          Déconnecter les {others} autre{others > 1 ? "s" : ""} appareil{others > 1 ? "s" : ""}
        </button>
      ) : (
        <p className="text-sm text-asphalt-500">Aucun autre appareil n&apos;est connecté à votre compte.</p>
      )}
      {toastNode}
    </div>
  );
}

export type AccountView = { id: string; name: string; email: string; active: boolean; lastLogin: string | null; me: boolean };

export function AccountsList({ accounts }: { accounts: AccountView[] }) {
  const { pending, run, toastNode } = useResult();
  const [confirm, setConfirm] = useState<AccountView | null>(null);
  const [resetFor, setResetFor] = useState<AccountView | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const closeReset = () => {
    setResetFor(null);
    setNewPassword("");
    setResetError(null);
  };
  const submitReset = () =>
    resetFor &&
    run(
      async () => {
        const result = await resetAccountPasswordAction({ userId: resetFor.id, password: newPassword });
        if (!result.ok) setResetError(result.message);
        return result;
      },
      closeReset,
      true,
    );
  return (
    <>
      <ul className="divide-y divide-asphalt-100 rounded-3xl border border-asphalt-200 bg-white">
        {accounts.map((account) => (
          <li key={account.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-extrabold uppercase", account.active ? "bg-asphalt-900 text-signal-400" : "bg-asphalt-100 text-asphalt-400")}>
              {account.name.trim().charAt(0) || "?"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 font-extrabold">
                {account.name}
                {account.me ? <Badge tone="info">Vous</Badge> : null}
                {!account.active ? <Badge tone="danger">Suspendu</Badge> : null}
              </span>
              <span className="block break-all text-sm text-asphalt-600">{account.email}</span>
              <span className="block text-xs text-asphalt-500">{account.lastLogin ? `Dernière connexion le ${account.lastLogin}` : "Jamais connecté"}</span>
            </span>
            {!account.me ? (
              <span className="flex w-full flex-wrap gap-2 pl-14 sm:w-auto sm:pl-0">
                <button type="button" disabled={pending} onClick={() => setResetFor(account)} className={buttonClass("secondary", "sm")}>
                  Nouveau mot de passe
                </button>
                {account.active ? (
                  <button type="button" disabled={pending} onClick={() => setConfirm(account)} className={cn(buttonClass("secondary", "sm"), "text-red-700")}>
                    Suspendre
                  </button>
                ) : (
                  <button type="button" disabled={pending} onClick={() => run(() => setAccountActiveAction({ userId: account.id, active: true }))} className={buttonClass("secondary", "sm")}>
                    Rétablir
                  </button>
                )}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <Modal
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title="Suspendre cet accès ?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonClass("secondary")} onClick={() => setConfirm(null)}>
              Ne rien changer
            </button>
            <button
              type="button"
              className={buttonClass("danger")}
              disabled={pending}
              onClick={() => confirm && run(() => setAccountActiveAction({ userId: confirm.id, active: false }), () => setConfirm(null))}
            >
              Suspendre l&apos;accès
            </button>
          </div>
        }
      >
        <p>
          <strong>{confirm?.name}</strong> ne pourra plus entrer dans l&apos;espace et sera déconnecté de tous ses appareils. Vous pourrez rétablir son accès à tout moment.
        </p>
      </Modal>
      <Modal
        open={resetFor !== null}
        onClose={closeReset}
        title="Nouveau mot de passe"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonClass("secondary")} onClick={closeReset}>
              Ne rien changer
            </button>
            <button type="button" className={buttonClass("primary")} disabled={pending || newPassword.length === 0} onClick={submitReset}>
              Enregistrer
            </button>
          </div>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (newPassword) submitReset();
          }}
          className="grid gap-3"
        >
          <p>
            Pour <strong>{resetFor?.name}</strong>, qui a oublié son mot de passe. Ses appareils seront déconnectés ; transmettez-lui le nouveau de vive voix.
          </p>
          <label className="grid gap-1.5">
            <span className="font-bold">Nouveau mot de passe</span>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="h-14 rounded-2xl border-2 border-asphalt-200 bg-white px-4 text-lg font-semibold outline-none focus:border-asphalt-900"
            />
            <span className="text-sm text-asphalt-500">Au moins 10 caractères, avec une lettre et un chiffre. La personne pourra le changer dans « Mon compte ».</span>
          </label>
          {resetError ? <Alert tone="danger">{resetError}</Alert> : null}
        </form>
      </Modal>
      {toastNode}
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  error,
  hint,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="font-bold">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        required
        className="h-14 rounded-2xl border-2 border-asphalt-200 bg-white px-4 text-lg font-semibold outline-none focus:border-asphalt-900"
      />
      {hint ? <span className="text-sm text-asphalt-500">{hint}</span> : null}
      {error ? <span className="text-sm font-bold text-red-700">{error}</span> : null}
    </label>
  );
}

export function NewAccountForm() {
  const [state, action, pending] = useActionState(createAccountAction, undefined);
  return (
    // Clé changée à chaque réponse : les champs reprennent les valeurs renvoyées (vides après un succès).
    <form action={action} key={JSON.stringify(state ?? null)} className="grid gap-4">
      <Field label="Nom" name="name" autoComplete="off" error={state?.errors?.name} defaultValue={state?.values?.name} />
      <Field label="Email de connexion" name="email" type="email" autoComplete="off" error={state?.errors?.email} defaultValue={state?.values?.email} />
      <Field
        label="Mot de passe de départ"
        name="password"
        type="password"
        autoComplete="new-password"
        error={state?.errors?.password}
        hint="Au moins 10 caractères, avec une lettre et un chiffre. La personne pourra le changer dans « Mon compte »."
      />
      <Field label="Mot de passe (encore)" name="confirm" type="password" autoComplete="new-password" error={state?.errors?.confirm} />
      {state?.message ? <Alert tone={state.ok ? "good" : "danger"}>{state.message}</Alert> : null}
      <button type="submit" disabled={pending} className={buttonClass("primary")}>
        Donner l&apos;accès
      </button>
    </form>
  );
}
