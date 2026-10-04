import type { Metadata } from "next";
import { PageTransition } from "@/components/motion/page-transition";
import { CallLink, WhatsAppLink } from "@/components/public/actions";
import { RequestFlow } from "@/components/request/request-flow";
import { Icon } from "@/components/ui/icon";
import { getDb } from "@/server/db/client";
import { getPublicCatalog } from "@/server/site/catalog";
import { getPublicSiteInfo } from "@/server/site/public-info";
import { getLatestVersion } from "@/server/settings/versions";

export const metadata: Metadata = {
  title: "Demande de dépannage — prix estimé en 1 minute",
  description:
    "Indiquez où vous êtes, où doit aller le véhicule, votre véhicule et le problème : votre prix estimé s'affiche immédiatement. Dépannage et remorquage en Île-de-France.",
  alternates: { canonical: "/demande" },
};

async function depotPoint() {
  try {
    const version = await getLatestVersion(await getDb());
    const depot = version?.snapshot.depot;
    return depot && depot.lat !== null && depot.lng !== null ? { lat: depot.lat, lng: depot.lng } : null;
  } catch {
    return null;
  }
}

/**
 * /demande (docs/09, F.8) : le parcours de demande, habillé en « route de nuit ». Ciel `nuit`,
 * `aube` à l'étape « Demande reçue ». Ni GSAP, ni Lenis, ni halo, ni RoadLine (route calme ; la
 * route des étapes remplace la progression). Sans JavaScript, le bloc ci-dessous oriente vers
 * l'appel et WhatsApp (liens rendus par le serveur).
 */
export default async function RequestPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [info, catalog, depot, params] = await Promise.all([getPublicSiteInfo(), getPublicCatalog(), depotPoint(), searchParams]);
  return (
    <PageTransition>
      <RequestFlow
        catalog={catalog}
        phone={info.phone}
        whatsapp={info.whatsapp}
        regulatedRoads={info.regulatedRoads}
        depot={depot}
        siteDepot={info.depot}
        startOnHighway={params.autoroute === "1"}
        notice={
          <noscript>
            <div className="mb-8 rounded-[6px] border-2 border-beacon-500 bg-night-950/90 p-5">
              <p className="flex items-start gap-3 text-[1.0625rem] font-bold text-chalk">
                <Icon name="alert" size={22} className="mt-0.5 shrink-0 text-beacon-400" />
                Le calcul en ligne a besoin de JavaScript. Appelez-nous ou écrivez-nous sur WhatsApp.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <CallLink phone={info.phone} variant="solid" />
                <WhatsAppLink whatsapp={info.whatsapp} variant="solid" />
              </div>
            </div>
          </noscript>
        }
      />
    </PageTransition>
  );
}
