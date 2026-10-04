/**
 * Barre d'action fixe en bas de l'écran du téléphone : Appeler · WhatsApp · Demande (docs/09, D.7).
 * Ce sont de simples liens rendus par le serveur : ils fonctionnent sans JavaScript et même si la
 * base est en panne. Toujours au-dessus de tout (z 60), jamais masquée, jamais animée toute seule,
 * jamais nommée pour une transition de page. Sur /demande, « Demande » disparaît et la grille
 * passe à deux colonnes (CSS `:has`, voir shell.module.css).
 */
import Link from "next/link";
import { whatsappHref, whatsappRequestMessage, type PhoneLink } from "@/core/contact";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";
import styles from "./shell.module.css";

const BUTTON = "flex h-14 items-center justify-center gap-2 rounded-2xl font-bold";

export function ActionBar({ phone, whatsapp }: { phone: PhoneLink | null; whatsapp: PhoneLink | null }) {
  return (
    <nav aria-label="Actions rapides" className={cn(styles.actionBar, "safe-bottom md:hidden")}>
      <div className={cn(styles.actionGrid, "mx-auto grid max-w-md gap-2")}>
        {phone ? (
          <a href={phone.href} data-action="call" className={cn(BUTTON, styles.actionTap, "bg-signal-500 text-asphalt-950")}>
            <Icon name="phone" size={20} strokeWidth={2.4} />
            Appeler
          </a>
        ) : (
          <Link
            href="/contact"
            data-action="call"
            className={cn(styles.actionTap, "flex h-14 flex-col items-center justify-center rounded-2xl bg-signal-500 text-asphalt-950")}
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
            data-action="whatsapp"
            className={cn(BUTTON, styles.actionTap, "bg-whatsapp text-asphalt-950")}
          >
            <WhatsAppIcon size={20} />
            WhatsApp
          </a>
        ) : (
          <Link href="/contact" data-action="whatsapp" className={cn(BUTTON, styles.actionTap, "bg-whatsapp/80 text-asphalt-950")}>
            <WhatsAppIcon size={20} />
            WhatsApp
          </Link>
        )}
        <Link
          href="/demande"
          data-action="request"
          className={cn(
            BUTTON,
            styles.actionTap,
            "gap-1.5 bg-night-900/80 text-chalk shadow-[inset_0_0_0_1.5px_rgb(255_253_246_/_0.22)]",
          )}
        >
          Demande
          <Icon name="arrowRight" size={18} strokeWidth={2.4} className="text-signal-500" />
        </Link>
      </div>
    </nav>
  );
}
