/** Pages de « Paramètres » : adresse lisible de chaque section et pictogramme. */
import type { IconName } from "@/components/ui/icon";
import type { SectionId } from "./registry";

export const SETTINGS_PAGES: { slug: string; section: SectionId; icon: IconName; group: "company" | "trips" }[] = [
  { slug: "entreprise", section: "company", icon: "phone", group: "company" },
  { slug: "site", section: "site", icon: "sparkles", group: "company" },
  { slug: "mentions-legales", section: "legal", icon: "shield", group: "company" },
  { slug: "notifications", section: "notifications", icon: "mail", group: "company" },
  { slug: "depot", section: "depot", icon: "garage", group: "trips" },
  { slug: "zone", section: "zone", icon: "map", group: "trips" },
  { slug: "trajets", section: "routing", icon: "route", group: "trips" },
];

export function settingsPageOf(slug: string) {
  return SETTINGS_PAGES.find((page) => page.slug === slug) ?? null;
}

export function settingsHref(section: SectionId): string {
  const page = SETTINGS_PAGES.find((p) => p.section === section);
  return page ? `/admin/parametres/${page.slug}` : "/admin/parametres";
}
