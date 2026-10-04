import type { Metadata } from "next";
import { ZoneRadar } from "@/components/home/sections";
import { CtaBand, PageHero, Section } from "@/components/public/page-blocks";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Zones d'intervention : Bobigny, Seine-Saint-Denis, Paris, Île-de-France",
  description:
    "RNB AUTO intervient depuis Bobigny dans toute la Seine-Saint-Denis, à Paris et en Île-de-France. Votre distance et votre prix sont calculés en ligne.",
  alternates: { canonical: "/zones-d-intervention" },
};

const AREAS: { title: string; text: string; places: string[] }[] = [
  {
    title: "Seine-Saint-Denis (93)",
    text: "Notre département, au départ de Bobigny.",
    places: [
      "Bobigny",
      "Drancy",
      "Pantin",
      "Bondy",
      "Noisy-le-Sec",
      "Romainville",
      "Les Lilas",
      "Le Pré-Saint-Gervais",
      "Aubervilliers",
      "La Courneuve",
      "Saint-Denis",
      "Saint-Ouen",
      "Le Blanc-Mesnil",
      "Aulnay-sous-Bois",
      "Sevran",
      "Livry-Gargan",
      "Les Pavillons-sous-Bois",
      "Montreuil",
      "Bagnolet",
      "Rosny-sous-Bois",
      "Villemomble",
      "Noisy-le-Grand",
      "Épinay-sur-Seine",
      "Stains",
      "Villepinte",
      "Tremblay-en-France",
    ],
  },
  {
    title: "Paris",
    text: "Tous les arrondissements de Paris.",
    places: ["Paris 10e", "Paris 11e", "Paris 12e", "Paris 18e", "Paris 19e", "Paris 20e", "et tous les autres arrondissements"],
  },
  {
    title: "Petite couronne",
    text: "Hauts-de-Seine (92) et Val-de-Marne (94).",
    places: ["Créteil", "Vincennes", "Fontenay-sous-Bois", "Nogent-sur-Marne", "Ivry-sur-Seine", "Vitry-sur-Seine", "Nanterre", "Colombes", "Gennevilliers", "Boulogne-Billancourt"],
  },
  {
    title: "Grande couronne",
    text: "Val-d'Oise (95), Seine-et-Marne (77), Yvelines (78), Essonne (91).",
    places: ["Roissy", "Argenteuil", "Cergy", "Meaux", "Chelles", "Marne-la-Vallée", "Versailles", "Évry"],
  },
];

export default async function ZonesPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <PageHero
        eyebrow="Zones d'intervention"
        icon="pin"
        title={
          <>
            Depuis Bobigny, <span className="text-signal-500">toute l&apos;Île-de-France.</span>
          </>
        }
        lead={`Notre dépanneuse part de ${info.depotLabel}. Indiquez votre position dans la demande en ligne : la distance réelle et le prix sont calculés immédiatement.`}
      />

      <ZoneRadar info={info} />

      <Section tone="darker" eyebrow="Communes et secteurs" title="Où intervenons-nous ?">
        <div className="grid gap-4 lg:grid-cols-2">
          {AREAS.map((area, index) => (
            <div
              key={area.title}
              data-reveal
              style={{ "--reveal-delay": `${(index % 2) * 90}ms` } as React.CSSProperties}
              className="rounded-3xl border border-white/10 bg-asphalt-850 p-7"
            >
              <h3 className="text-2xl font-extrabold">{area.title}</h3>
              <p className="mt-1 text-asphalt-300">{area.text}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {area.places.map((place) => (
                  <li key={place} className="rounded-full border border-white/10 bg-asphalt-800 px-3 py-1.5 text-sm font-semibold text-asphalt-100">
                    {place}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-asphalt-300" data-reveal>
          Plus loin, ou sur un trajet long ? Envoyez quand même votre demande : nous vous rappelons pour vous donner un prix
          précis et un délai réaliste. Sur les autoroutes et voies rapides, l&apos;intervention revient au dépanneur agréé du
          secteur ; nous pouvons ensuite prendre le relais.
        </p>
      </Section>

      <CtaBand info={info} />
    </>
  );
}
