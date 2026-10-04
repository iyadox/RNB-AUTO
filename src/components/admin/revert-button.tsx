"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { revertVersionAction } from "@/app/admin/(espace)/tarifs/actions";
import { Modal } from "@/components/admin/inputs";
import { buttonClass } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

export function RevertButton({ versionId, versionNumber }: { versionId: string; versionNumber: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setOpen(true)}>
        <Icon name="history" size={16} />
        Revenir à cette version
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Revenir aux tarifs de la version ${versionNumber} ?`}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className={buttonClass("secondary")} onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              className={buttonClass("dark")}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await revertVersionAction(versionId);
                  if (result.ok) {
                    setOpen(false);
                    router.refresh();
                  } else setError(result.message);
                })
              }
            >
              Confirmer
            </button>
          </div>
        }
      >
        <p>Une nouvelle version, identique à la version {versionNumber}, va être créée. Rien n&apos;est effacé de l&apos;historique.</p>
        {error ? <p className="mt-3 font-bold text-red-700">{error}</p> : null}
      </Modal>
    </>
  );
}
