"use client";

import { DetourView, HomeLink } from "@/components/pages/errors/detour-view";
import { Icon } from "@/components/ui/icon";
import styles from "@/components/pages/errors/errors.module.css";

/**
 * Page d'erreur « Route barrée » (docs/09, F.10) : même décor que la 404, lampadaire éteint,
 * sans dépanneuse. Textes existants. Les boutons Appeler et WhatsApp de la barre d'action
 * (layout public) restent utilisables.
 */
export default function PublicError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <DetourView
      variant="error"
      pictogram="alert"
      title="Petite panne technique"
      lead={
        <>
          Cette page n&apos;a pas pu s&apos;afficher. Les boutons Appeler et WhatsApp en bas de l&apos;écran fonctionnent
          toujours.
        </>
      }
      actions={
        <>
          <button type="button" onClick={() => retry()} className={styles.retry}>
            <Icon name="refresh" size={20} strokeWidth={2.6} />
            Réessayer
          </button>
          <HomeLink>Accueil</HomeLink>
        </>
      }
    />
  );
}
