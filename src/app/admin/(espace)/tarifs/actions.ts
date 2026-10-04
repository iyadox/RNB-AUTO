"use server";

/** Actions de « Mes tarifs ». Chacune vérifie la session avant toute chose. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pricingDraftSchema, type PricingDraft } from "@/core/settings/editor";
import { AuthError, requireAdminAction } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { refreshFuelPrice, type RefreshResult } from "@/server/fuel/service";
import { previewDraft, revertToVersion, saveDraft, type PreviewResult, type SaveResult } from "@/server/pricing-admin/service";
import { getLatestVersion } from "@/server/settings/versions";

type Failure = { ok: false; message: string; errors?: Record<string, string> };

function failure(error: unknown): Failure {
  if (error instanceof AuthError) return { ok: false, message: error.message };
  console.error("[tarifs]", error);
  return { ok: false, message: "Une erreur est survenue. Réessayez." };
}

export async function previewPricingAction(raw: unknown): Promise<({ ok: true } & PreviewResult) | Failure> {
  try {
    await requireAdminAction();
    const parsed = pricingDraftSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Données invalides : rechargez la page." };
    const db = await getDb();
    return { ok: true, ...(await previewDraft(db, parsed.data as unknown as PricingDraft)) };
  } catch (error) {
    return failure(error);
  }
}

const saveSchema = z.object({
  draft: pricingDraftSchema,
  reason: z.string().trim().max(300),
  baseVersionNumber: z.number().int().min(0),
});

export async function savePricingAction(raw: unknown): Promise<SaveResult | Failure> {
  try {
    const user = await requireAdminAction();
    const parsed = saveSchema.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "Données invalides : rechargez la page." };
    const db = await getDb();
    const result = await saveDraft(db, parsed.data.draft as unknown as PricingDraft, {
      actor: { userId: user.id, label: user.name },
      reason: parsed.data.reason || null,
      baseVersionNumber: parsed.data.baseVersionNumber,
    });
    if (result.ok) {
      revalidatePath("/", "layout");
    }
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function revertVersionAction(versionId: string): Promise<{ ok: true; versionNumber: number } | Failure> {
  try {
    const user = await requireAdminAction();
    if (!z.uuid().safeParse(versionId).success) return { ok: false, message: "Version invalide." };
    const db = await getDb();
    const result = await revertToVersion(db, versionId, { userId: user.id, label: user.name });
    if (result.ok) revalidatePath("/", "layout");
    return result;
  } catch (error) {
    return failure(error);
  }
}

export async function refreshFuelAction(): Promise<RefreshResult> {
  try {
    await requireAdminAction();
    const db = await getDb();
    const version = await getLatestVersion(db);
    if (!version) return { ok: false, message: "Aucune version des tarifs." };
    const result = await refreshFuelPrice(db, version.snapshot);
    revalidatePath("/admin/tarifs");
    return result;
  } catch (error) {
    return { ok: false, message: error instanceof AuthError ? error.message : "Actualisation impossible pour le moment." };
  }
}
