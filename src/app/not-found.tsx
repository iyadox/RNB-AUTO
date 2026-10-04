import { NotFoundView } from "@/components/pages/errors/not-found-view";
import { PublicShell } from "@/components/pages/errors/public-shell";

/**
 * 404 racine : une adresse inconnue (« /route-inconnue ») n'appartient à aucun groupe de routes,
 * elle est rendue ici, hors du layout public. On remonte donc la coque publique autour de la
 * page « Route barrée » (en-tête, pied de page, barre d'action, ciel, runtime).
 */
export default function RootNotFound() {
  return (
    <PublicShell>
      <NotFoundView />
    </PublicShell>
  );
}
