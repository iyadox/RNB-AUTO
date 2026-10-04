"use client";

/** Photos d'une demande dans l'espace de gestion : affichage, ajout et suppression. */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PHOTO_LIMITS } from "@/core/photos";
import { formatDateTime } from "@/core/format";
import { deletePhotoAction } from "@/app/admin/(espace)/demandes/actions";
import { Modal } from "@/components/admin/inputs";
import { buttonClass } from "@/components/admin/ui";
import { PhotoUploader } from "@/components/request/photo-uploader";
import { Icon } from "@/components/ui/icon";

export type PhotoRow = { id: string; uploadedBy: string; createdAt: string };

export function RequestPhotos({ interventionId, photos }: { interventionId: string; photos: PhotoRow[] }) {
  const router = useRouter();
  const [toDelete, setToDelete] = useState<PhotoRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const src = (photo: PhotoRow) => `/admin/demandes/${interventionId}/photos/${photo.id}`;

  return (
    <div className="grid gap-4">
      {photos.length === 0 ? <p className="text-asphalt-500">Aucune photo pour cette demande.</p> : null}
      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <li key={photo.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-asphalt-100">
              <a href={src(photo)} target="_blank" rel="noopener noreferrer" title={`${photo.uploadedBy === "client" ? "Envoyée par le client" : "Ajoutée"} le ${formatDateTime(photo.createdAt)}`}>
                {/* Photo privée servie par l'espace de gestion (pas d'optimisation publique). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src(photo)} alt={`Photo du ${formatDateTime(photo.createdAt)}`} loading="lazy" className="h-full w-full object-cover" />
              </a>
              <button
                type="button"
                onClick={() => setToDelete(photo)}
                className="absolute right-1.5 top-1.5 rounded-full bg-asphalt-950/70 p-1.5 text-white hover:bg-red-600"
                aria-label="Supprimer cette photo"
              >
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {adding ? (
        <PhotoUploader interventionId={interventionId} max={Math.max(0, PHOTO_LIMITS.perIntervention - photos.length)} tone="light" onUploaded={() => router.refresh()} />
      ) : photos.length < PHOTO_LIMITS.perIntervention ? (
        <button type="button" onClick={() => setAdding(true)} className={buttonClass("secondary")}>
          <Icon name="camera" size={18} />
          Ajouter des photos
        </button>
      ) : null}

      <Modal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        title="Supprimer cette photo ?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonClass("secondary")} onClick={() => setToDelete(null)}>
              Garder
            </button>
            <button
              type="button"
              disabled={pending}
              className={buttonClass("danger")}
              onClick={() =>
                toDelete &&
                startTransition(async () => {
                  await deletePhotoAction({ id: interventionId, photoId: toDelete.id });
                  setToDelete(null);
                  router.refresh();
                })
              }
            >
              Supprimer
            </button>
          </div>
        }
      >
        <p>La photo sera définitivement supprimée.</p>
      </Modal>
    </div>
  );
}
