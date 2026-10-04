import type { Metadata } from "next";
import { RequestFlow } from "@/components/request/request-flow";
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

export default async function RequestPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [info, catalog, depot, params] = await Promise.all([getPublicSiteInfo(), getPublicCatalog(), depotPoint(), searchParams]);
  return (
    <div className="relative min-h-[100svh] bg-asphalt-950">
      <div className="map-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" aria-hidden="true" />
      <RequestFlow
        catalog={catalog}
        phone={info.phone}
        whatsapp={info.whatsapp}
        regulatedRoads={info.regulatedRoads}
        depot={depot}
        startOnHighway={params.autoroute === "1"}
      />
    </div>
  );
}
