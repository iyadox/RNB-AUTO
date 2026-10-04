"use client";

/** Boutons « Tester » de la page Services externes. */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshFuelAction } from "@/app/admin/(espace)/tarifs/actions";
import { testEmailAction, testRoutingAction } from "@/app/admin/(espace)/parametres/actions";
import { Alert, buttonClass } from "@/components/admin/ui";
import { Icon, type IconName } from "@/components/ui/icon";

const ACTIONS = {
  routing: { label: "Tester le calcul des trajets", icon: "route", run: testRoutingAction },
  fuel: { label: "Actualiser le prix du gazole", icon: "refresh", run: refreshFuelAction },
  email: { label: "Envoyer un email d'essai", icon: "mail", run: testEmailAction },
} satisfies Record<string, { label: string; icon: IconName; run: () => Promise<{ ok: boolean; message: string }> }>;

export function ServiceTestButton({ kind }: { kind: keyof typeof ACTIONS }) {
  const router = useRouter();
  const action = ACTIONS[kind];
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="grid gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const response = await action.run();
            setResult(response);
            router.refresh();
          })
        }
        className={buttonClass("secondary")}
      >
        {pending ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-asphalt-900 border-t-transparent" aria-hidden="true" />
        ) : (
          <Icon name={action.icon} size={18} />
        )}
        {action.label}
      </button>
      {result ? <Alert tone={result.ok ? "good" : "warn"}>{result.message}</Alert> : null}
    </div>
  );
}
