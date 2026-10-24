"use client";

/** Bouton « étape suivante » d'une demande, directement depuis l'accueil (un seul geste). */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeStatusAction } from "@/app/admin/(espace)/demandes/actions";
import { primaryNextStatus, STATUS_META, type InterventionStatus, type ServiceKind } from "@/core/interventions/status";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

export function QuickAdvance({ id, status, serviceKind, name }: { id: string; status: InterventionStatus; serviceKind: ServiceKind; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = primaryNextStatus(status, serviceKind);
  if (!next) return null;
  const meta = STATUS_META[next];
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        aria-label={`${meta.action} : ${name}`}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await changeStatusAction({ id, to: next });
            if (result.ok) router.refresh();
            else setError(result.message);
          })
        }
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-extrabold transition-colors disabled:opacity-60",
          next === "accepted" ? "bg-signal-500 text-asphalt-950 hover:bg-signal-400" : "bg-asphalt-900 text-chalk hover:bg-asphalt-800",
        )}
      >
        {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : <Icon name={meta.icon} size={18} />}
        {meta.action}
      </button>
      <p className="line-clamp-2 min-w-0 flex-1 text-xs font-semibold leading-snug text-asphalt-500" role={error ? "alert" : undefined}>
        {error ?? `Passe à « ${meta.label} »`}
      </p>
    </div>
  );
}
