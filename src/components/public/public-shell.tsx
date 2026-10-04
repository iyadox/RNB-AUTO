/**
 * Coque du site public (docs/09, D.1), partagée par `src/app/(public)/layout.tsx` et par la 404
 * racine (`src/app/not-found.tsx`) : une adresse inconnue est rendue hors du groupe `(public)`,
 * donc sans son layout. Une seule composition, un seul ordre.
 *
 * Ordre de superposition : lien d'évitement (z 70) · barre d'action (z 60) · menu (z 55, dans
 * l'en-tête) · en-tête (z 50) · contenu et pied de page (z 10) · ciel (z 0). Seul le contenu de
 * chaque page (enveloppe `PageTransition`) participe à la transition : l'en-tête, la barre
 * d'action et le ciel restent vivants et cliquables. L'en-tête est placé avant MotionRuntime :
 * son cycle de page passe avant celui du runtime (voir site-header.tsx).
 */
import type { ReactElement, ReactNode } from "react";
import { MotionHeadScript } from "@/components/motion/motion-head-script";
import { MotionRuntime } from "@/components/motion/motion-runtime";
import { NightSky } from "@/components/motion/night-sky";
import { getPublicSiteInfo } from "@/server/site/public-info";
import { ActionBar } from "./action-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export async function PublicShell({ children }: { children: ReactNode }): Promise<ReactElement> {
  const info = await getPublicSiteInfo();
  return (
    <>
      <MotionHeadScript />
      <a
        href="#contenu"
        className="sr-only z-[70] rounded-2xl bg-signal-500 px-5 py-3 font-bold text-asphalt-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <NightSky />
      <SiteHeader phone={info.phone} whatsapp={info.whatsapp} announcement={info.announcement} />
      <main id="contenu" className="relative z-10 min-h-[60vh]">
        {children}
      </main>
      <SiteFooter info={info} />
      <ActionBar phone={info.phone} whatsapp={info.whatsapp} />
      <MotionRuntime />
    </>
  );
}
