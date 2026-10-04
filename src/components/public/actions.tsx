/**
 * Les actions du site public (docs/09, D.5, D.7, D.8) : bouton principal, Appeler, WhatsApp et
 * leur rangée. Ce sont de simples liens rendus par le serveur : ils fonctionnent sans JavaScript
 * et ne reçoivent jamais d'animation d'entrée (C.1-2). Au survol, sur ordinateur, un reflet
 * rétroréfléchissant traverse le bouton et il se soulève de 2 px (D.9).
 *
 * Numéro absent : Appeler mène à /contact avec le marqueur « N° à compléter » (jamais de numéro
 * inventé). L'en-tête et le menu, placés AVANT le contenu dans la page, utilisent `missing="plain"`
 * ou `missing="hidden"` : un marqueur caché placé là passerait devant celui de /contact pour les
 * tests (sélecteur « À COMPLÉTER »), et la barre d'action l'affiche déjà.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { whatsappHref, whatsappRequestMessage, type PhoneLink } from "@/core/contact";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import styles from "./shell.module.css";

type Variant = "solid" | "outline" | "ghost";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap rounded-2xl font-extrabold transition-[translate,background-color,color,box-shadow] duration-(--dur-ui) ease-(--ease-out-expo) active:scale-[0.98]";

/** Bouton principal jaune (« Demander un dépannage »). Un seul par écran (B.1). */
export function PrimaryLink({
  href,
  children,
  size = "lg",
  transitionTypes,
  className,
}: {
  href: string;
  children: ReactNode;
  size?: "lg" | "md" | "sm";
  transitionTypes?: string[];
  className?: string;
}) {
  return (
    <Link
      href={href}
      transitionTypes={transitionTypes}
      className={cn(
        BASE,
        styles.glint,
        "group bg-signal-500 text-asphalt-950 hover:bg-signal-400",
        // La lueur suit la taille : en petit (en-tête), une lueur large débordait sous l'en-tête.
        size === "lg"
          ? "h-16 px-7 text-lg shadow-[0_18px_48px_-14px_rgb(255_196_0_/_0.55)]"
          : size === "md"
            ? "h-14 px-6 text-base shadow-[0_14px_36px_-14px_rgb(255_196_0_/_0.5)]"
            : "h-11 px-5 text-[0.9375rem] shadow-[0_8px_20px_-10px_rgb(255_196_0_/_0.45)]",
        className,
      )}
    >
      <span className="relative">{children}</span>
      <Icon
        name="arrowRight"
        size={size === "lg" ? 22 : size === "md" ? 20 : 17}
        strokeWidth={2.6}
        className="relative transition-transform duration-(--dur-ui) group-hover:translate-x-1"
      />
    </Link>
  );
}

const CALL_VARIANT: Record<Variant, string> = {
  solid: "bg-chalk text-asphalt-950 hover:bg-white",
  outline:
    "text-chalk shadow-[inset_0_0_0_1.5px_rgb(255_253_246_/_0.28)] hover:text-signal-400 hover:shadow-[inset_0_0_0_1.5px_var(--color-signal-500)]",
  ghost: "text-chalk hover:text-signal-400",
};

/**
 * Appeler. `label="number"` : le numéro en chiffres fixes (jamais animé) ; `label="short"` :
 * « Appeler ». Numéro absent (`missing`) : `marker` (par défaut) mène à /contact avec
 * « N° à compléter », `plain` mène à /contact sans marqueur, `hidden` n'affiche rien.
 */
export function CallLink({
  phone,
  variant = "outline",
  label = "number",
  missing = "marker",
  size = "md",
  className,
}: {
  phone: PhoneLink | null;
  variant?: Variant;
  label?: "number" | "short";
  missing?: "marker" | "plain" | "hidden";
  size?: "lg" | "md" | "sm";
  className?: string;
}) {
  const sizing = size === "lg" ? "h-16 px-6 text-lg" : size === "md" ? "h-14 px-5 text-base" : "h-11 px-4 text-[0.9375rem]";
  if (!phone) {
    if (missing === "hidden") return null;
    return (
      <Link href="/contact" className={cn(BASE, styles.glint, sizing, CALL_VARIANT[variant], "group", className)}>
        <Icon name="phone" size={size === "sm" ? 17 : 20} strokeWidth={2.4} className="relative" />
        <span className="relative flex flex-col items-start leading-tight">
          Appeler
          {missing === "marker" ? (
            <span className="font-plate text-[0.6rem] text-beacon-400">N° à compléter</span>
          ) : null}
        </span>
      </Link>
    );
  }
  return (
    <a href={phone.href} className={cn(BASE, styles.glint, sizing, CALL_VARIANT[variant], "group", className)}>
      <Icon name="phone" size={size === "sm" ? 17 : 20} strokeWidth={2.4} className="relative" />
      {label === "number" ? (
        <span className="font-figure relative text-[1.12em] [word-spacing:0.12em]">{phone.display}</span>
      ) : (
        <span className="relative">Appeler</span>
      )}
    </a>
  );
}

const WA_VARIANT: Record<Variant, string> = {
  solid: "bg-whatsapp text-asphalt-950 hover:shadow-[0_0_0_3px_rgb(37_211_102_/_0.25)]",
  outline:
    "text-whatsapp shadow-[inset_0_0_0_1.5px_rgb(37_211_102_/_0.45)] hover:shadow-[inset_0_0_0_1.5px_var(--color-whatsapp)]",
  ghost: "text-whatsapp hover:text-chalk",
};

/** WhatsApp, avec un message pré-rempli. Rien si aucun numéro n'est réglé. */
export function WhatsAppLink({
  whatsapp,
  message,
  variant = "outline",
  size = "md",
  className,
}: {
  whatsapp: PhoneLink | null;
  message?: string;
  variant?: Variant;
  size?: "lg" | "md" | "sm";
  className?: string;
}) {
  if (!whatsapp) return null;
  const sizing = size === "lg" ? "h-16 px-6 text-lg" : size === "md" ? "h-14 px-5 text-base" : "h-11 px-4 text-[0.9375rem]";
  return (
    <a
      href={whatsappHref(whatsapp.e164, message ?? whatsappRequestMessage({}))}
      className={cn(BASE, styles.glint, sizing, WA_VARIANT[variant], "group", className)}
    >
      <WhatsAppIcon size={size === "sm" ? 17 : 20} className="relative" />
      <span className="relative">WhatsApp</span>
    </a>
  );
}

/**
 * Rangée d'actions de fin de page (aube) ou d'ouverture : bouton principal, numéro, WhatsApp.
 * `layout="stack"` : boutons empilés de 64 px sur mobile, en ligne à partir de `sm`.
 * `tone="dawn"` : sur le ciel d'aube (liserés plus présents).
 */
export function ActionRow({
  info,
  primary = { href: "/demande", label: "Demander un dépannage" },
  layout = "stack",
  tone = "night",
  className,
}: {
  info: Pick<PublicSiteInfo, "phone" | "whatsapp">;
  primary?: { href: string; label: string } | null;
  layout?: "row" | "stack";
  tone?: "night" | "dawn";
  className?: string;
}) {
  const stack = layout === "stack";
  return (
    <div
      className={cn(
        "flex gap-3",
        stack ? "flex-col sm:flex-row sm:flex-wrap sm:items-center" : "flex-row flex-wrap items-center",
        className,
      )}
    >
      {primary ? (
        <PrimaryLink href={primary.href} size={stack ? "lg" : "md"} className={stack ? "w-full sm:w-auto" : undefined}>
          {primary.label}
        </PrimaryLink>
      ) : null}
      {/* Appeler et WhatsApp restent ensemble : quand la place manque, la paire passe à la ligne,
          jamais WhatsApp seul sous les deux autres. */}
      <div className={cn("flex gap-3", stack ? "flex-col sm:flex-row" : "flex-row flex-wrap")}>
        <CallLink
          phone={info.phone}
          size={stack ? "lg" : "md"}
          className={cn(stack && "w-full sm:w-auto", tone === "dawn" && "bg-night-950/40")}
        />
        <WhatsAppLink
          whatsapp={info.whatsapp}
          size={stack ? "lg" : "md"}
          className={cn(stack && "w-full sm:w-auto", tone === "dawn" && "bg-night-950/40")}
        />
      </div>
    </div>
  );
}
