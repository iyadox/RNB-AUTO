/**
 * Coque publique pour la 404 racine (`src/app/not-found.tsx`) : une adresse inconnue est rendue
 * hors du groupe `(public)`, donc sans son layout. Même composition et même ordre que
 * `src/app/(public)/layout.tsx` (docs/09, D.1), sans le modifier.
 */
import type { ReactElement, ReactNode } from "react";
import { MotionHeadScript } from "@/components/motion/motion-head-script";
import { MotionRuntime } from "@/components/motion/motion-runtime";
import { NightSky } from "@/components/motion/night-sky";
import { ActionBar } from "@/components/public/action-bar";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicSiteInfo } from "@/server/site/public-info";

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
