import type { Metadata } from "next";
import Link from "next/link";
import { CtaBand, PageHero, Section } from "@/components/public/page-blocks";
import { Icon } from "@/components/ui/icon";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Panne sur autoroute : que faire ?",
  description:
    "Panne sur l'autoroute ou une voie rapide : les bons réflexes de sécurité, qui peut intervenir, et comment RNB AUTO prend le relais une fois votre véhicule sorti de l'autoroute.",
  alternates: { canonical: "/panne-autoroute" },
};

const SAFETY = [
  { title: "Feux de détresse", text: "Allumez-les immédiatement et garez-vous le plus à droite possible, sur la bande d'arrêt d'urgence." },
  { title: "Gilet avant de sortir", text: "Enfilez votre gilet jaune dans le véhicule, puis sortez du côté opposé à la circulation." },
  { title: "Derrière la glissière", text: "Faites passer tous les passagers derrière la glissière de sécurité. Ne restez jamais dans le véhicule ni devant." },
  { title: "Appelez les secours", text: "Utilisez une borne orange d'appel d'urgence (tous les 2 km) ou composez le 112. Ils envoient le dépanneur agréé." },
];

export default async function HighwayPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <PageHero
        eyebrow="Panne sur autoroute"
        icon="alert"
        title={
          <>
            Votre sécurité <span className="text-signal-500">d&apos;abord.</span>
          </>
        }
        lead={info.regulatedRoads.message}
      />

      <Section eyebrow="Les bons réflexes" title="Que faire tout de suite ?">
        <ol className="grid gap-4 md:grid-cols-2">
          {SAFETY.map((item, index) => (
            <li
              key={item.title}
              data-reveal
              style={{ "--reveal-delay": `${(index % 2) * 90}ms` } as React.CSSProperties}
              className="flex gap-5 rounded-3xl border border-white/10 bg-asphalt-850 p-6"
            >
              <span className="font-display flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-signal-500 text-3xl text-asphalt-950">
                {index + 1}
              </span>
              <div>
                <h3 className="text-xl font-extrabold">{item.title}</h3>
                <p className="mt-1 text-asphalt-300">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="darker" eyebrow="Qui intervient ?" title="Le dépanneur agréé, puis RNB AUTO">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              icon: "road" as const,
              title: "Sur l'autoroute",
              text: "Seul le dépanneur agréé pour ce secteur peut intervenir sur la voie. Le tarif est fixé par la réglementation.",
            },
            {
              icon: "flag" as const,
              title: "À la sortie",
              text: "Il sort votre véhicule de l'autoroute et le dépose à son dépôt ou à un point hors de la zone réglementée.",
            },
            {
              icon: "truck" as const,
              title: "RNB AUTO prend le relais",
              text: "Nous récupérons votre véhicule à cet endroit et l'emmenons au garage, chez vous ou à l'adresse de votre choix.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              data-reveal
              style={{ "--reveal-delay": `${index * 100}ms` } as React.CSSProperties}
              className="relative rounded-3xl border border-white/10 bg-asphalt-850 p-7"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-500 text-asphalt-950">
                <Icon name={item.icon} size={24} />
              </span>
              <h3 className="mt-5 text-xl font-extrabold">{item.title}</h3>
              <p className="mt-2 text-asphalt-300">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-3xl border border-signal-500/40 bg-signal-500/10 p-7" data-reveal>
          <h3 className="text-2xl font-extrabold text-signal-400">Votre véhicule est sorti de l&apos;autoroute ?</h3>
          <p className="mt-2 max-w-2xl text-lg text-asphalt-200">
            Faites votre demande en indiquant la sortie ou l&apos;adresse où se trouve votre véhicule : nous calculons le prix à
            partir de ce point.
          </p>
          <Link
            href="/demande?autoroute=1"
            className="mt-6 inline-flex h-14 items-center gap-2 rounded-2xl bg-signal-500 px-6 font-extrabold text-asphalt-950"
          >
            Demander le relais
            <Icon name="arrowRight" size={20} strokeWidth={2.6} />
          </Link>
        </div>
      </Section>

      <CtaBand info={info} title="Besoin d'un relais après l'autoroute ?" />
    </>
  );
}
