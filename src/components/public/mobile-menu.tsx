"use client";

/**
 * Menu mobile « plan de nuit » (docs/09, D.6), sous 1 024 px.
 *
 * - `<details data-menu>` natif : il s'ouvre et se ferme sans JavaScript ; aucune case à cocher.
 * - Panneau fixe sous l'en-tête, jusqu'en bas de l'écran ; la barre d'action (z 60) reste
 *   par-dessus et le panneau lui garde sa place. Défilement de la page bloqué en CSS (`:has`).
 * - « Demander un dépannage » et la rangée Appeler / WhatsApp sont toujours visibles sans faire
 *   défiler : sur un écran bas (790 px et moins), les lignes se resserrent (48 px, aide en
 *   14 px) ; plus bas encore, seule la liste des liens défile, les actions restent en place.
 * - Sous 768 px, la barre d'action reste visible sous le panneau, avec Appeler et WhatsApp : la
 *   rangée Appeler / WhatsApp du menu y est masquée (six boutons pour trois actions, constaté)
 *   et « Demander un dépannage » passe au trait (un seul aplat jaune à l'écran : Appeler).
 * - Le focus ne quitte jamais un menu ouvert pour la page cachée derrière : s'il sort du menu
 *   (Tab après le dernier lien, Maj+Tab avant le bouton), le menu se ferme, comme avec Échap.
 * - Huit liens (`MENU_ITEMS`), chacun avec sa ligne d'aide, posés comme des arrêts sur une route
 *   de nuit ; la page en cours est le losange jaune allumé.
 * - Ouverture : un cercle de lumière part du bouton, puis les lignes arrivent en cascade (CSS).
 *   Fermeture instantanée : Échap, choix d'un lien, changement de page.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { MENU_ITEMS } from "@/content/site-map";
import type { PhoneLink } from "@/core/contact";
import { cn } from "@/components/ui/cn";
import { HydrateLater } from "@/components/ui/hydrate-later";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import { CallLink, PrimaryLink, WhatsAppLink } from "./actions";
import styles from "./shell.module.css";

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

/** Plan de la ville la nuit, vu d'en haut : rues, Seine, lampadaires. Décor, sans texte. */
function NightPlan() {
  return (
    <svg className={styles.plan} viewBox="0 0 400 760" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <path
        d="M420 118C330 150 300 238 238 270S96 300 40 376-20 520 30 600"
        fill="none"
        stroke="var(--color-water)"
        strokeWidth="22"
        strokeLinecap="round"
        opacity="0.55"
      />
      <g fill="none" stroke="var(--color-night-800)" strokeLinecap="round">
        <path d="M-10 70 420 210M60-10l120 780M300-10 220 770M-10 520l420-90M-10 690l420-160" strokeWidth="9" />
        <path
          d="M140-10 70 300l60 470M380 40 250 400l120 370M-10 300 410 330M20 140l380 330M-10 440l250-40 170 200"
          strokeWidth="4"
        />
      </g>
      <g fill="none" stroke="var(--color-night-950)" strokeLinecap="round" strokeWidth="2.5">
        <path d="M-10 70 420 210M60-10l120 780M300-10 220 770M-10 520l420-90M-10 690l420-160" />
      </g>
      {/* Lampadaires au sodium le long des grands axes. */}
      <g fill="var(--color-sodium)">
        {[
          [96, 101], [168, 125], [240, 148], [312, 172], [84, 132], [100, 236], [116, 340], [131, 444], [147, 548],
          [292, 52], [279, 150], [266, 250], [252, 350], [239, 450], [226, 550], [60, 509], [160, 488], [260, 466],
          [360, 445], [80, 663], [190, 621], [300, 579],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />
        ))}
      </g>
      <g fill="var(--color-sodium)" opacity="0.18">
        {[
          [168, 125], [116, 340], [266, 250], [160, 488], [300, 579],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="14" />
        ))}
      </g>
    </svg>
  );
}

export function MobileMenu({ phone, whatsapp }: { phone: PhoneLink | null; whatsapp: PhoneLink | null }) {
  const pathname = usePathname();
  const menuRef = useRef<HTMLDetailsElement>(null);

  // Changement de page : le menu se referme (aucun état React, simple attribut du <details>).
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  // Échap ferme le menu et rend le focus au bouton.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const menu = menuRef.current;
      if (event.key !== "Escape" || !menu?.open) return;
      menu.open = false;
      menu.querySelector("summary")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Focus sorti du menu ouvert (Tab après le dernier lien) : il partait sur les liens de la page,
  // cachés derrière le panneau fixe (focus invisible, page qui défile derrière). Le menu se ferme
  // et le focus continue, visible, dans la page. `relatedTarget` nul (clic sur le fond du panneau,
  // fenêtre quittée) : le menu reste ouvert.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (!menu.open || !(next instanceof Node) || menu.contains(next)) return;
      menu.open = false;
    };
    menu.addEventListener("focusout", onFocusOut);
    return () => menu.removeEventListener("focusout", onFocusOut);
  }, []);

  const close = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <details ref={menuRef} data-menu className={cn(styles.menu, "group lg:hidden")}>
      <summary className={styles.menuButton}>
        <span className="sr-only group-open:hidden">Ouvrir le menu</span>
        <span className="sr-only hidden group-open:inline">Fermer le menu</span>
        <span className={styles.burger} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </summary>

      {/* Panneau (fermé au chargement) hydraté après la page, par tranches : le bouton, lui, l'est
          tout de suite. Un lien touché avant est hydraté sur-le-champ et son clic rejoué. */}
      <HydrateLater>
        <div className={styles.panel}>
          <NightPlan />
          <nav aria-label="Menu" className={styles.menuNav}>
            <ol className={styles.menuList}>
              {MENU_ITEMS.map((item, index) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} style={{ "--i": index } as React.CSSProperties}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={styles.menuLink}
                    >
                      <span className={styles.stop} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className={cn(styles.menuTitle, "font-sign block")}>{item.label}</span>
                        <span className={cn(styles.menuHelp, "block text-asphalt-200")}>{item.help}</span>
                      </span>
                      <Icon name="chevronRight" size={20} strokeWidth={2.4} className={styles.menuChevron} />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className={styles.menuActions}>
            <PrimaryLink href="/demande" size="md" className={cn(styles.menuPrimary, "w-full")}>
              Demander un dépannage
            </PrimaryLink>
            <div className={cn(styles.menuCalls, "grid grid-cols-2 gap-3")}>
              <CallLink phone={phone} label="short" missing="plain" size="sm" className="w-full" />
              {whatsapp ? (
                <WhatsAppLink whatsapp={whatsapp} size="sm" className="w-full" />
              ) : (
                <Link
                  href="/contact"
                  onClick={close}
                  className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-2xl font-extrabold text-whatsapp shadow-[inset_0_0_0_1.5px_rgb(37_211_102_/_0.45)]"
                >
                  <WhatsAppIcon size={17} />
                  WhatsApp
                </Link>
              )}
            </div>
          </div>
        </div>
      </HydrateLater>
    </details>
  );
}
