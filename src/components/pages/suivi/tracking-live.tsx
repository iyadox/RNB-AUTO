"use client";

/**
 * Suivi « en direct » : tant que la demande n'est pas clôturée, la page se met à jour toute
 * seule (nouvelle lecture côté serveur toutes les 20 s, et dès que l'onglet redevient visible).
 * Rien n'est calculé dans le navigateur : il redemande simplement la page.
 *
 * Sans JavaScript, « Actualiser » est un simple lien vers la même adresse.
 * Un changement d'étape est annoncé aux lecteurs d'écran (zone `aria-live`, sans le premier rendu).
 */
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";
import styles from "./suivi.module.css";

export function TrackingLive({
  closed,
  intervalMs,
  updatedLabel,
  href,
  className,
}: {
  closed: boolean;
  intervalMs: number;
  /** Heure de la dernière lecture (« 14:32 »), calculée par le serveur. */
  updatedLabel: string;
  /** Adresse de la page (lien « Actualiser » sans JavaScript). */
  href: string;
  className?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (closed) return;
    const refresh = () => {
      if (document.visibilityState === "visible" && navigator.onLine !== false) router.refresh();
    };
    const timer = window.setInterval(refresh, intervalMs);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [closed, intervalMs, router]);

  return (
    <p className={cn(styles.live, "flex-wrap text-[0.9375rem] text-asphalt-200", className)}>
      <span className={styles.liveDot} data-closed={closed ? "" : undefined} aria-hidden="true" />
      <span className="font-bold text-chalk">{closed ? "Suivi terminé" : "En direct"}</span>
      {closed ? null : (
        <>
          <span aria-hidden="true">·</span>
          <span>Mis à jour à {updatedLabel}</span>
          <a href={href} className="ml-1 inline-flex min-h-11 items-center gap-1.5 font-bold text-signal-400 underline-offset-4 hover:underline">
            <Icon name="refresh" size={16} strokeWidth={2.4} />
            Actualiser
          </a>
        </>
      )}
    </p>
  );
}
