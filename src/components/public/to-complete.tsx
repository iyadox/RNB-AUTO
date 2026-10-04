/**
 * Marqueur visible pour une information que RNB AUTO doit encore fournir : une zone de chantier,
 * bordure à chevrons orange et noirs (F.9), texte orange sur fond de nuit. Impossible à manquer,
 * jamais confondu avec une vraie donnée. Il laisse 0,5 em à la ponctuation qui le suit (le point
 * ne passe pas seul à la ligne).
 *
 * Sans état ni accès serveur : utilisable par les pages (serveur) et par le pied de page (client).
 */
import { cn } from "@/components/ui/cn";
import styles from "./to-complete.module.css";

export function ToComplete({ label }: { label?: string }) {
  // Marqueur court (« À COMPLÉTER : email ») : jamais coupé. Dans un parent qui prend la largeur
  // de son contenu (élément flex, cellule), la place gardée pour la ponctuation le faisait passer
  // sur deux lignes (« À COMPLÉTER : / email »).
  const short = (label?.length ?? 0) <= 12;
  return (
    <span className={cn(styles.toComplete, short && styles.toComplete_short)}>
      <span className={styles.toCompleteFace}>À COMPLÉTER{label ? ` : ${label}` : ""}</span>
    </span>
  );
}
