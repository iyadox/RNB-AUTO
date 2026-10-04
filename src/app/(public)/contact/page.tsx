import type { Metadata } from "next";
import Link from "next/link";
import { whatsappHref, whatsappRequestMessage } from "@/core/contact";
import { PageHero, Section, ToComplete } from "@/components/public/page-blocks";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import { getPublicSiteInfo } from "@/server/site/public-info";

export const metadata: Metadata = {
  title: "Contact",
  description: "Appelez RNB AUTO, écrivez-nous sur WhatsApp ou faites une demande de dépannage en ligne.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const info = await getPublicSiteInfo();
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.depotLabel)}`;
  return (
    <>
      <PageHero
        eyebrow="Contact"
        icon="phone"
        title={
          <>
            On vous répond <span className="text-signal-500">tout de suite.</span>
          </>
        }
        lead="Le plus rapide : appelez-nous ou écrivez sur WhatsApp. Vous pouvez aussi faire votre demande en ligne et obtenir une estimation immédiate."
      />
      <Section tone="darker">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-asphalt-850 p-7" data-reveal>
            <Icon name="phone" size={28} className="text-signal-500" />
            <h2 className="mt-4 text-2xl font-extrabold">Téléphone</h2>
            {info.phone ? (
              <a href={info.phone.href} className="mt-3 block text-3xl font-extrabold tabular text-signal-400">
                {info.phone.display}
              </a>
            ) : (
              <p className="mt-3">
                <ToComplete label="numéro de téléphone" />
              </p>
            )}
            {info.availability ? <p className="mt-2 text-asphalt-300">{info.availability}</p> : null}
          </div>
          <div className="rounded-3xl border border-white/10 bg-asphalt-850 p-7" data-reveal style={{ "--reveal-delay": "90ms" } as React.CSSProperties}>
            <WhatsAppIcon size={28} className="text-whatsapp" />
            <h2 className="mt-4 text-2xl font-extrabold">WhatsApp</h2>
            {info.whatsapp ? (
              <a
                href={whatsappHref(info.whatsapp.e164, whatsappRequestMessage({}))}
                className="mt-4 inline-flex h-12 items-center gap-2 rounded-2xl bg-whatsapp px-5 font-extrabold text-asphalt-950"
              >
                Écrire sur WhatsApp
                <Icon name="arrowRight" size={18} strokeWidth={2.6} />
              </a>
            ) : (
              <p className="mt-3">
                <ToComplete label="numéro WhatsApp" />
              </p>
            )}
            <p className="mt-3 text-asphalt-300">Pratique pour nous envoyer des photos du véhicule.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-asphalt-850 p-7" data-reveal style={{ "--reveal-delay": "180ms" } as React.CSSProperties}>
            <Icon name="truck" size={28} className="text-signal-500" />
            <h2 className="mt-4 text-2xl font-extrabold">Demande en ligne</h2>
            <p className="mt-3 text-asphalt-300">Votre prix estimé en moins d&apos;une minute.</p>
            <Link href="/demande" className="mt-4 inline-flex h-12 items-center gap-2 rounded-2xl bg-signal-500 px-5 font-extrabold text-asphalt-950">
              Faire une demande
              <Icon name="arrowRight" size={18} strokeWidth={2.6} />
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-asphalt-850 p-7 md:col-span-2" data-reveal>
            <Icon name="pin" size={28} className="text-signal-500" />
            <h2 className="mt-4 text-2xl font-extrabold">Adresse</h2>
            <p className="mt-2 text-xl text-asphalt-100">{info.depotLabel}</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-bold text-signal-400">
              Voir sur la carte
              <Icon name="external" size={16} />
            </a>
          </div>
          <div className="rounded-3xl border border-white/10 bg-asphalt-850 p-7" data-reveal>
            <Icon name="mail" size={28} className="text-signal-500" />
            <h2 className="mt-4 text-2xl font-extrabold">Email</h2>
            {info.email ? (
              <a href={`mailto:${info.email}`} className="mt-3 block break-all text-lg font-bold text-signal-400">
                {info.email}
              </a>
            ) : (
              <p className="mt-3">
                <ToComplete label="email" />
              </p>
            )}
            <p className="mt-2 text-asphalt-300">Pour les demandes non urgentes.</p>
          </div>
        </div>
      </Section>
    </>
  );
}
