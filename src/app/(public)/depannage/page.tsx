import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, FeatureGrid, PageHero, Section, Steps } from "@/components/public/page-blocks";
import { Icon } from "@/components/ui/icon";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Dépannage automobile sur place à Bobigny et en Île-de-France",
  description:
    "Batterie à plat, crevaison, petite panne : RNB AUTO intervient sur place quand c'est possible, sinon remorque votre véhicule. Prix estimé en ligne en moins d'une minute.",
  alternates: { canonical: "/depannage" },
};

export default async function DepannagePage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <PageHero
        eyebrow="Dépannage sur place"
        icon="wrench"
        title={
          <>
            On vous remet <span className="text-signal-500">sur la route.</span>
          </>
        }
        lead="Batterie à plat, crevaison, petite panne : quand le problème peut se régler sur place, nous intervenons directement. Sinon, votre véhicule est remorqué là où vous le souhaitez."
      >
        <Link href="/demande" className="inline-flex h-14 items-center gap-2 rounded-2xl bg-signal-500 px-6 font-extrabold text-asphalt-950">
          Estimer mon dépannage
          <Icon name="arrowRight" size={20} strokeWidth={2.6} />
        </Link>
      </PageHero>

      <Section eyebrow="Les situations courantes" title="Ce que nous réglons sur place">
        <FeatureGrid
          items={[
            {
              icon: "battery",
              title: "Batterie à plat",
              text: "Démarrage avec un booster professionnel. Si la batterie est hors d'usage, nous vous conseillons pour la suite.",
            },
            {
              icon: "tire",
              title: "Crevaison",
              text: "Montage de votre roue de secours. Sans roue de secours, ou si la jante est abîmée, nous emmenons le véhicule.",
            },
            {
              icon: "engine",
              title: "Petite panne",
              text: "Nous évaluons la situation sur place. Si la réparation n'est pas possible au bord de la route, nous remorquons.",
            },
            {
              icon: "parking",
              title: "Véhicule en parking",
              text: "Parking souterrain, résidence, centre commercial : indiquez-le, nous venons préparés à l'accès.",
            },
            {
              icon: "access",
              title: "Accès difficile",
              text: "Ruelle, pente, véhicule mal placé : décrivez la situation pour que nous arrivions avec le bon matériel.",
            },
            {
              icon: "question",
              title: "Autre problème",
              text: "Vous ne savez pas ce qui se passe ? Décrivez ce que vous voyez, nous vous rappelons pour en parler.",
            },
          ]}
        />
      </Section>

      <Section tone="darker" eyebrow="Comment ça se passe" title="Quatre étapes, aucune surprise">
        <Steps
          steps={[
            { title: "Vous décrivez la panne", text: "En ligne, par téléphone ou sur WhatsApp, en quelques secondes." },
            { title: "Vous voyez le prix", text: "L'estimation tient compte de la distance, de l'horaire et de la situation." },
            { title: "Nous confirmons", text: "Nous vous rappelons pour valider le prix et l'heure d'arrivée." },
            { title: "Nous intervenons", text: "Sur place si c'est possible, sinon votre véhicule est remorqué." },
          ]}
        />
      </Section>

      <Section eyebrow="Bon à savoir" title="Si la réparation n'est pas possible sur place">
        <div className="grid gap-8 lg:grid-cols-2">
          <p className="text-lg leading-relaxed text-asphalt-300" data-reveal>
            Certaines pannes ne se réparent pas au bord de la route. Dans ce cas, nous vous proposons de remorquer votre
            véhicule vers le garage de votre choix, votre domicile ou toute autre adresse. Le nouveau prix vous est
            annoncé avant de partir.
          </p>
          <Link
            href="/remorquage"
            data-reveal
            className="group flex items-center justify-between gap-6 rounded-3xl border border-white/10 bg-asphalt-850 p-7 transition-colors hover:border-signal-500/60"
          >
            <span>
              <span className="block text-sm font-bold uppercase tracking-[0.2em] text-signal-500">Remorquage</span>
              <span className="mt-2 block text-2xl font-extrabold">Découvrir le remorquage</span>
            </span>
            <Icon name="arrowRight" size={28} className="text-signal-500 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </Section>

      <CtaBand info={info} />
    </>
  );
}
