import type { Metadata } from "next";
import { HOME_FAQ } from "@/components/home/sections";
import { JsonLd } from "@/components/public/json-ld";
import { CtaBand, PageHero, Section } from "@/components/public/page-blocks";
import { Icon } from "@/components/ui/icon";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: "Prix, délais, autoroute, véhicules acceptés, paiement : les réponses aux questions les plus fréquentes sur le dépannage RNB AUTO.",
  alternates: { canonical: "/questions-frequentes" },
};

const MORE_FAQ = [
  {
    q: "Comment est calculé le prix ?",
    a: "Le prix tient compte du trajet réel de la dépanneuse calculé sur les routes, du type de véhicule, de la situation (non roulant, parking…) et de l'horaire (nuit, dimanche, jour férié). Vous voyez l'estimation avant d'envoyer votre demande.",
  },
  {
    q: "Dois-je être présent au moment de l'intervention ?",
    a: "C'est préférable, notamment pour remettre les clés et vérifier ensemble l'état du véhicule. Si ce n'est pas possible, dites-le nous à la demande : nous trouverons une solution ensemble.",
  },
  {
    q: "Pourquoi le site demande-t-il ma position ?",
    a: "Uniquement pour calculer la distance et savoir où envoyer la dépanneuse. La position n'est demandée que si vous appuyez sur « Utiliser ma position ». Vous pouvez aussi saisir l'adresse vous-même.",
  },
  {
    q: "Quels véhicules pouvez-vous transporter ?",
    a: "Citadines, berlines, breaks, SUV, 4x4, utilitaires et petits fourgons. Pour les plus grands véhicules, nous vérifions avec vous que le transport est possible avant de vous donner un prix.",
  },
  {
    q: "Puis-je envoyer des photos ?",
    a: "Oui : juste après votre demande, vous pouvez ajouter des photos depuis votre téléphone, ou nous les envoyer sur WhatsApp. Elles nous aident à venir avec le bon matériel et restent privées.",
  },
  {
    q: "Le prix peut-il changer sur place ?",
    a: "Seulement si la situation est différente de ce qui a été décrit (véhicule bloqué, accès compliqué…). Dans ce cas, nous vous expliquons pourquoi et vous annonçons le nouveau prix avant d'intervenir.",
  },
  {
    q: "Que faire si je ne peux pas utiliser le site ?",
    a: "Appelez-nous ou écrivez-nous sur WhatsApp : les boutons sont toujours visibles en bas de l'écran de votre téléphone.",
  },
];

const ALL_FAQ = [...HOME_FAQ, ...MORE_FAQ];

export default async function FaqPage() {
  const info = await getPublicSiteInfo();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: ALL_FAQ.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }}
      />
      <PageHero
        eyebrow="Questions fréquentes"
        icon="question"
        title={
          <>
            Vos questions, <span className="text-signal-500">nos réponses.</span>
          </>
        }
        lead="Une question qui n'est pas dans la liste ? Appelez-nous ou écrivez-nous sur WhatsApp."
      />
      <Section tone="darker">
        <div className="mx-auto max-w-4xl divide-y divide-white/10 border-y border-white/10">
          {ALL_FAQ.map((item, index) => (
            <details key={item.q} className="group py-2" data-reveal style={{ "--reveal-delay": `${(index % 4) * 60}ms` } as React.CSSProperties}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-xl font-bold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 transition-transform duration-300 group-open:rotate-45 group-open:border-signal-500 group-open:text-signal-500">
                  <Icon name="plus" size={20} />
                </span>
              </summary>
              <p className="pb-5 pr-12 text-lg leading-relaxed text-asphalt-300">{item.a}</p>
            </details>
          ))}
        </div>
      </Section>
      <CtaBand info={info} />
    </>
  );
}
