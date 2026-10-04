import type { Metadata } from "next";
import { NotFoundView } from "@/components/pages/errors/not-found-view";
import { PublicShell } from "@/components/public/public-shell";

/** Titre de l'onglet « Page introuvable · RNB AUTO » (WCAG 2.4.2) ; sans lui, celui de l'accueil. */
export const metadata: Metadata = { title: "Page introuvable" };

/**
 * 404 racine : une adresse inconnue (« /route-inconnue ») n'appartient à aucun groupe de routes,
 * elle est rendue ici, hors du layout public. On remonte donc la même coque publique autour de
 * la page « Route barrée » (en-tête, pied de page, barre d'action, ciel, runtime).
 */
export default function RootNotFound() {
  return (
    <PublicShell>
      <NotFoundView />
    </PublicShell>
  );
}
