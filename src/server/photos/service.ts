/**
 * Photos des demandes : envoyées par le client juste après sa demande (avec un jeton temporaire)
 * ou ajoutées par RNB AUTO. Stockées en base, jamais publiques, nettoyées de leurs métadonnées.
 */
import { createHash, randomBytes } from "node:crypto";
import { and, asc, count, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { interventionPhotos, interventions } from "@/server/db/schema";
import type { DbLike } from "@/server/settings/repository";
import { PHOTO_LIMITS } from "@/core/photos";
import { cleanJpeg } from "./jpeg";

export { PHOTO_LIMITS };

function hashToken(token: string): string {
  return createHash("sha256").update(`photo:${token}`).digest("hex");
}

/** Crée le jeton d'envoi de photos d'une demande (seule son empreinte est enregistrée). */
export async function issuePhotoToken(db: DbLike, interventionId: string): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await db
    .update(interventions)
    .set({ photoTokenHash: hashToken(token), photoTokenExpiresAt: new Date(Date.now() + PHOTO_LIMITS.tokenHours * 3_600_000) })
    .where(eq(interventions.id, interventionId));
  return token;
}

export async function interventionForPhotoToken(db: DbLike, token: string): Promise<{ id: string; reference: string } | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const [row] = await db
    .select({ id: interventions.id, reference: interventions.reference })
    .from(interventions)
    .where(and(eq(interventions.photoTokenHash, hashToken(token)), gt(interventions.photoTokenExpiresAt, new Date())))
    .limit(1);
  return row ?? null;
}

export type PhotoSaveResult = { ok: true; id: string } | { ok: false; status: number; message: string };

export async function savePhoto(db: DbLike, interventionId: string, raw: Uint8Array, uploadedBy: "client" | "admin"): Promise<PhotoSaveResult> {
  if (raw.length > PHOTO_LIMITS.maxBytes) return { ok: false, status: 413, message: "Photo trop lourde." };
  const clean = cleanJpeg(raw);
  if (!clean) return { ok: false, status: 415, message: "Format non reconnu : envoyez une photo JPEG." };
  if (clean.width * clean.height > PHOTO_LIMITS.maxPixels) return { ok: false, status: 413, message: "Photo trop grande." };
  const [existing] = await db.select({ n: count() }).from(interventionPhotos).where(eq(interventionPhotos.interventionId, interventionId));
  if ((existing?.n ?? 0) >= PHOTO_LIMITS.perIntervention) {
    return { ok: false, status: 409, message: `${PHOTO_LIMITS.perIntervention} photos maximum par demande.` };
  }
  const [row] = await db
    .insert(interventionPhotos)
    .values({ interventionId, mime: "image/jpeg", data: clean.data, sizeBytes: clean.data.length, width: clean.width, height: clean.height, uploadedBy })
    .returning({ id: interventionPhotos.id });
  if (!row) return { ok: false, status: 500, message: "Enregistrement impossible." };
  return { ok: true, id: row.id };
}

/** Liste des photos d'une demande, sans leur contenu. */
export async function listPhotos(db: DbLike, interventionId: string) {
  return db
    .select({
      id: interventionPhotos.id,
      width: interventionPhotos.width,
      height: interventionPhotos.height,
      sizeBytes: interventionPhotos.sizeBytes,
      uploadedBy: interventionPhotos.uploadedBy,
      createdAt: interventionPhotos.createdAt,
    })
    .from(interventionPhotos)
    .where(eq(interventionPhotos.interventionId, interventionId))
    .orderBy(asc(interventionPhotos.createdAt));
}

export async function getPhoto(db: DbLike, interventionId: string, photoId: string) {
  const [row] = await db
    .select()
    .from(interventionPhotos)
    .where(and(eq(interventionPhotos.id, photoId), eq(interventionPhotos.interventionId, interventionId)))
    .limit(1);
  return row ?? null;
}

export async function deletePhoto(db: DbLike, interventionId: string, photoId: string): Promise<boolean> {
  const removed = await db
    .delete(interventionPhotos)
    .where(and(eq(interventionPhotos.id, photoId), eq(interventionPhotos.interventionId, interventionId)))
    .returning({ id: interventionPhotos.id });
  return removed.length > 0;
}

/** Photos des interventions clôturées depuis plus de `retentionMonths` mois : supprimées. */
export async function purgeOldPhotos(db: DbLike): Promise<number> {
  const closed = db
    .select({ id: interventions.id })
    .from(interventions)
    .where(
      and(
        inArray(interventions.status, ["completed", "cancelled"]),
        lt(sql`coalesce(${interventions.completedAt}, ${interventions.cancelledAt}, ${interventions.updatedAt})`, sql`now() - make_interval(months => ${PHOTO_LIMITS.retentionMonths})`),
      ),
    );
  const removed = await db.delete(interventionPhotos).where(inArray(interventionPhotos.interventionId, closed)).returning({ id: interventionPhotos.id });
  await db
    .update(interventions)
    .set({ photoTokenHash: null, photoTokenExpiresAt: null })
    .where(lt(interventions.photoTokenExpiresAt, new Date()));
  return removed.length;
}
