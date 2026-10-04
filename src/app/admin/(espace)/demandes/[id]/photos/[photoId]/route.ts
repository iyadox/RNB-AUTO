/** Affiche une photo d'une demande. Réservé à l'espace de gestion, jamais mis en cache public. */
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { getPhoto } from "@/server/photos/service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; photoId: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return new Response("Non autorisé", { status: 401 });
  const { id, photoId } = await params;
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(photoId).success) return new Response("Introuvable", { status: 404 });
  const photo = await getPhoto(await getDb(), id, photoId);
  if (!photo) return new Response("Introuvable", { status: 404 });
  return new Response(Buffer.from(photo.data), {
    headers: {
      "Content-Type": photo.mime,
      "Content-Length": String(photo.sizeBytes),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="photo-${photoId.slice(0, 8)}.jpg"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
