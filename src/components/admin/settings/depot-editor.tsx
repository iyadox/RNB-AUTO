"use client";

/**
 * Adresse du dépôt (point de départ et de retour de la dépanneuse). La position est montrée sur
 * une carte pour être vérifiée d'un coup d'œil, puis confirmée.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AddressValue } from "@/core/settings/registry";
import type { Place } from "@/core/quotes/types";
import { saveSettingsAction } from "@/app/admin/(espace)/parametres/actions";
import { Modal, Toast } from "@/components/admin/inputs";
import { Alert, Badge, buttonClass } from "@/components/admin/ui";
import { AddressInput } from "@/components/request/address-input";
import { Icon } from "@/components/ui/icon";

function MapPreview({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const bbox = [lng - 0.012, lat - 0.007, lng + 0.012, lat + 0.007].map((v) => v.toFixed(5)).join(",");
  return (
    <div className="overflow-hidden rounded-2xl border border-asphalt-200 bg-asphalt-100">
      <iframe
        title={`Carte : ${label}`}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)},${lng.toFixed(6)}`}
        className="h-64 w-full"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

function mapsLink(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function DepotEditor({ initial }: { initial: AddressValue }) {
  const router = useRouter();
  const [depot, setDepot] = useState(initial);
  const [candidate, setCandidate] = useState<Place | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const known = depot.lat !== null && depot.lng !== null;

  const save = (next: AddressValue, message: string) => {
    setError(null);
    startTransition(async () => {
      const result = await saveSettingsAction({ section: "depot", values: { "company.depot": next } });
      if (result.ok) {
        setDepot(next);
        setCandidate(null);
        setConfirmOpen(false);
        setToast(message);
        router.refresh();
      } else setError(result.errors["company.depot"] ?? result.message);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-5">
      <section className="rounded-3xl border border-asphalt-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-asphalt-500">Adresse actuelle du dépôt</p>
          {depot.confirmed ? <Badge tone="good">Position vérifiée</Badge> : known ? <Badge tone="warn">À vérifier</Badge> : <Badge tone="danger">Position inconnue</Badge>}
        </div>
        <p className="mt-1 text-xl font-extrabold">{depot.label}</p>
        {known ? (
          <div className="mt-4 grid gap-3">
            <MapPreview lat={depot.lat as number} lng={depot.lng as number} label={depot.label} />
            <a href={mapsLink(depot.lat as number, depot.lng as number)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-asphalt-600 underline underline-offset-4">
              <Icon name="external" size={14} />
              Ouvrir dans Google Maps
            </a>
            {!depot.confirmed ? (
              <>
                <Alert tone="warn" title="Le repère est-il bien sur votre dépôt ?">
                  Cette position a été trouvée automatiquement à partir de l&apos;adresse. Toutes les distances partent de ce point.
                </Alert>
                <button type="button" disabled={pending} className={buttonClass("primary", "lg")} onClick={() => save({ ...depot, confirmed: true }, "Position du dépôt confirmée.")}>
                  <Icon name="check" size={20} />
                  Oui, la position est correcte
                </button>
              </>
            ) : null}
          </div>
        ) : (
          <div className="mt-3">
            <Alert tone="warn">
              La position sera calculée automatiquement à la première estimation. Vous pouvez aussi choisir l&apos;adresse ci-dessous pour la situer tout de suite.
            </Alert>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-asphalt-200 bg-white p-5">
        <p className="text-lg font-extrabold">Changer l&apos;adresse du dépôt</p>
        <p className="mb-4 text-sm text-asphalt-500">Tapez l&apos;adresse puis choisissez-la dans la liste.</p>
        <AddressInput value={candidate} onChange={setCandidate} placeholder="Numéro, rue, ville…" tone="light" label="Nouvelle adresse du dépôt" />
        {candidate && candidate.lat !== null && candidate.lng !== null ? (
          <div className="mt-4 grid gap-3">
            <MapPreview lat={candidate.lat} lng={candidate.lng} label={candidate.label} />
            <button type="button" className={buttonClass("dark", "lg")} onClick={() => setConfirmOpen(true)}>
              Utiliser cette adresse
            </button>
          </div>
        ) : candidate ? (
          <p className="mt-3 text-sm font-bold text-asphalt-600">Choisissez une adresse proposée dans la liste pour la situer précisément.</p>
        ) : null}
      </section>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Changer l'adresse du dépôt ?"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonClass("secondary")} onClick={() => setConfirmOpen(false)}>
              Annuler
            </button>
            <button
              type="button"
              disabled={pending || !candidate}
              className={buttonClass("primary")}
              onClick={() =>
                candidate &&
                save(
                  { label: candidate.label, lat: candidate.lat, lng: candidate.lng, postcode: candidate.postcode, city: candidate.city, confirmed: true },
                  "Adresse du dépôt enregistrée.",
                )
              }
            >
              Confirmer
            </button>
          </div>
        }
      >
        <p>
          La dépanneuse partira désormais de <strong>{candidate?.label}</strong>. Les prochaines estimations utiliseront cette adresse ; les demandes déjà
          enregistrées ne changent pas.
        </p>
      </Modal>
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
