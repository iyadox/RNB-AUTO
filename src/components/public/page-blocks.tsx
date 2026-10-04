/** Blocs communs des pages publiques : en-tête de page, sections, bandeau d'appel. */
import Link from "next/link";
import { whatsappHref, whatsappRequestMessage } from "@/core/contact";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { TowTruck } from "@/components/brand/tow-truck";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon, type IconName } from "@/components/ui/icon";

export function PageHero({
  eyebrow,
  title,
  lead,
  icon,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  icon?: IconName;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-asphalt-950 pb-16 pt-28 lg:pb-24 lg:pt-40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_-20%,#1d2836_0%,#0d0f12_55%,#08090b_100%)]" />
      <div className="map-grid absolute inset-0 -z-10 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="absolute -right-24 -top-24 -z-10 h-80 w-80 animate-beacon-flash rounded-full bg-beacon-500/15 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.25em] text-signal-500 animate-fade-up">
          {icon ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-500 text-asphalt-950">
              <Icon name={icon} size={20} strokeWidth={2.3} />
            </span>
          ) : null}
          {eyebrow}
        </p>
        <h1 className="font-display mt-5 max-w-4xl text-[clamp(3rem,12vw,7.5rem)] leading-[0.92] animate-fade-up [animation-delay:120ms]">
          {title}
        </h1>
        {lead ? (
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-asphalt-200 animate-fade-up [animation-delay:240ms] sm:text-xl">
            {lead}
          </p>
        ) : null}
        {children ? <div className="mt-8 animate-fade-up [animation-delay:360ms]">{children}</div> : null}
      </div>
      <div className="chevrons absolute inset-x-0 bottom-0 h-2 animate-chevrons opacity-80" aria-hidden="true" />
    </section>
  );
}

export function Section({
  title,
  eyebrow,
  children,
  tone = "dark",
  className,
}: {
  title?: React.ReactNode;
  eyebrow?: string;
  children: React.ReactNode;
  tone?: "dark" | "darker" | "light";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "py-16 lg:py-24",
        tone === "dark" && "bg-asphalt-900",
        tone === "darker" && "bg-asphalt-950",
        tone === "light" && "bg-chalk text-asphalt-950",
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {eyebrow ? (
          <p
            className={cn("text-sm font-bold uppercase tracking-[0.25em]", tone === "light" ? "text-signal-700" : "text-signal-500")}
            data-reveal
          >
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="font-display mt-3 max-w-4xl text-[clamp(2.4rem,7vw,4.8rem)]" data-reveal>
            {title}
          </h2>
        ) : null}
        <div className={title || eyebrow ? "mt-10" : undefined}>{children}</div>
      </div>
    </section>
  );
}

export function FeatureGrid({
  items,
  tone = "dark",
}: {
  items: { icon: IconName; title: string; text: React.ReactNode }[];
  tone?: "dark" | "light";
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <div
          key={item.title}
          data-reveal
          style={{ "--reveal-delay": `${(index % 3) * 90}ms` } as React.CSSProperties}
          className={cn(
            "rounded-3xl border p-7",
            tone === "dark" ? "border-white/10 bg-asphalt-850" : "border-asphalt-200 bg-white",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-signal-500 text-asphalt-950">
            <Icon name={item.icon} size={24} strokeWidth={2.2} />
          </span>
          <h3 className="mt-5 text-xl font-extrabold">{item.title}</h3>
          <div className={cn("mt-2 leading-relaxed", tone === "dark" ? "text-asphalt-300" : "text-asphalt-600")}>{item.text}</div>
        </div>
      ))}
    </div>
  );
}

export function Steps({ steps }: { steps: { title: string; text: React.ReactNode }[] }) {
  return (
    <ol className="grid gap-4 lg:grid-cols-4">
      {steps.map((step, index) => (
        <li
          key={step.title}
          data-reveal
          style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}
          className="relative rounded-3xl border border-white/10 bg-asphalt-850 p-6"
        >
          <span className="font-display text-6xl text-signal-500">{String(index + 1).padStart(2, "0")}</span>
          <h3 className="mt-3 text-xl font-extrabold">{step.title}</h3>
          <div className="mt-2 text-asphalt-300">{step.text}</div>
        </li>
      ))}
    </ol>
  );
}

/** Bandeau d'appel à l'action, en bas de chaque page. */
export function CtaBand({ info, title = "Besoin d'une dépanneuse maintenant ?" }: { info: PublicSiteInfo; title?: string }) {
  return (
    <section className="bg-asphalt-950 py-16 lg:py-24">
      <div className="relative mx-4 overflow-hidden rounded-[2.5rem] bg-signal-500 px-6 py-12 text-asphalt-950 sm:mx-6 lg:mx-auto lg:max-w-7xl lg:px-14 lg:py-16" data-reveal>
        <div className="chevrons absolute inset-x-0 top-0 h-2.5" aria-hidden="true" />
        <div className="grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-display text-[clamp(2.6rem,8vw,5rem)]">{title}</h2>
            <p className="mt-3 max-w-xl text-lg font-semibold">
              Votre estimation en moins d&apos;une minute, confirmée avec vous avant l&apos;intervention.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/demande" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-asphalt-950 px-6 font-extrabold text-chalk">
                Demander un dépannage
                <Icon name="arrowRight" size={20} strokeWidth={2.6} className="text-signal-500" />
              </Link>
              {info.phone ? (
                <a href={info.phone.href} className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-asphalt-950 px-6 font-extrabold">
                  <Icon name="phone" size={18} strokeWidth={2.4} />
                  {info.phone.display}
                </a>
              ) : null}
              {info.whatsapp ? (
                <a
                  href={whatsappHref(info.whatsapp.e164, whatsappRequestMessage({}))}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-asphalt-950 px-6 font-extrabold"
                >
                  <WhatsAppIcon size={18} />
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
          <div className="hidden lg:block" data-pause-offscreen>
            <TowTruck moving id="cta-truck" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Texte long (pages légales) : titres et paragraphes lisibles. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl space-y-5 text-lg leading-relaxed text-asphalt-200 [&_a]:font-semibold [&_a]:text-signal-400 [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-chalk [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-chalk [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:text-chalk [&_ul]:space-y-2">
      {children}
    </div>
  );
}

/** Marqueur visible pour une information que RNB AUTO doit encore fournir. */
export function ToComplete({ label }: { label?: string }) {
  return (
    <span className="rounded-md bg-beacon-500/20 px-2 py-0.5 text-base font-bold text-beacon-400">
      À COMPLÉTER{label ? ` : ${label}` : ""}
    </span>
  );
}
