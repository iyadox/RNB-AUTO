"use client";

/**
 * Lien de suivi personnel : affiché en entier (champ en lecture seule, sélectionnable), avec
 * « Copier le lien » et, si le téléphone sait le faire, « Partager » (feuille de partage du
 * système : SMS, WhatsApp, email…). Sans JavaScript, le champ reste lisible et copiable à la main.
 * L'adresse complète est construite avec l'origine de la page (jamais une adresse inventée).
 */
import { useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

const noop = () => () => {};
const canShare = () => typeof navigator !== "undefined" && typeof navigator.share === "function";

export function ShareLink({
  path,
  serverOrigin,
  shareTitle,
  className,
}: {
  /** Chemin du suivi (`/suivi/<référence>?t=<jeton>`). */
  path: string;
  /** Origine connue du serveur (adresse du site), en attendant celle du navigateur. */
  serverOrigin: string;
  shareTitle: string;
  className?: string;
}) {
  const origin = useSyncExternalStore(noop, () => window.location.origin, () => serverOrigin);
  const shareable = useSyncExternalStore(noop, canShare, () => false);
  const url = `${origin}${path}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState<"idle" | "done" | "manual">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied("done");
    } catch {
      // Presse-papiers refusé : le lien est sélectionné, il reste à le copier à la main.
      inputRef.current?.select();
      setCopied("manual");
    }
    window.setTimeout(() => setCopied("idle"), 4000);
  };

  const share = async () => {
    try {
      await navigator.share({ title: shareTitle, text: shareTitle, url });
    } catch {
      // Partage annulé par le visiteur : rien à faire.
    }
  };

  return (
    <div className={cn("grid gap-3", className)}>
      <label className="block">
        <span className="sr-only">Lien de suivi</span>
        <input
          ref={inputRef}
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="font-figure h-12 w-full truncate rounded-[6px] bg-night-950/90 px-3 text-[0.9375rem] text-asphalt-100 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-reflect)_18%,transparent)] outline-none focus:shadow-[inset_0_0_0_2px_var(--color-signal-500)]"
        />
      </label>
      <div className={cn("grid gap-3", shareable && "grid-cols-2")}>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl font-extrabold text-chalk shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-reflect)_30%,transparent)] transition-colors hover:text-signal-400"
        >
          <Icon name={copied === "done" ? "check" : "copy"} size={20} strokeWidth={2.4} />
          {copied === "done" ? "Lien copié" : copied === "manual" ? "Copiez le lien ci-dessus" : "Copier le lien"}
        </button>
        {shareable ? (
          <button
            type="button"
            onClick={() => void share()}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl font-extrabold text-chalk shadow-[inset_0_0_0_1.5px_color-mix(in_srgb,var(--color-reflect)_30%,transparent)] transition-colors hover:text-signal-400"
          >
            <Icon name="external" size={20} strokeWidth={2.4} />
            Partager
          </button>
        ) : null}
      </div>
      <p aria-live="polite" className="sr-only">
        {copied === "done" ? "Lien copié." : ""}
      </p>
    </div>
  );
}
