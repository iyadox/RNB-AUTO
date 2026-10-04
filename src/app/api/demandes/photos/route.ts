/**
 * Envoi d'une photo pour une demande.
 * - Client : jeton temporaire reçu à l'envoi de sa demande (en-tête Authorization).
 * - RNB AUTO : session de l'espace de gestion + identifiant de la demande.
 * La photo est nettoyée (métadonnées et position GPS retirées) puis gardée en stockage privé.
 */
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { addEvent, getIntervention } from "@/server/interventions/service";
import { interventionForPhotoToken, PHOTO_LIMITS, savePhoto } from "@/server/photos/service";
import { rateLimitByIp } from "@/server/security/rate-limit";

function error(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status });
}

/** Les envois avec la session de gestion doivent venir du site lui-même. */
function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin === request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp("photos", 40, 900);
  if (!limit.ok) return error(429, "Trop d'envois : réessayez dans quelques minutes.");
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > PHOTO_LIMITS.maxBytes + 64 * 1024) return error(413, "Photo trop lourde.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "Envoi illisible.");
  }
  const file = form.get("photo");
  if (!(file instanceof Blob) || file.size === 0) return error(400, "Aucune photo reçue.");
  if (file.size > PHOTO_LIMITS.maxBytes) return error(413, "Photo trop lourde.");

  const db = await getDb();
  const authorization = request.headers.get("authorization") ?? "";
  let interventionId: string;
  let uploadedBy: "client" | "admin";
  let actor: { userId: string | null; label: string };
  if (authorization.startsWith("Bearer ")) {
    const target = await interventionForPhotoToken(db, authorization.slice(7).trim());
    if (!target) return error(403, "Le délai pour ajouter des photos est dépassé. Envoyez-les sur WhatsApp.");
    interventionId = target.id;
    uploadedBy = "client";
    actor = { userId: null, label: "Client (site)" };
  } else {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin" || !sameOrigin(request)) return error(401, "Session expirée : reconnectez-vous.");
    const id = z.uuid().safeParse(form.get("intervention"));
    if (!id.success || !(await getIntervention(db, id.data))) return error(404, "Demande introuvable.");
    interventionId = id.data;
    uploadedBy = "admin";
    actor = { userId: user.id, label: user.name };
  }

  const result = await savePhoto(db, interventionId, new Uint8Array(await file.arrayBuffer()), uploadedBy);
  if (!result.ok) return error(result.status, result.message);
  await addEvent(db, interventionId, actor, { type: "photo", message: uploadedBy === "client" ? "Photo envoyée par le client." : "Photo ajoutée." });
  return NextResponse.json({ ok: true, id: result.id });
}
