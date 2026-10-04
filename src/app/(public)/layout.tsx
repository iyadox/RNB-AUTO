import { PublicShell } from "@/components/public/public-shell";

// Les pages publiques sont générées à l'avance (rapides), puis rafraîchies toutes les 5 minutes
// ou immédiatement après une modification dans l'administration.
export const revalidate = 300;

/** Coque du site public (docs/09, D.1) : composition partagée avec la 404 racine. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
