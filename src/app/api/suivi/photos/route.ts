/**
 * Ajout d'une photo depuis la page de suivi (`/suivi/<référence>?t=<jeton>`).
 * Autorisation : la référence (champ `reference`) et le jeton de suivi (en-tête Authorization),
 * vérifiés à CHAQUE envoi. Possible tant que la demande n'est pas clôturée. La photo est
 * nettoyée (métadonnées et position GPS retirées) puis gardée en stockage privé.
 */
import { NextResponse, type NextRequest } from "next/server";
import { isTerminal, type InterventionStatus } from "@/core/interventions/status";
import { getDb } from "@/server/db/client";
import { addEvent } from "@/server/interventions/service";
import { PHOTO_LIMITS, savePhoto } from "@/server/photos/service";
import { rateLimitByIp } from "@/server/security/rate-limit";
import { findTrackedIntervention } from "@/server/tracking/token";

function error(status: number, message: string) {
  return NextResponse.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const limit = await rateLimitByIp("photos", 40, 900);
  if (!limit.ok) return error(429, "Trop d'envois : réessayez dans quelques minutes.");
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > PHOTO_LIMITS.maxBytes + 64 * 1024) return error(413, "Photo trop lourde.");

  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return error(401, "Lien de suivi manquant.");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error(400, "Envoi illisible.");
  }
  const reference = form.get("reference");
  const file = form.get("photo");
  if (typeof reference !== "string") return error(400, "Référence manquante.");
  if (!(file instanceof Blob) || file.size === 0) return error(400, "Aucune photo reçue.");
  if (file.size > PHOTO_LIMITS.maxBytes) return error(413, "Photo trop lourde.");

  const db = await getDb();
  const found = await findTrackedIntervention(db, reference, authorization.slice(7).trim());
  if (!found.ok) return error(403, found.reason === "expired" ? "Ce lien de suivi a expiré." : "Lien de suivi non valable.");
  if (isTerminal(found.intervention.status as InterventionStatus)) return error(409, "Cette demande est clôturée : envoyez vos photos sur WhatsApp.");

  const result = await savePhoto(db, found.intervention.id, new Uint8Array(await file.arrayBuffer()), "client");
  if (!result.ok) return error(result.status, result.message);
  await addEvent(db, found.intervention.id, { userId: null, label: "Client (suivi)" }, { type: "photo", message: "Photo envoyée par le client (page de suivi)." });
  return NextResponse.json({ ok: true, id: result.id }, { headers: { "Cache-Control": "no-store" } });
}
