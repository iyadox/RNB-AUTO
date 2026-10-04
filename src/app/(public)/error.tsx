"use client";

import { DetourView, HomeLink } from "@/components/pages/errors/detour-view";
import { Icon } from "@/components/ui/icon";
import styles from "@/components/pages/errors/errors.module.css";

/**
 * Page d'erreur « Route barrée » (docs/09, F.10) : même décor que la 404, lampadaire éteint,
 * sans dépanneuse. Textes existants. Les boutons Appeler et WhatsApp de la barre d'action
 * (téléphone) et Appeler de l'en-tête (tablette et ordinateur) restent utilisables : la phrase
 * qui les désigne suit l'écran.
 */
export default function PublicError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <DetourView
      variant="error"
      pictogram="alert"
      title="Petite panne technique"
      lead={
        <>
          Cette page n&apos;a pas pu s&apos;afficher.{" "}
          {/* Téléphone : la barre d'action est en bas de l'écran (texte existant). À partir de
              768 px, il n'y a plus de barre : Appeler est dans l'en-tête, s'il y est (CSS). */}
          <span className={styles.leadMobile}>
            Les boutons Appeler et WhatsApp en bas de l&apos;écran fonctionnent toujours.
          </span>
          <span className={styles.leadDesktop}>Le bouton Appeler en haut de l&apos;écran fonctionne toujours.</span>
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
