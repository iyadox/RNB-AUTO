"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReferenceTripAction } from "@/app/admin/(espace)/tester/actions";
import { Modal } from "@/components/admin/inputs";
import { buttonClass } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

export function DeleteTripButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-full p-2 text-asphalt-400 hover:bg-asphalt-100 hover:text-red-700" aria-label={`Retirer le trajet type « ${name} »`}>
        <Icon name="trash" size={18} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Retirer ce trajet type ?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonClass("secondary")} onClick={() => setOpen(false)}>
              Garder
            </button>
            <button
              type="button"
              disabled={pending}
              className={buttonClass("danger")}
              onClick={() =>
                startTransition(async () => {
                  await deleteReferenceTripAction(id);
                  setOpen(false);
                  router.refresh();
                })
              }
            >
              Retirer
            </button>
          </div>
        }
      >
        <p>
          « {name} » ne sera plus utilisé pour montrer l&apos;effet de vos changements de tarifs. Vos tarifs ne changent pas.
        </p>
      </Modal>
    </>
  );
}
