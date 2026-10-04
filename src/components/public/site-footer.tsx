"use client";

/**
 * Pied de page « Retour au dépôt » (docs/09, D.8) : la fin de chaque page, c'est le lever du jour
 * au dépôt. Le troisième trajet de la dépanneuse (le retour, en pointillé gris) se termine ici.
 *
 * Scène (décor, `aria-hidden`) : dépôt RNB AUTO ; la dépanneuse VIDE, en miroir, arrive par la
 * droite et se gare devant le dépôt ; une fois garée, gyrophare et phares s'éteignent, puis le
 * rideau descend. Le tout est déclenché une seule fois par page, quand la bande entre dans
 * l'écran (`data-play`, posé et réarmé à chaque navigation par l'en-tête : le pied de page
 * appartient au layout, le runtime ne le rejoue pas). Sans JavaScript et en « moins
 * d'animations » : état final (dépanneuse garée, feux éteints, rideau fermé).
 *
 * Un seul horizon par fin de page : quand l'aube (`DawnCta`) précède le pied de page, c'est elle
 * qui porte la ville, l'aube et le soleil ; ici, ni ciel, ni ville, ni soleil, ni chevrons : le
 * dépôt et la dépanneuse qui rentre, au pied de la même route (CSS, `body:has([data-dawn-cta])`).
 * Sans aube (/contact, /demande, pages légales, 404) : la bande complète, avec son aube locale.
 *
 * Contenu : téléphone, WhatsApp, dépôt, zone, email (« À COMPLÉTER » si le téléphone ou l'email
 * manquent), plan du site, bouton « Arrêter les animations », mention sur les prix. Aucune case à
 * cocher. Aucun titre de niveau 1. Sur téléphone, tout est resserré (le pied de page faisait
 * 2,2 écrans) : plan du site replié (`<details>`), et le grand « RNB AUTO » en contour n'est
 * affiché qu'à partir de 1 024 px.
 *
 * Composant client : il est recopié deux fois dans la charge RSC de chaque page (layout public et
 * 404 racine) ; en client, la charge ne contient plus que ses propriétés. Rendu serveur inchangé :
 * liens et boutons fonctionnent sans JavaScript. Les dessins du dépôt et de la dépanneuse (environ
 * 140 éléments) ne sont montés qu'à l'approche du pied de page ; sans JavaScript, ils sont dans un
 * `<noscript>` (état final).
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FOOTER_COLUMNS } from "@/content/site-map";
import { whatsappHref, whatsappRequestMessage } from "@/core/contact";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { TowTruck } from "@/components/brand/tow-truck";
import { LogoMark } from "@/components/brand/logo";
import { MotionToggle } from "@/components/motion/motion-toggle";
import { Depot } from "@/components/scenes/base/depot";
import { Skyline } from "@/components/scenes/base/skyline";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import { prefetchOnIntent } from "./prefetch-on-intent";
import { ToComplete } from "./to-complete";
import styles from "./shell.module.css";

/** Dépôt et dépanneuse du retour (les deux dessins les plus lourds de la coque). */
function DepotAndTruck() {
  return (
    <>
      <div className={styles.depotSlot}>
        <Depot shutter="closed" />
      </div>
      <div className={styles.truckLane}>
        <div className={styles.truckMover}>
          <div className={styles.truck}>
            <TowTruck mirrored headlights parts id="footer-return-truck" />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * La scène du retour : une seule ligne de temps, déclenchée par l'entrée de la bande dans l'écran.
 * Les dessins sont montés un écran avant (ils sont prêts bien avant `data-play`).
 */
function ReturnToDepot() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const band = ref.current;
    if (!band || near) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(band);
    return () => observer.disconnect();
  }, [near]);

  return (
    <div ref={ref} className={styles.horizon} data-play-on-view aria-hidden="true">
      <div className={styles.dawn} />
      <div className={styles.sun} />
      <Skyline layer="far" className={styles.skyline} />
      <div className={styles.groundBand}>
        <span className={styles.roadEdge} />
        <span className={styles.roadDash} />
        <span className={styles.sunReflection} />
      </div>
      {/* Trace du retour (pointillé gris, P10 « retour ») : elle suit la dépanneuse. */}
      <div className={styles.returnTrail} />
      {near ? (
        <DepotAndTruck />
      ) : (
        <noscript>
          <DepotAndTruck />
        </noscript>
      )}
    </div>
  );
}

const linkClass = cn(
  "inline-flex min-h-11 items-center text-[0.9375rem] leading-snug text-asphalt-200 transition-colors duration-(--dur-ui) hover:text-chalk sm:min-h-12 sm:text-body",
  "underline-offset-[6px] decoration-signal-500 decoration-2 hover:underline",
);

/** Lien du plan du site : pas de préchargement à l'affichage (tout le plan du site, avec le JavaScript
 *  et les styles de chaque page, à l'arrivée du pied de page) ; au survol ou au focus seulement. */
function SiteMapLink({ href, children }: { href: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Link href={href} prefetch={false} {...prefetchOnIntent(router, href)} className={linkClass}>
      {children}
    </Link>
  );
}

export function SiteFooter({ info, year }: { info: PublicSiteInfo; year: number }) {
  return (
    <footer data-depot-footer data-sky="aube" className={cn(styles.footer, "relative z-10")}>
      <div className={cn("chevrons h-1.5 w-full opacity-90", styles.footerChevrons)} aria-hidden="true" />

      {/* Légende au-dessus de la bande : le troisième trajet. */}
      <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", styles.captionWrap)}>
        <p className={styles.returnCaption}>
          <span className={styles.captionPlate}>
            <span className={styles.captionPost} aria-hidden="true" />
            <span className="font-plate text-plate text-signal-500">Retour au dépôt</span>
          </span>{" "}
          <span className="text-asphalt-300" aria-hidden="true">
            {" · "}
          </span>
          <span className="text-small text-asphalt-200">{info.depotLabel}</span>
        </p>
      </div>

      <ReturnToDepot />

      <div className={styles.footerGround}>
        {/* « RNB AUTO » en contour ; un remplissage doré monte une fois (décor, ordinateur seulement :
            sur téléphone, il doublait la signature du logo juste en dessous). */}
        <div className={styles.wordmark} data-play-on-view aria-hidden="true">
          <span className={styles.wordOutline}>RNB AUTO</span>
          <span className={styles.wordFill}>RNB AUTO</span>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-9 pt-2 sm:gap-12 lg:grid-cols-12 lg:gap-8 lg:pt-8">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <LogoMark className="h-11 w-11" />
                <div>
                  <p className="font-wide text-xl text-chalk">RNB AUTO</p>
                  <p className="text-small text-asphalt-300">Dépannage · Remorquage · Assistance</p>
                </div>
              </div>

              <div className="mt-5 sm:mt-8">
                {info.phone ? (
                  <a href={info.phone.href} className={cn(styles.footerPhone, "group")}>
                    <span className={styles.phoneDot}>
                      <Icon name="phone" size={20} strokeWidth={2.4} />
                    </span>
                    <span className="font-figure text-[clamp(1.9rem,1.4rem+1.8vw,2.6rem)] leading-none text-chalk transition-colors group-hover:text-signal-400">
                      {info.phone.display}
                    </span>
                  </a>
                ) : (
                  <p className="text-body text-asphalt-200">
                    <ToComplete label="numéro de téléphone" />
                  </p>
                )}
                {info.whatsapp ? (
                  <a
                    href={whatsappHref(info.whatsapp.e164, whatsappRequestMessage({}))}
                    className="mt-3 inline-flex min-h-12 items-center gap-2.5 rounded-2xl px-4 font-bold text-whatsapp shadow-[inset_0_0_0_1.5px_rgb(37_211_102_/_0.45)] transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--color-whatsapp)] sm:mt-4"
                  >
                    <WhatsAppIcon size={19} />
                    Écrire sur WhatsApp
                  </a>
                ) : null}
              </div>

              <dl className="mt-6 grid gap-3 text-[0.9375rem] leading-snug sm:mt-8 sm:gap-4 sm:text-body sm:leading-normal">
                <div className="flex gap-3">
                  <dt className="mt-0.5 shrink-0 text-signal-500">
                    <Icon name="pin" size={19} strokeWidth={2.2} />
                    <span className="sr-only">Dépôt</span>
                  </dt>
                  <dd className="text-asphalt-200">{info.depotLabel}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="mt-0.5 shrink-0 text-signal-500">
                    <Icon name="route" size={19} strokeWidth={2.2} />
                    <span className="sr-only">Zone d&apos;intervention</span>
                  </dt>
                  <dd className="text-asphalt-200">{info.serviceArea}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="mt-0.5 shrink-0 text-signal-500">
                    <Icon name="mail" size={19} strokeWidth={2.2} />
                    <span className="sr-only">Email</span>
                  </dt>
                  <dd className="min-w-0 flex-1 text-asphalt-200">
                    {info.email ? (
                      <a href={`mailto:${info.email}`} className="break-all hover:text-chalk">
                        {info.email}
                      </a>
                    ) : (
                      <ToComplete label="email" />
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Plan du site. Téléphone : replié derrière « Plan du site » (`<details>` natif, sans
                JavaScript) ; il occupait plus d'un tiers d'écran de liens en texte brut. À partir de
                640 px : toujours déplié, sans le bouton (CSS). */}
            <nav aria-label="Plan du site" className={styles.siteMapNav}>
              <details className={styles.siteMapDetails}>
                <summary className={styles.siteMapSummary}>
                  <span className="font-plate text-plate text-signal-500">Plan du site</span>
                  <span className={styles.siteMapToggle} aria-hidden="true" />
                </summary>
                <div className={styles.siteMap}>
                  {FOOTER_COLUMNS.map((column) => (
                    <div key={column.title}>
                      <p className="font-plate text-plate text-signal-500">{column.title}</p>
                      <ul className="mt-2 grid sm:mt-4 sm:gap-1">
                        {column.links.map((link) => (
                          <li key={link.href}>
                            <SiteMapLink href={link.href}>{link.label}</SiteMapLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            </nav>
          </div>

          <div className={styles.footerBase}>
            <MotionToggle />
            <div className="grid gap-1.5 text-small text-asphalt-300 lg:ml-auto lg:text-right">
              <p>Les prix affichés en ligne sont des estimations, confirmées avant chaque intervention.</p>
              <p>© {year} RNB AUTO. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
