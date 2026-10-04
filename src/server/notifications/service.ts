/**
 * Notifications (file d'envoi). Email via Resend si RESEND_API_KEY et EMAIL_FROM sont configurées.
 * Sans service configuré, la notification est enregistrée « non envoyée » : la demande reste
 * visible dans l'administration, rien n'est perdu.
 */
import { eq } from "drizzle-orm";
import { formatEurosShort } from "@/core/format";
import { siteUrl } from "@/core/site-url";
import { getDb } from "@/server/db/client";
import { notifications } from "@/server/db/schema";
import { loadSettingsValues, type DbLike } from "@/server/settings/repository";

export interface Notifier {
  readonly channel: string;
  send(message: { to: string; subject: string; text: string }): Promise<void>;
}

class ResendNotifier implements Notifier {
  readonly channel = "email";
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: { to: string; subject: string; text: string }) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [message.to], subject: message.subject, text: message.text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Resend : réponse ${response.status}`);
  }
}

function emailNotifier(): Notifier | null {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  return key && from ? new ResendNotifier(key, from) : null;
}

export async function notifyNewRequest(intervention: {
  id: string;
  reference: string;
  contactName: string;
  contactPhone: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  dropoffKind: string;
  vehicleLabel: string;
  problemLabel: string;
  estimatedPriceCents: number | null;
  afterRegulatedRoad: boolean;
}): Promise<void> {
  const db = await getDb();
  const values = await loadSettingsValues(db);
  const recipient = values["notifications.email"] || values["company.email"];
  const subject = `🚨 Nouvelle demande ${intervention.reference} — ${intervention.pickupAddress}`;
  const text = [
    `Nouvelle demande de dépannage ${intervention.reference}`,
    "",
    `Client : ${intervention.contactName} — ${intervention.contactPhone}`,
    `Prise en charge : ${intervention.pickupAddress}${intervention.afterRegulatedRoad ? " (relais après autoroute)" : ""}`,
    `Destination : ${intervention.dropoffKind === "on_site" ? "dépannage sur place" : (intervention.dropoffAddress ?? "à préciser")}`,
    `Véhicule : ${intervention.vehicleLabel}`,
    `Problème : ${intervention.problemLabel}`,
    `Estimation montrée au client : ${intervention.estimatedPriceCents !== null ? formatEurosShort(intervention.estimatedPriceCents) : "aucune (à rappeler pour un prix)"}`,
    "",
    `Ouvrir la demande : ${siteUrl()}/admin/demandes/${intervention.id}`,
  ].join("\n");

  const notifier = emailNotifier();
  const [row] = await db
    .insert(notifications)
    .values({
      channel: "email",
      recipient: recipient || "(aucun destinataire)",
      subject,
      body: text,
      status: "pending",
      interventionId: intervention.id,
    })
    .returning({ id: notifications.id });
  if (!row) return;

  if (!notifier || !recipient) {
    await db
      .update(notifications)
      .set({
        status: "skipped",
        lastError: !recipient ? "Aucun email destinataire (Paramètres → Notifications)." : "Aucun service d'email configuré (RESEND_API_KEY, EMAIL_FROM).",
      })
      .where(eq(notifications.id, row.id));
    return;
  }
  try {
    await notifier.send({ to: recipient, subject, text });
    await db.update(notifications).set({ status: "sent", attempts: 1, sentAt: new Date() }).where(eq(notifications.id, row.id));
  } catch (error) {
    await db
      .update(notifications)
      .set({ status: "failed", attempts: 1, lastError: error instanceof Error ? error.message : "erreur" })
      .where(eq(notifications.id, row.id));
  }
}

/** État de l'envoi d'emails, pour la page « Services externes ». */
export function emailConfigured(): boolean {
  return emailNotifier() !== null;
}

/** Envoie un email d'essai au destinataire des nouvelles demandes. */
export async function sendTestEmail(db: DbLike): Promise<{ ok: boolean; message: string }> {
  const values = await loadSettingsValues(db);
  const recipient = values["notifications.email"] || values["company.email"];
  if (!recipient) return { ok: false, message: "Indiquez d'abord un email (Paramètres → Notifications ou Entreprise)." };
  const notifier = emailNotifier();
  if (!notifier) {
    return {
      ok: false,
      message: "Aucun service d'email n'est configuré. Ajoutez les variables RESEND_API_KEY et EMAIL_FROM chez votre hébergeur (voir le guide d'installation).",
    };
  }
  try {
    await notifier.send({
      to: recipient,
      subject: "Essai — notifications RNB AUTO",
      text: `Cet email confirme que les nouvelles demandes du site seront bien envoyées à ${recipient}.\n\n${siteUrl()}/admin`,
    });
    return { ok: true, message: `Email d'essai envoyé à ${recipient}.` };
  } catch (error) {
    return { ok: false, message: `Envoi refusé par le service d'email (${error instanceof Error ? error.message : "erreur"}).` };
  }
}
