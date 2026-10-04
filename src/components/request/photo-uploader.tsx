"use client";

/**
 * Ajout de photos (facultatif). Chaque photo est réduite et réencodée sur le téléphone avant
 * l'envoi : plus légère, et sans ses métadonnées (dont la position GPS). Un échec n'empêche
 * jamais rien : la demande est déjà enregistrée.
 */
import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

type Item = { key: string; preview: string | null; status: "working" | "done" | "error"; message?: string; blob?: Blob };

const MAX_SIDE = 1600;
const QUALITY = 0.82;

async function loadImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Repli ci-dessous (anciens navigateurs).
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Réduit la photo (1600 px au plus) et la réencode en JPEG. */
async function compress(file: File): Promise<Blob> {
  const source = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(source, 0, 0, width, height);
  if ("close" in source && typeof source.close === "function") source.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encodage"))), "image/jpeg", QUALITY));
}

export function PhotoUploader({
  token,
  interventionId,
  max,
  tone = "dark",
  frame,
  onUploaded,
}: {
  token?: string;
  interventionId?: string;
  max: number;
  tone?: "dark" | "light";
  /** `viewfinder` : le bouton d'ajout est posé dans les coins de cadrage d'un viseur (/demande). */
  frame?: "viewfinder";
  onUploaded?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const dark = tone === "dark";
  const sent = items.filter((item) => item.status !== "error").length;
  const remaining = Math.max(0, max - sent);

  useEffect(
    () => () => {
      for (const item of items) if (item.preview) URL.revokeObjectURL(item.preview);
    },
    // Nettoyage des aperçus au démontage uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const patch = (key: string, value: Partial<Item>) => setItems((list) => list.map((item) => (item.key === key ? { ...item, ...value } : item)));

  const upload = async (key: string, blob: Blob) => {
    patch(key, { status: "working", message: undefined });
    try {
      const body = new FormData();
      body.append("photo", blob, "photo.jpg");
      if (interventionId) body.append("intervention", interventionId);
      const response = await fetch("/api/demandes/photos", {
        method: "POST",
        body,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal: AbortSignal.timeout(60_000),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) throw new Error(data.message ?? "Envoi impossible.");
      patch(key, { status: "done" });
      onUploaded?.();
    } catch (error) {
      patch(key, { status: "error", message: error instanceof Error && error.name !== "TimeoutError" ? error.message : "Connexion trop lente." });
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const selected = [...files].slice(0, remaining);
    for (const file of selected) {
      const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
      setItems((list) => [...list, { key, preview: null, status: "working" }]);
      try {
        const blob = await compress(file);
        patch(key, { preview: URL.createObjectURL(blob), blob });
        await upload(key, blob);
      } catch {
        patch(key, { status: "error", message: "Format non pris en charge." });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const addButton = (
    <button
      type="button"
      disabled={remaining === 0}
      onClick={() => inputRef.current?.click()}
      className={
        frame === "viewfinder"
          ? "flex h-20 w-full items-center justify-center gap-3 rounded-[6px] text-lg font-extrabold text-chalk transition-colors hover:text-signal-400 disabled:opacity-50"
          : cn(
              "flex h-16 items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-lg font-extrabold transition-colors disabled:opacity-50",
              dark ? "border-white/25 text-chalk hover:border-signal-500 hover:text-signal-400" : "border-asphalt-300 text-asphalt-800 hover:border-asphalt-900",
            )
      }
    >
      <Icon name="camera" size={22} />
      {items.length === 0 ? "Ajouter des photos" : remaining > 0 ? "Ajouter d'autres photos" : "Nombre maximum atteint"}
    </button>
  );

  return (
    <div className="grid gap-3">
      <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => void onFiles(event.target.files)} />
      {frame === "viewfinder" ? (
        // Coins de cadrage d'un viseur d'appareil photo (décor).
        <div className="relative p-3">
          <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-signal-500" />
          <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-signal-500" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-signal-500" />
          <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-signal-500" />
          {addButton}
        </div>
      ) : (
        addButton
      )}
      {items.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-live="polite">
          {items.map((item) => (
            <li key={item.key} className={cn("relative aspect-square overflow-hidden rounded-2xl", dark ? "bg-asphalt-850" : "bg-asphalt-100")}>
              {item.preview ? (
                // Aperçu local (blob) : pas d'optimisation d'image nécessaire.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.preview} alt="" className="h-full w-full object-cover" />
              ) : null}
              <span
                className={cn(
                  "absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-xl px-1.5 py-1 text-xs font-extrabold",
                  item.status === "done" && "bg-green-600 text-white",
                  item.status === "working" && "bg-asphalt-950/80 text-chalk",
                  item.status === "error" && "bg-red-600 text-white",
                )}
              >
                {item.status === "done" ? (
                  <>
                    <Icon name="check" size={12} strokeWidth={3} /> Envoyée
                  </>
                ) : item.status === "working" ? (
                  "Envoi…"
                ) : item.blob ? (
                  <button type="button" onClick={() => item.blob && void upload(item.key, item.blob)} className="underline">
                    Réessayer
                  </button>
                ) : (
                  "Échec"
                )}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {items.some((item) => item.status === "error" && item.message) ? (
        <p className={cn("text-sm", dark ? "text-asphalt-300" : "text-asphalt-600")}>{items.find((item) => item.status === "error")?.message}</p>
      ) : null}
    </div>
  );
}
