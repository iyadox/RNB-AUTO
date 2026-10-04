/**
 * Pied de page « Retour au dépôt » (docs/09, D.8) : la fin de chaque page, c'est le lever du jour
 * au dépôt. Le troisième trajet de la dépanneuse (le retour, en pointillé gris) se termine ici.
 *
 * Scène (décor, `aria-hidden`) : aube locale sur l'horizon de la ville, soleil qui se lève au
 * défilement, dépôt RNB AUTO ; la dépanneuse VIDE, en miroir, arrive par la droite et se gare
 * devant le dépôt ; une fois garée, gyrophare et phares s'éteignent, puis le rideau descend.
 * Le tout est déclenché une seule fois par page, quand l'horizon entre dans l'écran (`data-play`,
 * posé et réarmé à chaque navigation par l'en-tête : le pied de page appartient au layout, le
 * runtime ne le rejoue pas). Sans JavaScript et en « moins d'animations » : état final
 * (dépanneuse garée, feux éteints, rideau fermé, « RNB AUTO » doré).
 *
 * Contenu : colonnes de liens, téléphone, WhatsApp, dépôt, zone, email (« À COMPLÉTER » si le
 * téléphone ou l'email manquent), bouton « Arrêter les animations », mention sur les prix.
 * Aucune case à cocher. Aucun titre de niveau 1.
 */
import Link from "next/link";
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
import { ToComplete } from "./page-blocks";
import styles from "./shell.module.css";

/** La scène du retour : une seule ligne de temps, déclenchée par l'entrée de l'horizon dans l'écran. */
function ReturnToDepot() {
  return (
    <div className={styles.horizon} data-play-on-view aria-hidden="true">
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
    </div>
  );
}

const linkClass = cn(
  "inline-flex min-h-12 items-center text-body text-asphalt-200 transition-colors duration-(--dur-ui) hover:text-chalk",
  "underline-offset-[6px] decoration-signal-500 decoration-2 hover:underline",
);

export function SiteFooter({ info }: { info: PublicSiteInfo }) {
  const year = new Date().getFullYear();
  return (
    <footer data-depot-footer data-sky="aube" className={cn(styles.footer, "relative z-10")}>
      <div className="chevrons h-1.5 w-full opacity-90" aria-hidden="true" />

      {/* Légende au-dessus de la bande d'horizon, sur le violet : le troisième trajet. */}
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8 lg:pt-20">
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
        {/* « RNB AUTO » en contour ; un remplissage doré monte une fois (décor). */}
        <div className={styles.wordmark} data-play-on-view aria-hidden="true">
          <span className={styles.wordOutline}>RNB AUTO</span>
          <span className={styles.wordFill}>RNB AUTO</span>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 pt-4 lg:grid-cols-12 lg:gap-8 lg:pt-8">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3">
                <LogoMark className="h-11 w-11" />
                <div>
                  <p className="font-wide text-xl text-chalk">RNB AUTO</p>
                  <p className="text-small text-asphalt-300">Dépannage · Remorquage · Assistance</p>
                </div>
              </div>

              <div className="mt-8">
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
                    className="mt-4 inline-flex min-h-12 items-center gap-2.5 rounded-2xl px-4 font-bold text-whatsapp shadow-[inset_0_0_0_1.5px_rgb(37_211_102_/_0.45)] transition-shadow hover:shadow-[inset_0_0_0_1.5px_var(--color-whatsapp)]"
                  >
                    <WhatsAppIcon size={19} />
                    Écrire sur WhatsApp
                  </a>
                ) : null}
              </div>

              <dl className="mt-8 grid gap-4 text-body">
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
                  <dd className="min-w-0 text-asphalt-200">
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

            <nav aria-label="Plan du site" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.title}>
                  <p className="font-plate text-plate text-signal-500">{column.title}</p>
                  <ul className="mt-4 grid gap-1">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className={linkClass}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
