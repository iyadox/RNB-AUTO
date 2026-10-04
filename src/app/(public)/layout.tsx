import { ActionBar } from "@/components/public/action-bar";
import { PageMotion } from "@/components/public/page-motion";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { getPublicSiteInfo } from "@/server/site/public-info";

// Les pages publiques sont générées à l'avance (rapides), puis rafraîchies toutes les 5 minutes
// ou immédiatement après une modification dans l'administration.
export const revalidate = 300;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const info = await getPublicSiteInfo();
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-[60] rounded-full bg-signal-500 px-4 py-2 font-bold text-asphalt-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Aller au contenu
      </a>
      <SiteHeader phone={info.phone} announcement={info.announcement} />
      <main id="contenu" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter info={info} />
      <ActionBar phone={info.phone} whatsapp={info.whatsapp} />
      <PageMotion />
    </>
  );
}
