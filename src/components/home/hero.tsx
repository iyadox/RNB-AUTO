import Link from "next/link";
import { whatsappHref, whatsappRequestMessage } from "@/core/contact";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import { NightRoad } from "./night-road";

/** Découpe un titre en mots qui « montent » à l'affichage (animation CSS, sans JavaScript). */
function RiseWords({ text, start = 0, className }: { text: string; start?: number; className?: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`}>
          <span className="rise-line">
            <span className={`rise-word ${className ?? ""}`} style={{ "--i": start + index } as React.CSSProperties}>
              {word}
            </span>
          </span>{" "}
        </span>
      ))}
    </>
  );
}

export function Hero({ info }: { info: PublicSiteInfo }) {
  return (
    <section data-hero className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-asphalt-950 pb-[5.5rem] md:pb-0 lg:h-[100svh] lg:min-h-[740px]">
      {/* Ciel de nuit */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_-10%,#1d2836_0%,#0d0f12_55%,#08090b_100%)]" />
      <div className="map-grid absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      {/* Halo du gyrophare */}
      <div className="absolute -right-32 -top-32 -z-10 h-[34rem] w-[34rem] animate-beacon-flash rounded-full bg-beacon-500/20 blur-3xl" />

      <div data-hero-content className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-24 sm:px-6 lg:pt-28">
        <div className="flex flex-wrap items-center gap-2 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-asphalt-100 backdrop-blur">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-whatsapp" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-whatsapp" />
            </span>
            {info.availability ?? "Bobigny · Île-de-France"}
          </span>
          {info.availability ? (
            <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-asphalt-200">
              Bobigny · Île-de-France
            </span>
          ) : null}
        </div>

        <h1 className="font-display mt-5 text-[clamp(3.6rem,17.6vw,7.6rem)] leading-[0.94] text-chalk">
          <span className="block">
            <RiseWords text="Besoin d'un" />
          </span>
          <span className="block text-signal-500">
            <RiseWords text={"dépannage\u00a0?"} start={2} />
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-asphalt-200 animate-fade-up [animation-delay:450ms] sm:text-xl">
          <span className="hidden sm:inline">Remorquage et assistance à {info.serviceArea}. </span>
          <span className="sm:hidden">Remorquage et assistance en Île-de-France. </span>
          <span className="font-semibold text-chalk">Votre prix estimé en moins d&apos;une minute</span>, confirmé avant
          l&apos;intervention.
        </p>

        <div className="mt-7 flex flex-col gap-3 animate-fade-up [animation-delay:600ms] sm:flex-row sm:items-center">
          <Link
            href="/demande"
            className="group inline-flex h-16 items-center justify-center gap-3 rounded-2xl bg-signal-500 px-7 text-lg font-extrabold text-asphalt-950 shadow-[0_18px_50px_-12px_rgb(255_196_0_/_0.55)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Demander un dépannage
            <Icon name="arrowRight" size={22} strokeWidth={2.6} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <div className="hidden gap-3 md:flex">
            {info.phone ? (
              <a
                href={info.phone.href}
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 font-bold text-chalk backdrop-blur transition-colors hover:border-signal-500"
              >
                <Icon name="phone" size={20} strokeWidth={2.4} />
                Appeler
              </a>
            ) : null}
            {info.whatsapp ? (
              <a
                href={whatsappHref(info.whatsapp.e164, whatsappRequestMessage({}))}
                className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border border-whatsapp/40 bg-whatsapp/10 px-6 font-bold text-whatsapp backdrop-blur transition-colors hover:bg-whatsapp/20"
              >
                <WhatsAppIcon size={20} />
                WhatsApp
              </a>
            ) : null}
          </div>
        </div>

        <ul className="mt-8 hidden flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-asphalt-300 animate-fade-up [animation-delay:750ms] sm:flex lg:hidden">
          {["Prix estimé en ligne", "Confirmé avant de partir", "Appel, WhatsApp ou en ligne"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Icon name="check" size={16} strokeWidth={3} className="text-signal-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <NightRoad />

      <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-asphalt-300 lg:flex">
        Défiler
        <span className="relative h-10 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-scroll-cue bg-signal-500" />
        </span>
      </div>
    </section>
  );
}
