/**
 * Ticket d'estimation (docs/09, B.8 et P12) : LE seul ticket du site. Papier perforé, en-tête
 * losange « RNB AUTO · ESTIMATION », prix EN HAUT, lignes cochées SANS montant, pied.
 *
 * - Accueil : exemple calculé par le moteur, `stamp="exemple"`, libellé « Total estimé TTC ».
 * - /demande : vrai prix renvoyé par le serveur, libellé « Prix estimé » ; `stamp="recue"`
 *   après l'envoi. Le libellé du total est TOUJOURS fourni par l'appelant (aucun texte en double).
 * - Le prix est un texte immédiat : le compteur (`Odometer`) n'est qu'un roulement décoratif
 *   par-dessus le vrai texte. Le tampon est décoratif (`aria-hidden`) : l'information
 *   « exemple » est répétée en clair dans le pied (`footnote`), fourni par l'appelant.
 * - `print` : le ticket sort ligne par ligne (`data-print`, P12) à l'entrée dans l'écran ou au
 *   montage ; le tampon frappe à la fin. Sans JavaScript et en `off` : ticket complet.
 */
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { Odometer } from "@/components/motion/odometer";
import { cn } from "@/components/ui/cn";
import { formatEurosShort } from "@/core/format";
import styles from "./kit.module.css";

type EstimateTicketProps = {
  priceCents: number | null;
  /** Libellé du total : « Total estimé TTC » (accueil), « Prix estimé » (/demande). */
  priceLabel?: string;
  /** Lignes cochées, sans montant (libellés renvoyés par le moteur). */
  lines: string[];
  stamp?: "exemple" | "recue" | null;
  footnote?: ReactNode;
  print?: "view" | "mount" | "none";
  odometer?: "view" | "mount" | "none";
  /** Affiché à la place du prix quand il n'y en a pas. */
  emptyText?: string;
  children?: ReactNode;
  className?: string;
};

const STAMP_TEXT = { exemple: "Exemple", recue: "Reçue" } as const;

function Losange() {
  return (
    <svg viewBox="0 0 24 24" className={styles.ticketLogo} aria-hidden="true">
      <path d="M12 1.5 22.5 12 12 22.5 1.5 12Z" fill="#ffc400" stroke="#16181b" strokeWidth="1.6" strokeLinejoin="round" />
      <text x="12" y="14.4" textAnchor="middle" fontSize="6.6" fontWeight="900" fill="#16181b" style={{ fontStretch: "75%" }}>
        RNB
      </text>
    </svg>
  );
}

export function EstimateTicket({
  priceCents,
  priceLabel,
  lines,
  stamp = null,
  footnote,
  print = "view",
  odometer = "view",
  emptyText = "Votre prix en moins d'une minute",
  children,
  className,
}: EstimateTicketProps): ReactElement {
  const hasPrice = priceCents !== null;
  const printLines = Math.min(12, 3 + lines.length + (footnote ? 1 : 0) + (children ? 1 : 0));

  return (
    <div className={cn(styles.ticketWrap, className)}>
      <div
        className={styles.ticket}
        data-print={print === "none" ? undefined : print}
        style={{ "--print-lines": printLines } as CSSProperties}
      >
        <div className={styles.ticketHead}>
          <Losange />
          <span className="font-plate text-plate">RNB AUTO · Estimation</span>
        </div>

        <div className={styles.ticketPrice}>
          {hasPrice ? (
            <>
              {priceLabel ? <p className={styles.ticketPriceLabel}>{priceLabel}</p> : null}
              <p className={cn(styles.ticketAmount, "font-figure")}>
                {odometer === "none" ? (
                  formatEurosShort(priceCents)
                ) : (
                  <Odometer value={priceCents / 100} unit="€" trigger={odometer} />
                )}
              </p>
            </>
          ) : (
            <p className={cn(styles.ticketEmpty, "font-step text-balance")}>{emptyText}</p>
          )}
          {stamp ? (
            <span data-stamp="" aria-hidden="true" className={cn(styles.stamp, stamp === "recue" && styles.stampRecue)}>
              {STAMP_TEXT[stamp]}
            </span>
          ) : null}
        </div>

        {lines.length > 0 ? (
          <ul className={styles.ticketLines}>
            {lines.map((line, index) => (
              <li key={`${index}-${line}`}>
                <svg viewBox="0 0 16 16" aria-hidden="true" className={styles.ticketCheck}>
                  <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M5 8.2 7.1 10.3 11.2 6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {footnote ? <div className={styles.ticketFoot}>{footnote}</div> : null}
        {children ? <div className={styles.ticketExtra}>{children}</div> : null}
      </div>
    </div>
  );
}
