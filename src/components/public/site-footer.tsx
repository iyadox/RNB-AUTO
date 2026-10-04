import Link from "next/link";
import { whatsappHref } from "@/core/contact";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { LogoMark } from "@/components/brand/logo";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";

const COLUMNS = [
  {
    title: "Services",
    links: [
      { href: "/depannage", label: "Dépannage sur place" },
      { href: "/remorquage", label: "Remorquage" },
      { href: "/panne-autoroute", label: "Panne sur autoroute" },
      { href: "/demande", label: "Demande en ligne" },
    ],
  },
  {
    title: "RNB AUTO",
    links: [
      { href: "/entreprise", label: "L'entreprise" },
      { href: "/zones-d-intervention", label: "Zones d'intervention" },
      { href: "/questions-frequentes", label: "Questions fréquentes" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Informations",
    links: [
      { href: "/conditions-d-intervention", label: "Conditions d'intervention" },
      { href: "/mentions-legales", label: "Mentions légales" },
      { href: "/confidentialite", label: "Confidentialité" },
      { href: "/admin", label: "Espace RNB AUTO" },
    ],
  },
];

export function SiteFooter({ info }: { info: PublicSiteInfo }) {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-asphalt-950 pb-28 md:pb-10">
      <div className="chevrons h-2 w-full opacity-90" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-12 w-12" />
              <div>
                <p className="font-wide text-2xl">RNB AUTO</p>
                <p className="text-sm text-asphalt-300">Dépannage · Remorquage · Assistance</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-asphalt-300">
              Dépôt : {info.depotLabel}
              <br />
              Intervention : {info.serviceArea}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {info.phone ? (
                <a href={info.phone.href} className="inline-flex items-center gap-2 rounded-full bg-signal-500 px-5 py-3 font-bold text-asphalt-950">
                  <Icon name="phone" size={18} strokeWidth={2.4} />
                  <span className="tabular">{info.phone.display}</span>
                </a>
              ) : null}
              {info.whatsapp ? (
                <a
                  href={whatsappHref(info.whatsapp.e164)}
                  className="inline-flex items-center gap-2 rounded-full border border-whatsapp/50 px-5 py-3 font-bold text-whatsapp"
                >
                  <WhatsAppIcon size={18} />
                  WhatsApp
                </a>
              ) : null}
            </div>
            {info.email ? (
              <a href={`mailto:${info.email}`} className="mt-4 inline-flex items-center gap-2 text-asphalt-300 hover:text-chalk">
                <Icon name="mail" size={16} />
                {info.email}
              </a>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-signal-500">{column.title}</p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-asphalt-200 transition-colors hover:text-chalk">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p
          className="font-display pointer-events-none mt-16 select-none text-center text-[22vw] leading-[0.8] text-white/[0.035] lg:text-[16rem]"
          aria-hidden="true"
        >
          RNB AUTO
        </p>
        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-sm text-asphalt-400 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} RNB AUTO. Tous droits réservés.</p>
          <p>Les prix affichés en ligne sont des estimations, confirmées avant chaque intervention.</p>
        </div>
      </div>
    </footer>
  );
}
