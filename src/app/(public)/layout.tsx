import { MotionHeadScript } from "@/components/motion/motion-head-script";
import { MotionRuntime } from "@/components/motion/motion-runtime";
import { NightSky } from "@/components/motion/night-sky";
import { ActionBar } from "@/components/public/action-bar";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicSiteInfo } from "@/server/site/public-info";

// Les pages publiques sont générées à l'avance (rapides), puis rafraîchies toutes les 5 minutes
// ou immédiatement après une modification dans l'administration.
export const revalidate = 300;

/**
 * Coque du site public (docs/09, D.1). Ordre de superposition :
 * lien d'évitement (z 70) · barre d'action (z 60) · menu (z 55, dans l'en-tête) · en-tête (z 50) ·
 * contenu et pied de page (z 10) · ciel (z 0). Seul le contenu de chaque page (enveloppe
 * `PageTransition` dans `page.tsx`) participe à la transition : l'en-tête, la barre d'action et le
 * ciel restent vivants et cliquables. L'en-tête est placé avant MotionRuntime : son cycle de page
 * passe avant celui du runtime (voir site-header.tsx).
 */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
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
