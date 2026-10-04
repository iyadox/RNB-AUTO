import Link from "next/link";
import { formatEurosShort } from "@/core/format";
import { HOME_EXAMPLE_DESCRIPTION, type PublicSiteInfo } from "@/server/site/public-info";
import { TowTruck } from "@/components/brand/tow-truck";
import { Icon, WhatsAppIcon, type IconName } from "@/components/ui/icon";
import { whatsappHref } from "@/core/contact";

// ─── Bandeau défilant ────────────────────────────────────────────────────────

const MARQUEE_WORDS = ["Dépannage", "Remorquage", "Assistance", "Bobigny", "Seine-Saint-Denis", "Paris", "Île-de-France"];

export function MarqueeBand() {
  const row = (
    <div className="flex shrink-0 items-center gap-8 pr-8">
      {MARQUEE_WORDS.map((word, index) => (
        <span key={word} className="flex items-center gap-8">
          <span className={index % 2 === 0 ? "text-chalk" : "text-outline text-signal-500"}>{word}</span>
          <svg viewBox="0 0 20 20" className="h-6 w-6 text-signal-500" aria-hidden="true">
            <path d="M10 1 19 10 10 19 1 10Z" fill="currentColor" />
          </svg>
        </span>
      ))}
    </div>
  );
  return (
    <section aria-label="Nos services" className="relative overflow-hidden border-y border-white/10 bg-asphalt-900 py-6">
      <div data-marquee-skew className="font-display flex w-max animate-marquee text-[clamp(2.6rem,7vw,5.5rem)] leading-none">
        {row}
        {row}
      </div>
    </section>
  );
}

// ─── Comment ça marche (scène pilotée par le défilement) ─────────────────────

const STEPS: { title: string; text: string; icon: IconName }[] = [
  {
    title: "Vous nous dites où vous êtes",
    text: "Un geste suffit : votre téléphone nous donne votre position. Vous pouvez aussi taper l'adresse.",
    icon: "pin",
  },
  {
    title: "Vous voyez le prix tout de suite",
    text: "Votre véhicule, le problème, la destination : trois réponses et l'estimation s'affiche. Pas de mauvaise surprise.",
    icon: "euro",
  },
  {
    title: "La dépanneuse arrive",
    text: "Nous vous rappelons pour confirmer, puis la dépanneuse part de Bobigny vers vous.",
    icon: "truck",
  },
  {
    title: "Votre véhicule part où vous voulez",
    text: "Garage, domicile ou autre adresse : votre véhicule est chargé avec soin et transporté.",
    icon: "flag",
  },
];

const STORY_LEG1 = "M312 92 C 268 120, 210 96, 168 140 S 96 196, 112 236";
const STORY_PATH = `${STORY_LEG1} C 124 268, 196 262, 220 300 S 238 372, 286 392`;

function StoryMap() {
  return (
    <svg viewBox="0 0 400 460" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="story-glow">
          <stop offset="0" stopColor="#ffc400" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ffc400" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Plan stylisé */}
      <g stroke="rgb(255 255 255 / 0.06)" strokeWidth="1">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`v${i}`} d={`M${i * 50} 0V460`} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <path key={`h${i}`} d={`M0 ${i * 50}H400`} />
        ))}
      </g>
      <path d="M-10 300 C 60 280, 90 330, 160 318 S 260 250, 330 280 S 380 340, 420 330" fill="none" stroke="#1b3550" strokeWidth="14" opacity="0.7" />
      <g fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="5" strokeLinecap="round">
        <path d="M20 60 C 120 90, 220 40, 390 120" />
        <path d="M40 420 C 120 330, 180 260, 390 220" />
        <path d="M200 0 C 190 140, 260 260, 210 460" />
      </g>
      {/* Trajet de la dépanneuse : tracé discret + tracé jaune dessiné au défilement */}
      <path d={STORY_PATH} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 10" />
      <path id="story-path" data-story-path d={STORY_PATH} fill="none" stroke="#ffc400" strokeWidth="5" strokeLinecap="round" />
      <path data-story-leg1 d={STORY_LEG1} fill="none" stroke="none" />
      {/* Dépôt */}
      <g transform="translate(312 92)">
        <circle r="26" fill="url(#story-glow)" />
        <rect x="-15" y="-15" width="30" height="30" rx="6" fill="#ffc400" transform="rotate(45)" />
        <text y="5" textAnchor="middle" fontSize="11" fontWeight="900" fill="#0d0f12">RNB</text>
        <text y="44" textAnchor="middle" fontSize="12" fontWeight="700" fill="#c8ced6">Dépôt · Bobigny</text>
      </g>
      {/* Vous */}
      <g data-story-pin transform="translate(112 236)">
        <circle r="30" fill="#ff7a1a" opacity="0.18" className="animate-pulse-ring" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
        <path d="M0 -6c0 10-12 20-12 20S-24 4-24-6a12 12 0 0 1 24 0Z" transform="translate(12 -12)" fill="#ff7a1a" />
        <circle cx="0" cy="-18" r="4.5" fill="#0d0f12" />
        <text y="26" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f5f3ee">Vous</text>
      </g>
      {/* Prix */}
      <g data-story-price transform="translate(196 196)">
        <rect x="-4" y="-22" width="112" height="40" rx="12" fill="#f5f3ee" />
        <text x="10" y="-6" fontSize="9" fontWeight="700" fill="#4c5662">PRIX ESTIMÉ</text>
        <text x="10" y="11" fontSize="15" fontWeight="900" fill="#0d0f12">en 1 minute</text>
      </g>
      {/* Destination */}
      <g data-story-flag transform="translate(286 392)">
        <circle r="24" fill="url(#story-glow)" />
        <path d="M-2 0V-34" stroke="#f5f3ee" strokeWidth="3" strokeLinecap="round" />
        <path d="M-1 -34h22l-6 7 6 7H-1Z" fill="#ffc400" className="animate-flag" style={{ transformBox: "fill-box", transformOrigin: "left center" }} />
        <text y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#c8ced6">Destination</text>
      </g>
      {/* Dépanneuse (se déplace le long du trajet au défilement) */}
      <g data-story-truck>
        <g transform="translate(312 92)">
          <circle r="17" fill="#0d0f12" stroke="#ffc400" strokeWidth="3" />
          <g transform="translate(-10 -9) scale(0.85)" fill="none" stroke="#ffc400" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 16V7h11v9" />
            <path d="M13 10h4l3 3v3h-7" />
            <circle cx="6.5" cy="17.5" r="2" />
            <circle cx="16.5" cy="17.5" r="2" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section data-story className="relative bg-asphalt-950" aria-labelledby="how-title">
      <div className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:pt-32">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-signal-500" data-reveal>
          Comment ça marche
        </p>
        <h2 id="how-title" data-split className="font-display mt-4 max-w-3xl text-[clamp(2.8rem,8vw,6rem)]">
          De la panne à la solution, sans stress.
        </h2>
      </div>
      <div className="mx-auto grid max-w-7xl gap-0 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="sticky top-16 z-10 h-[46svh] bg-gradient-to-b from-asphalt-950 via-asphalt-950 to-transparent pb-6 lg:top-0 lg:order-2 lg:flex lg:h-screen lg:items-center lg:bg-none lg:pb-0">
          <div data-story-visual className="mx-auto h-full max-h-[620px] w-full max-w-[520px] rounded-[2rem] border border-white/10 bg-asphalt-900 p-2 shadow-2xl lg:h-[78vh]">
            <StoryMap />
          </div>
        </div>
        <ol className="relative lg:order-1">
          {STEPS.map((step, index) => (
            <li key={step.title} data-story-step={index} className="flex min-h-[62svh] items-center py-10 lg:min-h-[80vh]">
              <div className="max-w-md transition-opacity duration-500 [[data-active=false]_&]:opacity-35">
                <div className="flex items-center gap-4">
                  <span className="font-display text-7xl text-signal-500 tabular">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-signal-400">
                    <Icon name={step.icon} size={24} />
                  </span>
                </div>
                <h3 className="mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">{step.title}</h3>
                <p className="mt-4 text-lg leading-relaxed text-asphalt-300">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────

const SERVICES: { title: string; text: string; icon: IconName; href: string }[] = [
  {
    title: "Remorquage",
    text: "Votre véhicule chargé sur plateau et emmené au garage, chez vous ou à l'adresse de votre choix.",
    icon: "truck",
    href: "/remorquage",
  },
  {
    title: "Batterie & démarrage",
    text: "Votre voiture ne démarre plus ? Nous intervenons sur place quand c'est possible.",
    icon: "battery",
    href: "/depannage",
  },
  {
    title: "Crevaison",
    text: "Changement de roue avec votre roue de secours, ou transport si la roue ne peut pas être changée.",
    icon: "tire",
    href: "/depannage",
  },
  {
    title: "Accident",
    text: "Véhicule accidenté ou non roulant : chargement adapté, même quand les roues sont bloquées.",
    icon: "accident",
    href: "/remorquage",
  },
  {
    title: "Parkings & accès difficiles",
    text: "Parkings, ruelles, sous-sols : dites-le nous, nous venons avec le bon matériel.",
    icon: "parking",
    href: "/remorquage",
  },
  {
    title: "Relais après autoroute",
    text: "Sorti de l'autoroute par le dépanneur agréé ? Nous prenons le relais jusqu'à votre destination.",
    icon: "road",
    href: "/panne-autoroute",
  },
];

export function Services() {
  return (
    <section className="relative overflow-hidden bg-asphalt-900 py-24 lg:py-32" aria-labelledby="services-title">
      <div className="map-grid absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-signal-500" data-reveal>
              Ce que nous faisons
            </p>
            <h2 id="services-title" data-split className="font-display mt-4 text-[clamp(2.8rem,8vw,6rem)]">
              Une dépanneuse.
              <br />
              <span className="text-signal-500">Toutes les galères.</span>
            </h2>
          </div>
          <p className="max-w-md text-lg text-asphalt-300" data-reveal>
            Panne, accident, crevaison ou véhicule bloqué : décrivez la situation, nous venons avec la bonne solution.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => (
            <Link
              key={service.title}
              href={service.href}
              data-reveal
              data-tilt
              style={{ "--reveal-delay": `${(index % 3) * 90}ms` } as React.CSSProperties}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-asphalt-850/90 p-7 transition-colors hover:border-signal-500/60"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-signal-500/0 blur-2xl transition-colors duration-500 group-hover:bg-signal-500/20" />
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-signal-500 text-asphalt-950 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                <Icon name={service.icon} size={28} strokeWidth={2.2} />
              </span>
              <h3 className="mt-6 text-2xl font-extrabold">{service.title}</h3>
              <p className="mt-3 text-asphalt-300">{service.text}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-signal-400">
                En savoir plus
                <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Prix clair ──────────────────────────────────────────────────────────────

export function PriceSection({ info }: { info: PublicSiteInfo }) {
  const example = info.examplePrice;
  return (
    <section className="relative overflow-hidden bg-chalk py-24 text-asphalt-950 lg:py-32" aria-labelledby="price-title">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-signal-700" data-reveal>
            Prix transparent
          </p>
          <h2 id="price-title" data-split className="font-display mt-4 text-[clamp(2.8rem,8vw,6rem)]">
            Le prix avant le départ.
          </h2>
          <p className="mt-6 max-w-lg text-lg text-asphalt-600" data-reveal>
            Notre calculateur tient compte de votre position, de la destination, de votre véhicule, de la situation et de
            l&apos;horaire. Vous voyez une estimation claire, que nous confirmons avec vous avant d&apos;intervenir.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: "clock" as const, text: "Estimation en moins d'une minute, sur votre téléphone" },
              { icon: "shield" as const, text: "Prix confirmé par téléphone avant l'intervention" },
              { icon: "route" as const, text: "Distance réelle calculée sur les routes, pas à vol d'oiseau" },
            ].map((item, index) => (
              <li key={item.text} data-reveal style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-asphalt-950 text-signal-500">
                  <Icon name={item.icon} size={22} />
                </span>
                <span className="pt-2 text-lg font-semibold">{item.text}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/demande"
            className="mt-10 inline-flex h-16 items-center gap-3 rounded-2xl bg-asphalt-950 px-7 text-lg font-extrabold text-chalk transition-transform hover:-translate-y-0.5"
          >
            Calculer mon prix
            <Icon name="arrowRight" size={22} strokeWidth={2.6} className="text-signal-500" />
          </Link>
        </div>

        {/* Téléphone : aperçu de l'estimation */}
        <div className="relative mx-auto w-full max-w-[360px]" data-phone>
          <div className="absolute -inset-10 rounded-full bg-signal-500/30 blur-3xl" aria-hidden="true" />
          <div className="relative rounded-[3rem] border-[10px] border-asphalt-950 bg-asphalt-950 shadow-[0_40px_80px_-20px_rgb(0_0_0_/_0.45)]">
            <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <div className="overflow-hidden rounded-[2.3rem] bg-asphalt-900 px-5 pb-6 pt-12 text-chalk">
              <div className="flex gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((step) => (
                  <span key={step} className="h-1.5 flex-1 rounded-full bg-signal-500" />
                ))}
              </div>
              <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-asphalt-300">Votre estimation</p>
              <div className="mt-3 rounded-3xl bg-asphalt-800 p-5">
                <p className="text-sm text-asphalt-300">Prix estimé</p>
                <p className="font-display mt-1 text-7xl text-signal-500 tabular">
                  {example ? (
                    <>
                      <span data-count-to={example.priceTtcCents / 100}>{Math.round(example.priceTtcCents / 100)}</span>
                      <span className="ml-1 text-4xl">€</span>
                    </>
                  ) : (
                    <span className="text-5xl">En 1 minute</span>
                  )}
                </p>
                <p className="mt-1 text-xs text-asphalt-300">TTC · confirmé avant l&apos;intervention</p>
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                  {["Remorquage", "Déplacement de la dépanneuse", "Transport de votre véhicule"].map((label) => (
                    <p key={label} className="flex items-center gap-2 text-asphalt-200">
                      <Icon name="check" size={14} strokeWidth={3} className="text-signal-500" />
                      {label}
                    </p>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex h-14 items-center justify-center rounded-2xl bg-signal-500 font-extrabold text-asphalt-950">
                Demander le dépannage
              </div>
            </div>
          </div>
          {example ? (
            <p className="relative mt-6 text-center text-sm text-asphalt-600">
              Exemple calculé avec nos tarifs actuels : {HOME_EXAMPLE_DESCRIPTION.vehicle.toLowerCase()} à{" "}
              {HOME_EXAMPLE_DESCRIPTION.approachKm} km du dépôt, remorquée sur {HOME_EXAMPLE_DESCRIPTION.loadedKm} km,{" "}
              {HOME_EXAMPLE_DESCRIPTION.when} : <strong>{formatEurosShort(example.priceTtcCents)} TTC</strong>.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ─── Autoroute ───────────────────────────────────────────────────────────────

export function HighwaySection() {
  return (
    <section className="relative overflow-hidden bg-asphalt-950 py-24 lg:py-32" aria-labelledby="highway-title">
      <div className="chevrons absolute inset-x-0 top-0 h-3 animate-chevrons" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-beacon-500 px-4 py-2 text-sm font-extrabold uppercase tracking-wider text-asphalt-950" data-reveal>
            <Icon name="alert" size={18} strokeWidth={2.6} />
            Panne sur autoroute
          </span>
          <h2 id="highway-title" data-split className="font-display mt-6 text-[clamp(2.6rem,7.5vw,5.5rem)]">
            Sur l&apos;autoroute ? Votre sécurité d&apos;abord.
          </h2>
          <p className="mt-6 max-w-xl text-lg text-asphalt-300" data-reveal>
            Sur l&apos;autoroute et les voies rapides, seul le dépanneur agréé pour le secteur peut intervenir. Il sort votre
            véhicule de la voie. <strong className="text-chalk">RNB AUTO prend ensuite le relais</strong> et l&apos;emmène où
            vous voulez.
          </p>
          <Link href="/panne-autoroute" className="mt-8 inline-flex items-center gap-2 font-bold text-signal-400 hover:text-signal-300" data-reveal>
            Que faire en cas de panne sur autoroute
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
        <ol className="grid gap-3">
          {[
            "Allumez vos feux de détresse et enfilez votre gilet avant de sortir.",
            "Mettez tout le monde à l'abri derrière la glissière de sécurité.",
            "Appelez depuis une borne orange ou le 112 : le dépanneur agréé arrive.",
            "Une fois hors de l'autoroute, demandez-nous de prendre le relais.",
          ].map((text, index) => (
            <li
              key={text}
              data-reveal
              style={{ "--reveal-delay": `${index * 100}ms` } as React.CSSProperties}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-asphalt-900 p-5"
            >
              <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500 text-2xl text-asphalt-950">
                {index + 1}
              </span>
              <span className="pt-1.5 text-lg font-semibold text-asphalt-100">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Zone d'intervention (radar) ─────────────────────────────────────────────

const ORIGIN = { lat: 48.9077, lng: 2.4397 };
const CITIES: { name: string; lat: number; lng: number; major?: boolean }[] = [
  { name: "Paris", lat: 48.8566, lng: 2.3522, major: true },
  { name: "Saint-Denis", lat: 48.9362, lng: 2.3574 },
  { name: "Montreuil", lat: 48.8611, lng: 2.4437 },
  { name: "Pantin", lat: 48.8944, lng: 2.4093 },
  { name: "Drancy", lat: 48.923, lng: 2.4455 },
  { name: "Bondy", lat: 48.9022, lng: 2.4828 },
  { name: "Aulnay-sous-Bois", lat: 48.9386, lng: 2.4973 },
  { name: "Roissy", lat: 49.0097, lng: 2.5479, major: true },
  { name: "Créteil", lat: 48.7904, lng: 2.4556, major: true },
  { name: "Noisy-le-Grand", lat: 48.8486, lng: 2.5526 },
  { name: "Argenteuil", lat: 48.9472, lng: 2.2467 },
  { name: "Versailles", lat: 48.8049, lng: 2.1204, major: true },
  { name: "Cergy", lat: 49.0364, lng: 2.0761, major: true },
  { name: "Évry", lat: 48.6292, lng: 2.4409 },
  { name: "Meaux", lat: 48.9601, lng: 2.8788, major: true },
];

function project(lat: number, lng: number) {
  const kmX = (lng - ORIGIN.lng) * Math.cos((ORIGIN.lat * Math.PI) / 180) * 111.32;
  const kmY = (lat - ORIGIN.lat) * 110.57;
  return { kmX, kmY, km: Math.hypot(kmX, kmY) };
}

/** Échelle en racine carrée : les villes proches de Bobigny restent lisibles. */
const RADAR_MAX_KM = 36;
function radarRadius(km: number, radius: number): number {
  return radius * Math.sqrt(Math.min(km, RADAR_MAX_KM) / RADAR_MAX_KM);
}

export function ZoneRadar({ info }: { info: PublicSiteInfo }) {
  const radius = 190;
  return (
    <section className="relative overflow-hidden bg-asphalt-900 py-24 lg:py-32" aria-labelledby="zone-title">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-signal-500" data-reveal>
            Zone d&apos;intervention
          </p>
          <h2 id="zone-title" data-split className="font-display mt-4 text-[clamp(2.8rem,8vw,6rem)]">
            Basés à Bobigny. Partout en Île-de-France.
          </h2>
          <p className="mt-6 max-w-lg text-lg text-asphalt-300" data-reveal>
            Notre dépanneuse part de {info.depotLabel}. Au cœur de la Seine-Saint-Denis, à quelques minutes de Paris et des
            grands axes. Votre distance exacte est calculée dès que vous indiquez votre position.
          </p>
          <Link href="/zones-d-intervention" className="mt-8 inline-flex items-center gap-2 font-bold text-signal-400 hover:text-signal-300" data-reveal>
            Voir les zones desservies
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[560px]" data-radar data-pause-offscreen>
          <svg viewBox="-220 -220 440 440" className="h-full w-full" aria-hidden="true">
            <defs>
              <radialGradient id="radar-bg">
                <stop offset="0" stopColor="#1b222a" />
                <stop offset="1" stopColor="#0d0f12" />
              </radialGradient>
              <linearGradient id="radar-sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#ffc400" stopOpacity="0" />
                <stop offset="1" stopColor="#ffc400" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <circle r={radius} fill="url(#radar-bg)" stroke="rgb(255 196 0 / 0.35)" />
            {[5, 10, 20, 30].map((km) => (
              <g key={km}>
                <circle r={radarRadius(km, radius)} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeDasharray="3 5" />
                <text x={4} y={-radarRadius(km, radius) - 4} fontSize="9" fill="#6f7b88" fontWeight="700">
                  {km} km
                </text>
              </g>
            ))}
            <path d={`M0 0 L${radius} 0 A${radius} ${radius} 0 0 0 ${radius * Math.cos(-Math.PI / 5)} ${radius * Math.sin(-Math.PI / 5)} Z`} fill="url(#radar-sweep)" className="animate-radar" style={{ transformBox: "view-box", transformOrigin: "center" }} />
            {CITIES.map((city, index) => {
              const p = project(city.lat, city.lng);
              const r = radarRadius(p.km, radius);
              const x = p.km > 0 ? (p.kmX / p.km) * r : 0;
              const y = p.km > 0 ? (-p.kmY / p.km) * r : 0;
              return (
                <g key={city.name} data-radar-city style={{ "--reveal-delay": `${index * 40}ms` } as React.CSSProperties}>
                  <circle cx={x} cy={y} r={city.major ? 4 : 2.8} fill={city.major ? "#ffc400" : "#c8ced6"} />
                  <text
                    x={x + 7}
                    y={y + 3.5}
                    fontSize={city.major ? 11 : 8.5}
                    fontWeight={city.major ? 800 : 600}
                    fill={city.major ? "#f5f3ee" : "#9ba6b2"}
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}
            <circle r="16" fill="#ff7a1a" opacity="0.25" className="animate-pulse-ring" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
            <rect x="-9" y="-9" width="18" height="18" rx="3" fill="#ffc400" transform="rotate(45)" />
            <text y="30" textAnchor="middle" fontSize="12" fontWeight="900" fill="#ffc400">
              BOBIGNY
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}

// ─── Questions fréquentes (aperçu) ───────────────────────────────────────────

export const HOME_FAQ = [
  {
    q: "Le prix affiché en ligne est-il définitif ?",
    a: "C'est une estimation calculée avec nos tarifs, votre position, la destination, votre véhicule et l'horaire. Nous la confirmons avec vous par téléphone avant d'intervenir. Si la situation sur place est différente de ce qui a été décrit, nous vous en parlons avant tout supplément.",
  },
  {
    q: "Pouvez-vous venir sur l'autoroute ?",
    a: "Non : sur l'autoroute et les voies rapides, seul le dépanneur agréé du secteur peut intervenir. Il sort votre véhicule de la voie, puis nous pouvons prendre le relais pour l'emmener où vous voulez.",
  },
  {
    q: "Où pouvez-vous emmener mon véhicule ?",
    a: "Au garage de votre choix, chez vous ou à toute autre adresse. Indiquez-la dans la demande : le prix en tient compte.",
  },
  {
    q: "Comment se passe le paiement ?",
    a: "Le prix est confirmé avec vous avant l'intervention. Les moyens de paiement acceptés vous sont indiqués à ce moment-là.",
  },
];

export function FaqPreview() {
  return (
    <section className="bg-asphalt-950 py-24 lg:py-32" aria-labelledby="faq-title">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-signal-500" data-reveal>
            Questions fréquentes
          </p>
          <h2 id="faq-title" data-split className="font-display mt-4 text-[clamp(2.8rem,8vw,5.5rem)]">
            Vos questions, nos réponses.
          </h2>
          <Link href="/questions-frequentes" className="mt-8 inline-flex items-center gap-2 font-bold text-signal-400 hover:text-signal-300" data-reveal>
            Toutes les questions
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
        <div className="divide-y divide-white/10 border-y border-white/10">
          {HOME_FAQ.map((item, index) => (
            <details key={item.q} className="group py-2" data-reveal style={{ "--reveal-delay": `${index * 80}ms` } as React.CSSProperties}>
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
      </div>
    </section>
  );
}

// ─── Appel final ─────────────────────────────────────────────────────────────

export function FinalCta({ info }: { info: PublicSiteInfo }) {
  return (
    <section data-final className="relative overflow-hidden bg-asphalt-950 pb-24 pt-10 lg:pb-32" aria-labelledby="final-title">
      <div data-final-panel className="relative mx-4 overflow-hidden rounded-[2.5rem] bg-signal-500 px-6 py-16 text-asphalt-950 sm:mx-6 lg:mx-auto lg:max-w-7xl lg:px-16 lg:py-24">
        <div className="chevrons absolute inset-x-0 top-0 h-3 opacity-90" aria-hidden="true" />
        <div className="chevrons absolute inset-x-0 bottom-0 h-3 opacity-90" aria-hidden="true" />
        <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 id="final-title" className="font-display text-[clamp(4rem,16vw,12rem)]">
              On arrive.
            </h2>
            <p className="mt-4 max-w-lg text-xl font-semibold">
              Décrivez votre situation en moins d&apos;une minute. Nous vous rappelons pour confirmer et la dépanneuse part.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/demande" className="inline-flex h-16 items-center justify-center gap-3 rounded-2xl bg-asphalt-950 px-6 text-base font-extrabold text-chalk sm:text-lg">
                Demander un dépannage
                <Icon name="arrowRight" size={22} strokeWidth={2.6} className="text-signal-500" />
              </Link>
              {info.phone ? (
                <a href={info.phone.href} className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border-2 border-asphalt-950 px-7 text-lg font-extrabold">
                  <Icon name="phone" size={20} strokeWidth={2.4} />
                  {info.phone.display}
                </a>
              ) : null}
              {info.whatsapp ? (
                <a
                  href={whatsappHref(info.whatsapp.e164)}
                  className="inline-flex h-16 items-center justify-center gap-2 rounded-2xl border-2 border-asphalt-950 px-7 text-lg font-extrabold"
                >
                  <WhatsAppIcon size={20} />
                  WhatsApp
                </a>
              ) : null}
            </div>
          </div>
          <div data-final-truck className="relative">
            <TowTruck loaded moving id="final-truck" />
          </div>
        </div>
      </div>
    </section>
  );
}
