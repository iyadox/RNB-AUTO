/**
 * Email au client : « votre demande est bien reçue, suivez-la ici ». Envoyé seulement si le
 * client a donné son email ET si l'envoi d'emails est configuré (RESEND_API_KEY, EMAIL_FROM).
 * Passe par l'adaptateur `Notifier` (délai maximal de 8 s) ; un échec ne change rien à la demande
 * (le lien est déjà affiché à l'écran) et reste tracé dans la file des notifications.
 */
import { eq } from "drizzle-orm";
import { formatEurosShort, formatPhone } from "@/core/format";
import { siteUrl } from "@/core/site-url";
import { notifications } from "@/server/db/schema";
import { escapeHtml } from "@/server/notifications/email-template";
import type { Notifier, OutgoingMessage } from "@/server/notifications/service";
import { loadSettingsValues, type DbLike } from "@/server/settings/repository";

class ResendClientNotifier implements Notifier {
  readonly channel = "email";
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: OutgoingMessage) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [message.to], subject: message.subject, text: message.text, ...(message.html ? { html: message.html } : {}) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Resend : réponse ${response.status}`);
  }
}

/** Adaptateur d'envoi, ou `null` si l'envoi d'emails n'est pas configuré. */
export function clientEmailNotifier(): Notifier | null {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  return key && from ? new ResendClientNotifier(key, from) : null;
}

export type TrackingEmail = {
  companyName: string;
  reference: string;
  url: string;
  estimate: string | null;
  phone: string | null;
};

export function trackingEmailText(data: TrackingEmail): string {
  return [
    "Bonjour,",
    "",
    `Nous avons bien reçu votre demande de dépannage n° ${data.reference}.`,
    "Nous vous rappelons pour confirmer le prix et organiser l'intervention.",
    data.estimate ? `Prix estimé : ${data.estimate} TTC (confirmé avec vous par téléphone avant l'intervention).` : "",
    "",
    "Suivez votre demande en direct (étape, prix, ajout de photos) :",
    data.url,
    "",
    "Ce lien est personnel : ne le partagez qu'avec une personne de confiance.",
    data.phone ? `Une question ? Appelez-nous au ${data.phone}.` : "",
    "",
    data.companyName,
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n");
}

export function trackingEmailHtml(data: TrackingEmail): string {
  const e = escapeHtml;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(data.reference)}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:16px 0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="background:#0d0f12;padding:22px 24px;color:#ffffff">
<p style="margin:0;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#ffc400;font-weight:700">Demande reçue</p>
<p style="margin:6px 0 0;font-size:22px;font-weight:800">N° ${e(data.reference)}</p>
<p style="margin:4px 0 0;font-size:14px;color:#c7cbd3">${e(data.companyName)}</p>
</td></tr>
<tr><td style="padding:22px 24px;font-size:16px;line-height:1.5;color:#0d0f12">
<p style="margin:0 0 12px">Nous avons bien reçu votre demande. Nous vous rappelons pour confirmer le prix et organiser l'intervention.</p>
${data.estimate ? `<p style="margin:0 0 12px">Prix estimé : <strong>${e(data.estimate)} TTC</strong> (confirmé avec vous par téléphone avant l'intervention).</p>` : ""}
<a href="${e(data.url)}" style="display:block;margin:20px 0 8px;background:#ffc400;color:#0d0f12;text-decoration:none;text-align:center;font-weight:800;font-size:17px;padding:16px 8px;border-radius:14px">Suivre ma demande</a>
<p style="margin:0;font-size:13px;color:#5b6270">Étape en direct, prix, ajout de photos. Ce lien est personnel : ne le partagez qu'avec une personne de confiance.</p>
${data.phone ? `<p style="margin:16px 0 0;font-size:15px">Une question ? <a href="tel:${e(data.phone.replace(/[^\d+]/g, ""))}" style="color:#0d0f12;font-weight:800">${e(data.phone)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:14px 24px 22px;color:#8a909c;font-size:12px">Email automatique envoyé suite à votre demande sur le site.</td></tr>
</table></td></tr></table>
</body></html>`;
}

/** Envoie le lien de suivi au client (s'il a donné son email et si l'envoi est configuré). */
export async function sendTrackingEmail(
  db: DbLike,
  params: { interventionId: string; reference: string; email: string | null; path: string; estimatedPriceCents: number | null },
): Promise<"sent" | "skipped" | "failed"> {
  const notifier = clientEmailNotifier();
  if (!params.email || !notifier) return "skipped";
  const values = await loadSettingsValues(db);
  const data: TrackingEmail = {
    companyName: values["company.name"] || "RNB AUTO",
    reference: params.reference,
    url: `${siteUrl()}${params.path}`,
    estimate: params.estimatedPriceCents !== null ? formatEurosShort(params.estimatedPriceCents) : null,
    phone: values["company.phone"]?.trim() ? formatPhone(values["company.phone"].trim()) : null,
  };
  const subject = `Votre demande ${params.reference} — suivez-la en direct`;
  const text = trackingEmailText(data);
  // La file garde une trace de l'envoi, sans le lien (il donne accès au suivi).
  const [row] = await db
    .insert(notifications)
    .values({
      channel: "email",
      recipient: params.email,
      subject,
      body: text.replace(data.url, `${siteUrl()}/suivi/${params.reference}?t=…`),
      status: "pending",
      interventionId: params.interventionId,
    })
    .returning({ id: notifications.id });
  try {
    await notifier.send({ to: params.email, subject, text, html: trackingEmailHtml(data) });
    if (row) await db.update(notifications).set({ status: "sent", attempts: 1, sentAt: new Date() }).where(eq(notifications.id, row.id));
    return "sent";
  } catch (error) {
    if (row) {
      await db
        .update(notifications)
        .set({ status: "failed", attempts: 1, lastError: error instanceof Error ? error.message : "erreur" })
        .where(eq(notifications.id, row.id));
    }
    return "failed";
  }
}
