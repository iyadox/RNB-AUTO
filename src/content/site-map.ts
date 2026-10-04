/**
 * Plan du site public : navigation, menu mobile, pied de page, enchaînement des pages et
 * routes calmes (docs/09, C.6, D.5, D.6, D.8). Aucune page ne réécrit ces listes.
 */

export type NavItem = { href: string; label: string; help: string };

/** Menu mobile « plan de nuit » : un titre et une ligne d'aide par lien (D.6). */
export const MENU_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Accueil", help: "Votre situation, votre prix" },
  { href: "/depannage", label: "Dépannage", help: "Batterie, crevaison, petite panne" },
  { href: "/remorquage", label: "Remorquage", help: "Accident, véhicule non roulant, parking" },
  { href: "/panne-autoroute", label: "Panne sur autoroute", help: "Sécurité d'abord, puis relais à la sortie" },
  { href: "/zones-d-intervention", label: "Zones d'intervention", help: "Paris et toute l'Île-de-France" },
  { href: "/questions-frequentes", label: "Questions fréquentes", help: "Prix, paiement, véhicules, photos" },
  { href: "/entreprise", label: "L'entreprise", help: "Qui nous sommes, notre dépanneuse" },
  { href: "/contact", label: "Contact", help: "Téléphone, WhatsApp, adresse" },
];

/** Navigation de l'en-tête à partir de 1 024 px, dans l'ordre de D.5 (libellés courts, mêmes aides que le menu). */
export const NAV_DESKTOP: readonly NavItem[] = [
  { href: "/depannage", label: "Dépannage", help: "Batterie, crevaison, petite panne" },
  { href: "/remorquage", label: "Remorquage", help: "Accident, véhicule non roulant, parking" },
  { href: "/panne-autoroute", label: "Autoroute", help: "Sécurité d'abord, puis relais à la sortie" },
  { href: "/zones-d-intervention", label: "Zones", help: "Paris et toute l'Île-de-France" },
  { href: "/questions-frequentes", label: "Questions", help: "Prix, paiement, véhicules, photos" },
  { href: "/contact", label: "Contact", help: "Téléphone, WhatsApp, adresse" },
];

export type FooterColumn = { title: string; links: readonly { href: string; label: string }[] };

/** Colonnes du pied de page (contenu existant, lien « Espace RNB AUTO » compris). */
export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    title: "Services",
    links: [
      { href: "/depannage", label: "Dépannage sur place" },
      { href: "/remorquage", label: "Remorquage" },
      { href: "/panne-autoroute", label: "Panne sur autoroute" },
      { href: "/demande", label: "Demande en ligne" },
    ],
  },
  {
    title: "RNB AUTO",
    links: [
      { href: "/entreprise", label: "L'entreprise" },
      { href: "/zones-d-intervention", label: "Zones d'intervention" },
      { href: "/questions-frequentes", label: "Questions fréquentes" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/conditions-d-intervention", label: "Conditions d'intervention" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/admin", label: "Espace RNB AUTO" },
    ],
  },
];

/** « Prochaine sortie » de chaque sous-page (D.8). Absente sur l'accueil, /contact, /demande, les pages légales et la 404. */
export const NEXT_EXIT: Readonly<Record<string, { href: string; title: string; text: string }>> = {
  "/depannage": { href: "/remorquage", title: "Remorquage", text: "Votre véhicule, où vous voulez" },
  "/remorquage": { href: "/panne-autoroute", title: "Panne sur autoroute", text: "Votre sécurité d'abord" },
  "/panne-autoroute": { href: "/zones-d-intervention", title: "Zones d'intervention", text: "Paris et toute l'Île-de-France" },
  "/zones-d-intervention": { href: "/questions-frequentes", title: "Questions fréquentes", text: "Prix, paiement, véhicules" },
  "/questions-frequentes": { href: "/entreprise", title: "L'entreprise", text: "RNB AUTO, dépannage à Bobigny" },
  "/entreprise": { href: "/contact", title: "Contact", text: "On vous répond tout de suite" },
};

/** Routes calmes : ni Lenis, ni halo (C.6). */
export const CALM_ROUTES: readonly string[] = [
  "/demande",
  "/contact",
  "/mentions-legales",
  "/confidentialite",
  "/conditions-d-intervention",
];

/** Vrai si la route (ou une de ses sous-routes) est calme. */
export function isCalmRoute(pathname: string): boolean {
  return CALM_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
