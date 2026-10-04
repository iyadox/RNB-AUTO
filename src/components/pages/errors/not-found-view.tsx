/**
 * 404 « Route barrée » (docs/09, F.10) : textes existants, trois issues (demander un dépannage,
 * retour à l'accueil, appeler si le numéro est réglé), scène de la barrière et déviation.
 * Utilisée par `src/app/(public)/not-found.tsx` et par la 404 racine (`src/app/not-found.tsx`).
 */
import type { ReactElement } from "react";
import { CallLink, PrimaryLink } from "@/components/public/actions";
import { getPublicSiteInfo } from "@/server/site/public-info";
import { DetourView, HomeLink } from "./detour-view";

export async function NotFoundView(): Promise<ReactElement> {
  const info = await getPublicSiteInfo();
  return (
    <DetourView
      variant="notfound"
      pictogram="barrier"
      eyebrow="Erreur 404"
      title={
        <>
          Cette page est <em>en panne.</em>
        </>
      }
      lead={
        <>
          La page demandée n&apos;existe pas ou a été déplacée. Pas d&apos;inquiétude : nous pouvons toujours vous dépanner.
        </>
      }
      actions={
        <>
          <PrimaryLink href="/demande">Demander un dépannage</PrimaryLink>
          <HomeLink>Retour à l&apos;accueil</HomeLink>
          <CallLink phone={info.phone} size="lg" missing="hidden" />
        </>
      }
    />
  );
}
