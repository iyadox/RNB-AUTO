/**
 * Les six situations de remorquage (docs/09, F.2, PK 01) : textes repris mot pour mot de
 * l'ancienne page. Source commune de la liste (serveur) et de la grande scène (client).
 */
export type SituationKind = "non-roulant" | "accident" | "roues-bloquees" | "parking" | "garage" | "domicile";

export const SITUATIONS: readonly { kind: SituationKind; title: string; text: string }[] = [
  { kind: "non-roulant", title: "Véhicule non roulant", text: "Chargement au treuil sur le plateau, sans forcer la mécanique." },
  { kind: "accident", title: "Après un accident", text: "Véhicule endommagé ou impossible à déplacer : nous adaptons le chargement." },
  { kind: "roues-bloquees", title: "Roues bloquées", text: "Frein bloqué, boîte automatique, roues abîmées : dites-le nous à la demande." },
  { kind: "parking", title: "Parking et sous-sol", text: "Indiquez s'il s'agit d'un parking : la hauteur et l'accès comptent." },
  { kind: "garage", title: "Vers votre garage", text: "Nous déposons le véhicule chez le garagiste de votre choix, aux horaires d'ouverture." },
  { kind: "domicile", title: "Chez vous", text: "Votre véhicule peut aussi être déposé à votre domicile ou à toute adresse." },
];

/** Numéro d'étape sur deux chiffres (« 01 »). */
export const pad = (n: number) => String(n).padStart(2, "0");
