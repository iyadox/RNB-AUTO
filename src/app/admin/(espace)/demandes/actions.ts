"use server";

/** Actions sur une demande. Chacune vérifie la session et valide ce qu'elle reçoit. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { STATUSES } from "@/core/interventions/status";
import { AuthError, requireAdminAction } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import {
  addAdjustment,
  addEvent,
  attachQuoteRevision,
  changeStatus,
  confirmPrice,
  getIntervention,
  InterventionError,
  removeAdjustment,
  setInternalNotes,
} from "@/server/interventions/service";
import { deletePhoto } from "@/server/photos/service";
import { getQuote } from "@/server/quotes/service";

type Result = { ok: true } | { ok: false; message: string };

function failure(error: unknown): { ok: false; message: string } {
  if (error instanceof AuthError || error instanceof InterventionError) return { ok: false, message: error.message };
  console.error("[demandes]", error);
  return { ok: false, message: "Une erreur est survenue. Réessayez." };
}

function refresh(id: string) {
  revalidatePath(`/admin/demandes/${id}`);
  revalidatePath("/admin/demandes");
  revalidatePath("/admin");
}

const statusSchema = z.object({
  id: z.uuid(),
  to: z.enum(STATUSES),
  force: z.boolean().optional(),
  cancelReason: z.string().trim().max(300).optional(),
});

export async function changeStatusAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdminAction();
    const parsed = statusSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Demande invalide." };
    const db = await getDb();
    await db.transaction((tx) =>
      changeStatus(tx, parsed.data.id, parsed.data.to, { userId: user.id, label: user.name }, {
        force: parsed.data.force,
        cancelReason: parsed.data.cancelReason || null,
      }),
    );
    refresh(parsed.data.id);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function confirmPriceAction(id: string): Promise<Result> {
  try {
    const user = await requireAdminAction();
    if (!z.uuid().safeParse(id).success) return { ok: false, message: "Demande invalide." };
    const db = await getDb();
    await confirmPrice(db, id, { userId: user.id, label: user.name });
    refresh(id);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

const adjustmentSchema = z.object({
  id: z.uuid(),
  effect: z.enum(["supplement", "discount"]),
  mode: z.enum(["amount", "percent"]),
  value: z.number().int().min(1, { error: "Indiquez une valeur." }).max(500_000),
  reason: z.string().trim().min(2, { error: "Indiquez un motif." }).max(200),
});

export async function addAdjustmentAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdminAction();
    const parsed = adjustmentSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Ajustement invalide." };
    const { id, ...adjustment } = parsed.data;
    if (adjustment.mode === "percent" && adjustment.value > 10_000) return { ok: false, message: "Un pourcentage ne peut pas dépasser 100 %." };
    const db = await getDb();
    const intervention = await getIntervention(db, id);
    if (!intervention) return { ok: false, message: "Demande introuvable." };
    await db.transaction((tx) => addAdjustment(tx, id, adjustment, { userId: user.id, label: user.name }));
    refresh(id);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function removeAdjustmentAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdminAction();
    const parsed = z.object({ id: z.uuid(), adjustmentId: z.uuid() }).safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Ajustement invalide." };
    const db = await getDb();
    await db.transaction((tx) => removeAdjustment(tx, parsed.data.id, parsed.data.adjustmentId, { userId: user.id, label: user.name }));
    refresh(parsed.data.id);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function saveNotesAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdminAction();
    const parsed = z.object({ id: z.uuid(), notes: z.string().max(4000) }).safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Notes trop longues." };
    const db = await getDb();
    await setInternalNotes(db, parsed.data.id, parsed.data.notes.trim(), { userId: user.id, label: user.name });
    refresh(parsed.data.id);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** Remplace le calcul de la demande par un nouveau calcul (nouvelle révision, l'ancienne est gardée). */
export async function applyRecalculationAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdminAction();
    const parsed = z.object({ id: z.uuid(), quoteId: z.uuid() }).safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Calcul invalide." };
    const db = await getDb();
    const [intervention, quote] = await Promise.all([getIntervention(db, parsed.data.id), getQuote(db, parsed.data.quoteId)]);
    if (!intervention) return { ok: false, message: "Demande introuvable." };
    if (!quote || quote.interventionId || quote.source !== "recalc") return { ok: false, message: "Ce calcul n'est plus disponible : recalculez." };
    await db.transaction((tx) =>
      attachQuoteRevision(tx, intervention.id, quote.id, { userId: user.id, label: user.name }, "Nouveau calcul du prix"),
    );
    refresh(intervention.id);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function deletePhotoAction(raw: unknown): Promise<Result> {
  try {
    const user = await requireAdminAction();
    const parsed = z.object({ id: z.uuid(), photoId: z.uuid() }).safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Photo invalide." };
    const db = await getDb();
    if (await deletePhoto(db, parsed.data.id, parsed.data.photoId)) {
      await addEvent(db, parsed.data.id, { userId: user.id, label: user.name }, { type: "photo", message: "Photo supprimée." });
    }
    refresh(parsed.data.id);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
