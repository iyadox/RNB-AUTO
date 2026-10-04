import type { Metadata } from "next";
import { NotFoundView } from "@/components/pages/errors/not-found-view";

/** Titre de l'onglet « Page introuvable · RNB AUTO » (WCAG 2.4.2). */
export const metadata: Metadata = { title: "Page introuvable" };

/** 404 « Route barrée » dans la coque publique (docs/09, F.10). */
export default function NotFound() {
  return <NotFoundView />;
}
