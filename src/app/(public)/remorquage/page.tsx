import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, FeatureGrid, PageHero, Section } from "@/components/public/page-blocks";
import { Icon } from "@/components/ui/icon";
import { getPublicCatalog } from "@/server/site/catalog";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Remorquage de voiture et d'utilitaire en Île-de-France",
  description:
    "Remorquage sur plateau vers le garage, le domicile ou l'adresse de votre choix. Véhicule non roulant, accidenté, roues bloquées, parking. Prix estimé en ligne.",
  alternates: { canonical: "/remorquage" },
};

export default async function RemorquagePage() {
  const [info, catalog] = await Promise.all([getPublicSiteInfo(), getPublicCatalog()]);
  return (
    <>
      <PageHero
        eyebrow="Remorquage"
        icon="truck"
        title={
          <>
            Votre véhicule, <span className="text-signal-500">où vous voulez.</span>
          </>
        }
        lead="Votre véhicule est chargé sur notre dépanneuse plateau et emmené au garage de votre choix, chez vous ou à toute autre adresse. Le prix tient compte du trajet réel."
      >
        <Link href="/demande" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-signal-500 px-6 font-extrabold text-asphalt-950">
          Estimer mon remorquage
          <Icon name="arrowRight" size={20} strokeWidth={2.6} />
        </Link>
      </PageHero>

      <Section eyebrow="Toutes les situations" title="Roulant, non roulant, accidenté">
        <FeatureGrid
          items={[
            { icon: "nonRolling", title: "Véhicule non roulant", text: "Chargement au treuil sur le plateau, sans forcer la mécanique." },
            { icon: "accident", title: "Après un accident", text: "Véhicule endommagé ou impossible à déplacer : nous adaptons le chargement." },
            { icon: "wheelLock", title: "Roues bloquées", text: "Frein bloqué, boîte automatique, roues abîmées : dites-le nous à la demande." },
            { icon: "parking", title: "Parking et sous-sol", text: "Indiquez s'il s'agit d'un parking : la hauteur et l'accès comptent." },
            { icon: "garage", title: "Vers votre garage", text: "Nous déposons le véhicule chez le garagiste de votre choix, aux horaires d'ouverture." },
            { icon: "home", title: "Chez vous", text: "Votre véhicule peut aussi être déposé à votre domicile ou à toute adresse." },
          ]}
        />
      </Section>

      <Section tone="darker" eyebrow="Véhicules" title="Quel véhicule transportons-nous ?">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.vehicles.map((vehicle, index) => (
            <div
              key={vehicle.code}
              data-reveal
              style={{ "--reveal-delay": `${(index % 3) * 70}ms` } as React.CSSProperties}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-asphalt-850 px-5 py-4"
            >
              <span className="text-lg font-bold">{vehicle.label}</span>
              {vehicle.acceptance === "accepted" ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-whatsapp">
                  <Icon name="checkCircle" size={18} />
                  Prix en ligne
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-signal-400">
                  <Icon name="phone" size={16} />
                  Sur demande
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-asphalt-300" data-reveal>
          Pour les véhicules « sur demande », envoyez votre demande ou appelez-nous : nous vérifions ensemble que le
          transport est possible et vous donnons un prix précis.
        </p>
      </Section>

      <Section eyebrow="Le prix" title="Comment est calculé le prix ?">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5 text-lg leading-relaxed text-asphalt-300" data-reveal>
            <p>
              Le prix dépend du <strong className="text-chalk">trajet réel</strong> de la dépanneuse, calculé sur les
              routes : jusqu&apos;à vous, puis avec votre véhicule jusqu&apos;à la destination.
            </p>
            <p>
              Le type de véhicule, la situation (non roulant, parking…) et l&apos;horaire (nuit, dimanche, jour férié)
              sont aussi pris en compte. Vous voyez une estimation avant d&apos;envoyer votre demande, puis nous la
              confirmons avec vous par téléphone.
            </p>
          </div>
          <ul className="grid gap-3" data-reveal>
            {[
              "Estimation affichée avant toute demande",
              "Prix confirmé avant l'intervention",
              "Supplément éventuel toujours expliqué avant",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 rounded-2xl bg-asphalt-850 px-5 py-4 text-lg font-semibold">
                <Icon name="check" size={20} strokeWidth={3} className="text-signal-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <CtaBand info={info} title="Un véhicule à déplacer ?" />
    </>
  );
}
