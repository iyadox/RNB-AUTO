/** Liens d'appel et WhatsApp : de simples liens, qui fonctionnent sans JavaScript. */
import { formatPhone, phoneToE164 } from "./format";

export type PhoneLink = { display: string; href: string; e164: string };

export function phoneLink(raw: string | null | undefined): PhoneLink | null {
  if (!raw) return null;
  const e164 = phoneToE164(raw);
  if (!e164) return null;
  return { display: formatPhone(raw), href: `tel:${e164}`, e164 };
}

/** Lien WhatsApp avec un message pré-rempli. */
export function whatsappHref(e164: string, message?: string): string {
  const digits = e164.replace(/\D/g, "");
  return message ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/${digits}`;
}

/** Message WhatsApp pré-rempli avec ce que le client a déjà saisi. */
export function whatsappRequestMessage(details: {
  reference?: string | null;
  pickup?: string | null;
  vehicle?: string | null;
  problem?: string | null;
  destination?: string | null;
}): string {
  const lines = ["Bonjour RNB AUTO, j'ai besoin d'un dépannage."];
  if (details.reference) lines.push(`Demande n° ${details.reference}`);
  if (details.pickup) lines.push(`📍 Je suis : ${details.pickup}`);
  if (details.destination) lines.push(`🏁 Destination : ${details.destination}`);
  if (details.vehicle) lines.push(`🚗 Véhicule : ${details.vehicle}`);
  if (details.problem) lines.push(`⚠️ Problème : ${details.problem}`);
  return lines.join("\n");
}
