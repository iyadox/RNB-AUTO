/**
 * Liens d'action de la fiche d'une demande (itinéraires, SMS, WhatsApp) et textes préremplis.
 * De simples liens : ils fonctionnent sans JavaScript. Aucun délai ni horaire n'est inventé.
 */
import type { InterventionStatus } from "./status";

export type Place = { label: string; lat: number | null; lng: number | null };

function coords(place: Place): string {
  return place.lat !== null && place.lng !== null ? `${place.lat},${place.lng}` : place.label;
}

/**
 * Itinéraire Google Maps depuis la position du téléphone : vers `destination`, en passant
 * d'abord par `via` si elle est donnée (prise en charge puis destination).
 */
export function googleMapsDirections(destination: Place, via?: Place | null): string {
  const params = new URLSearchParams({ api: "1", destination: coords(destination), travelmode: "driving" });
  if (via) params.set("waypoints", coords(via));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Navigation Waze vers un lieu (Waze ne gère pas les étapes). */
export function wazeNavigation(place: Place): string {
  return place.lat !== null && place.lng !== null
    ? `https://waze.com/ul?ll=${place.lat},${place.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(place.label)}&navigate=yes`;
}

/** Lien SMS avec un message prérempli (format accepté par Android et iPhone). */
export function smsHref(e164: string, body: string): string {
  return `sms:${e164}?&body=${encodeURIComponent(body)}`;
}

export type MessageContext = {
  companyName: string;
  reference: string;
  contactName: string;
  pickup: string;
};

/** Premier mot du nom, pour un message plus naturel (« Bonjour Karim »). */
function greetingName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.length >= 2 ? ` ${first}` : "";
}

/** Message au client, adapté à l'étape de l'intervention. */
export function customerMessage(status: InterventionStatus, ctx: MessageContext): string {
  const hello = `Bonjour${greetingName(ctx.contactName)}, ici ${ctx.companyName}.`;
  const ref = `demande n° ${ctx.reference}`;
  switch (status) {
    case "new":
    case "to_call_back":
      return `${hello} Nous avons bien reçu votre ${ref} (${ctx.pickup}). Nous vous appelons dans un instant pour l'organiser.`;
    case "accepted":
      return `${hello} Votre ${ref} est confirmée. Nous vous prévenons dès que la dépanneuse part.`;
    case "en_route":
      return `${hello} La dépanneuse est en route vers vous (${ctx.pickup}). Restez en sécurité en attendant.`;
    case "arrived":
      return `${hello} La dépanneuse est arrivée sur place pour votre ${ref}.`;
    case "loaded":
    case "in_transit":
      return `${hello} Votre véhicule est chargé et en cours de transport (${ref}).`;
    case "completed":
      return `${hello} L'intervention de votre ${ref} est terminée. Merci de votre confiance.`;
    case "cancelled":
      return `${hello} Au sujet de votre ${ref}.`;
  }
}

/** Message qui accompagne le lien de suivi envoyé au client. */
export function trackingMessage(ctx: MessageContext, url: string): string {
  return `Bonjour${greetingName(ctx.contactName)}, ici ${ctx.companyName}. Suivez l'avancement de votre demande n° ${ctx.reference} sur cette page : ${url}`;
}

export type SummaryInput = {
  companyName: string;
  reference: string;
  statusLabel: string;
  createdAt: string;
  contactName: string;
  contactPhone: string;
  pickup: string;
  handoverNote: string | null;
  destination: string;
  vehicle: string;
  situations: string[];
  price: string | null;
  mapsUrl: string;
};

/** Résumé texte d'une intervention (partage du bon d'intervention, copie). */
export function interventionSummary(input: SummaryInput): string {
  const lines = [
    `${input.companyName} · Bon d'intervention ${input.reference}`,
    `Statut : ${input.statusLabel} · demande du ${input.createdAt}`,
    "",
    `Client : ${input.contactName} · ${input.contactPhone}`,
    `Prise en charge : ${input.pickup}`,
  ];
  if (input.handoverNote) lines.push(`Sur place : ${input.handoverNote}`);
  lines.push(`Destination : ${input.destination}`, `Véhicule : ${input.vehicle}`);
  if (input.situations.length) lines.push(`Situation : ${input.situations.join(", ")}`);
  lines.push(`Prix : ${input.price ?? "à confirmer"}`, "", `Itinéraire : ${input.mapsUrl}`);
  return lines.join("\n");
}
