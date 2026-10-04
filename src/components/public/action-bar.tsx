/**
 * Barre d'action fixe en bas de l'écran du téléphone : Appeler · WhatsApp · Demande.
 * Ce sont de simples liens : ils fonctionnent même sans JavaScript et même si la base est en panne.
 */
import Link from "next/link";
import { whatsappHref, whatsappRequestMessage, type PhoneLink } from "@/core/contact";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";

export function ActionBar({ phone, whatsapp }: { phone: PhoneLink | null; whatsapp: PhoneLink | null }) {
  return (
    <nav
      aria-label="Actions rapides"
      className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-asphalt-950/92 px-3 pt-2.5 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-[1.15fr_1fr_1fr] gap-2">
        {phone ? (
          <a
            href={phone.href}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-signal-500 font-bold text-asphalt-950 shadow-[0_8px_30px_-8px_rgb(255_196_0_/_0.6)] active:scale-[0.98]"
          >
            <Icon name="phone" size={20} strokeWidth={2.4} />
            Appeler
          </a>
        ) : (
          <Link
            href="/contact"
            className="flex h-14 flex-col items-center justify-center rounded-2xl bg-signal-500 text-asphalt-950"
          >
            <span className="flex items-center gap-1.5 font-bold">
              <Icon name="phone" size={18} strokeWidth={2.4} />
              Appeler
            </span>
            <span className="text-[0.62rem] font-semibold uppercase tracking-wide">N° à compléter</span>
          </Link>
        )}
        {whatsapp ? (
          <a
            href={whatsappHref(whatsapp.e164, whatsappRequestMessage({}))}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp font-bold text-asphalt-950 active:scale-[0.98]"
          >
            <WhatsAppIcon size={20} />
            WhatsApp
          </a>
        ) : (
          <Link href="/contact" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-whatsapp/80 font-bold text-asphalt-950">
            <WhatsAppIcon size={20} />
            WhatsApp
          </Link>
        )}
        <Link
          href="/demande"
          className="flex h-14 items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/5 font-bold text-chalk active:scale-[0.98]"
        >
          Demande
          <Icon name="arrowRight" size={18} strokeWidth={2.4} />
        </Link>
      </div>
    </nav>
  );
}
