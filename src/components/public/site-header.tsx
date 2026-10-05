"use client";

/**
 * En-tête « pare-brise » (docs/09, D.5). Jamais masqué au défilement, jamais capturé par la
 * transition de page (aucun `viewTransitionName`).
 *
 * - Transparent en haut de page ; après 24 px : fond plein sur mobile (sans flou), fumé et flouté
 *   sur ordinateur, reflet d'un pixel en haut et un reflet qui traverse la vitre une fois.
 * - À partir de 1 024 px : navigation, puis Appeler (« Appeler » jusqu'à 1 279 px, le numéro
 *   au-delà, rien sans numéro) et le bouton jaune ; tout sur une ligne.
 * - Sous 1 024 px : ligne de progression de 2 px sous l'en-tête et menu « plan de nuit ».
 * - Écrit `--header-h` sur <html> (ResizeObserver) quand sa hauteur diffère de la valeur par
 *   défaut du CSS (4 rem, 5 rem à partir de 1 024 px, shell.module.css) : la transition de page
 *   ne recouvre jamais l'en-tête, même quand l'annonce prend deux lignes.
 *
 * Il porte aussi le petit cycle de page de la coque (voir `useShellCycle`).
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { NAV_DESKTOP } from "@/content/site-map";
import type { PhoneLink } from "@/core/contact";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import { CallLink, PrimaryLink } from "./actions";
import { prefetchOnIntent } from "./prefetch-on-intent";
import { MobileMenu } from "./mobile-menu";
import styles from "./shell.module.css";

const SCROLLED_AT = 24;
/** Largeur à partir de laquelle l'en-tête mesure 5 rem (`lg:h-20`) au lieu de 4 rem (`h-16`). */
const WIDE_HEADER = "(min-width: 1024px)";

const subscribeScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
};
const readScrolled = () => window.scrollY > SCROLLED_AT;
const serverScrolled = () => false;

/**
 * Cycle de page de la coque.
 * - Le ciel : le pied de page ne donne l'heure « aube » que si la page déclare ses heures
 *   (`data-sky`) ; une page qui n'en a pas encore reste dans la nuit au lieu de commencer à
 *   l'aube. Joué AVANT le cycle du runtime (l'en-tête précède MotionRuntime dans le layout, ses
 *   effets de mise en page passent donc en premier) : le runtime lit le premier `data-sky`.
 * - Le retour au dépôt : le pied de page appartient au layout, le runtime ne le rejoue pas. Ici,
 *   à chaque page, ses scènes `[data-play-on-view]` sont réarmées puis reçoivent `data-play` en
 *   entrant dans l'écran (92 %), après le retour en haut de page de la navigation.
 */
function useShellCycle(pathname: string) {
  useLayoutEffect(() => {
    const footer = document.querySelector<HTMLElement>("footer[data-depot-footer]");
    if (!footer) return;
    const pageHasSky = document.querySelector("#contenu [data-sky]") !== null;
    if (pageHasSky) footer.setAttribute("data-sky", "aube");
    else footer.removeAttribute("data-sky");
  }, [pathname]);

  useEffect(() => {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("footer[data-depot-footer] [data-play-on-view]"));
    for (const scene of scenes) scene.removeAttribute("data-play");
    let observer: IntersectionObserver | null = null;
    const frame = requestAnimationFrame(() => {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.setAttribute("data-play", "");
            io.unobserve(entry.target);
          }
        },
        { rootMargin: "0px 0px -8% 0px" },
      );
      for (const scene of scenes) io.observe(scene);
      observer = io;
    });
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [pathname]);
}

export function SiteHeader({
  phone,
  whatsapp,
  announcement,
}: {
  phone: PhoneLink | null;
  whatsapp: PhoneLink | null;
  announcement: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const scrolled = useSyncExternalStore(subscribeScroll, readScrolled, serverScrolled);
  const headerRef = useRef<HTMLElement>(null);

  useShellCycle(pathname);

  // Hauteur réelle de l'en-tête (annonce comprise) pour la découpe de la transition de page.
  // Écrire une variable héritée sur <html> recalcule le style de TOUTE la page (≈ 200 ms mesurées à
  // l'hydratation, téléphone, processeur ×4) : rien n'est écrit tant que la hauteur réelle est
  // celle du CSS par défaut (`--header-h` de `:root`, sans annonce), et jamais deux fois la même.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const html = document.documentElement;
    const wide = window.matchMedia(WIDE_HEADER);
    const write = () => {
      const height = Math.round(header.getBoundingClientRect().height);
      const rem = parseFloat(getComputedStyle(html).fontSize) || 16;
      const fallback = Math.round((wide.matches ? 5 : 4) * rem);
      const value = height === fallback ? "" : `${height}px`;
      if (html.style.getPropertyValue("--header-h") === value) return;
      if (value) html.style.setProperty("--header-h", value);
      else html.style.removeProperty("--header-h");
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(header);
    return () => {
      observer.disconnect();
      html.style.removeProperty("--header-h");
    };
  }, []);

  return (
    <header ref={headerRef} data-scrolled={scrolled ? "" : undefined} className={styles.header}>
      <span className={styles.glare} aria-hidden="true" />
      {announcement ? (
        <div className={styles.announce}>
          <p className="mx-auto flex max-w-7xl items-start justify-center gap-2 px-4 py-2 text-center sm:px-6">
            <Icon name="info" size={16} strokeWidth={2.4} className="mt-[0.2em] shrink-0" />
            <span>{announcement}</span>
          </p>
        </div>
      ) : null}

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8 xl:gap-4">
        {/* Zone de toucher de 48 px de haut (l'en-tête en fait 64). Pas de préchargement à l'affichage :
            il chargeait toute la page d'accueil (scènes comprises) depuis chaque page ; il a lieu au survol
            ou au focus (`prefetchOnIntent`). */}
        <Link
          href="/"
          prefetch={false}
          {...prefetchOnIntent(router, "/")}
          className={cn(styles.brand, "min-h-12 shrink-0")}
          aria-label="RNB AUTO, accueil"
        >
          <span className={styles.brandMark}>
            <LogoMark className="h-9 w-9 lg:h-10 lg:w-10" />
          </span>
          {/* Entre 1 024 et 1 279 px, le losange seul : la navigation et les deux actions tiennent sur une ligne.
              L'accroche en 12 px (taille minimale des plaques) ; sous 360 px, elle ne tient plus à côté du
              bouton du menu : masquée (le nom reste). */}
          <span className="leading-none lg:hidden xl:block">
            <span className="font-wide block text-[1.15rem] tracking-[0.06em] text-chalk">RNB AUTO</span>
            <span className="mt-1 block text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-signal-500 max-[359px]:hidden lg:hidden">
              Dépannage · Remorquage
            </span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center lg:flex">
          {NAV_DESKTOP.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.help}
                aria-current={active ? "page" : undefined}
                className={styles.navLink}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Tablette et ordinateur : la barre d'action n'existe plus à partir de 768 px.
              « Appeler » jusqu'à 1 279 px, le numéro au-delà ; rien si le numéro manque. */}
          {phone ? (
            <>
              <span className="hidden md:block xl:hidden">
                <CallLink phone={phone} label="short" size="sm" />
              </span>
              <span className="hidden xl:block">
                <CallLink phone={phone} label="number" size="sm" />
              </span>
            </>
          ) : null}
          {/* Sur /demande, le bouton jaune mène à la page courante, qui a déjà le sien : masqué (CSS). */}
          <span className={cn(styles.headerPrimary, "hidden md:block")}>
            <PrimaryLink href="/demande" size="sm">
              Demander un dépannage
            </PrimaryLink>
          </span>
          <MobileMenu phone={phone} whatsapp={whatsapp} />
        </div>
      </div>

      {/* Progression de lecture (mobile et tablette) ; /demande a sa propre route d'étapes. */}
      <div className={styles.progress} aria-hidden="true">
        <span className="progress-x" />
      </div>
    </header>
  );
}
