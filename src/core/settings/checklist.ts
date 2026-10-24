/**
 * « Ce qui manque » : informations à compléter avant de mettre le site en avant.
 * Logique pure, à partir des réglages enregistrés. Chaque point mène directement au bon champ.
 */
import type { IconName } from "@/components/ui/icon";
import type { SettingsValues } from "./registry";
import { settingHref, settingsHref } from "./settings-pages";

export type ChecklistItem = {
  id: string;
  label: string;
  /** Pourquoi c'est utile, en une phrase. */
  why: string;
  href: string;
  icon: IconName;
  done: boolean;
  /** Indispensable (le site affiche « À COMPLÉTER » sans lui) ou simplement conseillé. */
  level: "required" | "recommended";
};

function filled(value: unknown): boolean {
  return typeof value === "string" && value.trim() !== "";
}

export function setupChecklist(values: SettingsValues, env: { emailService: boolean }): ChecklistItem[] {
  return [
    {
      id: "phone",
      label: "Numéro de téléphone",
      why: "Le bouton « Appeler » du site en a besoin.",
      href: settingHref("company", "company.phone"),
      icon: "phone",
      done: filled(values["company.phone"]),
      level: "required",
    },
    {
      id: "whatsapp",
      label: "Numéro WhatsApp",
      why: "Sinon, le site utilise le numéro de téléphone.",
      href: settingHref("company", "company.whatsapp"),
      icon: "phone",
      done: filled(values["company.whatsapp"]) || filled(values["company.phone"]),
      level: "recommended",
    },
    {
      id: "email",
      label: "Email de contact",
      why: "Affiché sur la page Contact.",
      href: settingHref("company", "company.email"),
      icon: "mail",
      done: filled(values["company.email"]),
      level: "required",
    },
    {
      id: "availability",
      label: "Disponibilité (ex. 24h/24 · 7j/7)",
      why: "Rassure le client avant d'appeler.",
      href: settingHref("company", "company.availability"),
      icon: "clock",
      done: filled(values["company.availability"]),
      level: "recommended",
    },
    {
      id: "depot",
      label: "Position du dépôt sur la carte",
      why: "Tous les prix partent du dépôt.",
      href: settingsHref("depot"),
      icon: "pin",
      done: values["company.depot"].confirmed,
      level: "required",
    },
    {
      id: "legal-company",
      label: "Raison sociale et forme juridique",
      why: "Obligatoire dans les mentions légales.",
      href: settingHref("legal", filled(values["legal.companyName"]) ? "legal.legalForm" : "legal.companyName"),
      icon: "shield",
      done: filled(values["legal.companyName"]) && filled(values["legal.legalForm"]),
      level: "required",
    },
    {
      id: "legal-siret",
      label: "Numéro SIRET",
      why: "Obligatoire dans les mentions légales.",
      href: settingHref("legal", "legal.siret"),
      icon: "shield",
      done: filled(values["legal.siret"]),
      level: "required",
    },
    {
      id: "legal-director",
      label: "Directeur ou directrice de la publication",
      why: "Obligatoire dans les mentions légales.",
      href: settingHref("legal", "legal.publicationDirector"),
      icon: "user",
      done: filled(values["legal.publicationDirector"]),
      level: "required",
    },
    {
      id: "legal-host",
      label: "Hébergeur du site",
      why: "Obligatoire dans les mentions légales.",
      href: settingHref("legal", "legal.host"),
      icon: "shield",
      done: filled(values["legal.host"]),
      level: "required",
    },
    {
      id: "email-alerts",
      label: "Recevoir les demandes par email",
      why: env.emailService ? "Indiquez l'adresse qui reçoit les demandes." : "Le service d'envoi d'emails n'est pas encore branché.",
      href: settingsHref("notifications"),
      icon: "mail",
      done: env.emailService && (filled(values["notifications.email"]) || filled(values["company.email"])),
      level: "recommended",
    },
  ];
}

export function checklistProgress(items: ChecklistItem[]): { done: number; total: number; missingRequired: number } {
  return {
    done: items.filter((i) => i.done).length,
    total: items.length,
    missingRequired: items.filter((i) => !i.done && i.level === "required").length,
  };
}
