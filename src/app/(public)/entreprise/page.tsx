import type { Metadata } from "next";
import { TowTruck } from "@/components/brand/tow-truck";
import { CtaBand, FeatureGrid, PageHero, Section } from "@/components/public/page-blocks";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "L'entreprise RNB AUTO",
  description:
    "RNB AUTO, entreprise de dépannage et de remorquage basée à Bobigny. Des prix clairs, un interlocuteur direct, une dépanneuse plateau au service de toute l'Île-de-France.",
  alternates: { canonical: "/entreprise" },
};

export default async function CompanyPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <PageHero
        eyebrow="L'entreprise"
        icon="shield"
        title={
          <>
            RNB AUTO, <span className="text-signal-500">dépannage à Bobigny.</span>
          </>
        }
        lead="Une entreprise de dépannage et de remorquage installée au cœur de la Seine-Saint-Denis, avec une conviction simple : quand on est en panne, on a besoin d'une réponse rapide et d'un prix clair."
      />

      <Section eyebrow="Notre dépanneuse" title="Un plateau prêt à partir">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-5 text-lg leading-relaxed text-asphalt-300" data-reveal>
            <p>
              Notre dépanneuse plateau part de <strong className="text-chalk">{info.depotLabel}</strong>. Le chargement sur
              plateau protège votre véhicule pendant le transport, qu&apos;il roule ou non.
            </p>
            <p>
              Chaque demande est traitée directement par RNB AUTO : la personne qui vous rappelle est celle qui organise
              l&apos;intervention.
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-asphalt-850 p-8" data-reveal data-pause-offscreen>
            <TowTruck loaded moving headlights id="company-truck" />
          </div>
        </div>
      </Section>

      <Section tone="darker" eyebrow="Notre façon de travailler" title="Ce sur quoi vous pouvez compter">
        <FeatureGrid
          items={[
            { icon: "euro", title: "Un prix clair", text: "Une estimation avant la demande, un prix confirmé avant l'intervention." },
            { icon: "phone", title: "Un interlocuteur direct", text: "Vous parlez à RNB AUTO, sans plateforme intermédiaire." },
            { icon: "route", title: "Le vrai trajet", text: "Les distances sont calculées sur les routes, pas à vol d'oiseau." },
            { icon: "shield", title: "Votre véhicule protégé", text: "Chargement soigné sur plateau, état du véhicule vérifié avec vous." },
            { icon: "clock", title: "Une réponse rapide", text: "Appel, WhatsApp ou demande en ligne : nous vous rappelons vite." },
            { icon: "alert", title: "La sécurité d'abord", text: "Sur l'autoroute, nous vous orientons vers le dépanneur agréé puis prenons le relais." },
          ]}
        />
      </Section>

      <CtaBand info={info} />
    </>
  );
}
