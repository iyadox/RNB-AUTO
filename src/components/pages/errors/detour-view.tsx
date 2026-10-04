"use client";

/**
 * Page « Route barrée » (docs/09, F.10) : ouverture (texte, issues, scène) puis la déviation,
 * un mât de jalonnement vers les pages du site (libellés et aides du menu, `MENU_ITEMS`).
 * Partagée par la 404 (composant serveur) et la page d'erreur (composant client) : aucun accès
 * serveur ici, les actions sont fournies par l'appelant.
 *
 * Composant client : la 404 racine et celle du groupe (public) sont recopiées dans la charge RSC
 * de CHAQUE page (frontières `notFound` des layouts). En composant client, la charge ne contient
 * plus qu'une référence et les textes passés en propriétés ; le balisage de la scène et de la
 * déviation est dans le même fichier JavaScript que la page d'erreur (déjà client), mis en cache.
 * Le rendu serveur (HTML) est inchangé : tout s'affiche et fonctionne sans JavaScript.
 *
 * Le titre, le texte et les actions sont visibles et immobiles dès la première image ; aucune
 * animation sur le texte. Seule la scène bouge (lumières, arrivée de la dépanneuse).
 *
 * `data-calm="full"` sur la racine : page calme (docs/09, C.6, « Lenis et halo : Non »). L'adresse
 * d'une 404 est arbitraire : le runtime lit ce marqueur au lieu de la liste des routes calmes.
 */
import Link from "next/link";
import type { ReactElement, ReactNode } from "react";
import { MENU_ITEMS } from "@/content/site-map";
import { PageTransition } from "@/components/motion/page-transition";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { DetourScene, type DetourVariant } from "./detour-scene";
import styles from "./errors.module.css";

const CONTAINER = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

/** Pictogramme de chaque page (décor). */
const PICTOGRAMS: Record<string, IconName> = {
  "/depannage": "wrench",
  "/remorquage": "truck",
  "/panne-autoroute": "road",
  "/zones-d-intervention": "map",
  "/questions-frequentes": "question",
  "/entreprise": "garage",
  "/contact": "phone",
};

type DetourViewProps = {
  variant: DetourVariant;
  /** Pictogramme et texte de la plaque (« Erreur 404 »). */
  pictogram: IconName;
  eyebrow?: string;
  title: ReactNode;
  lead: ReactNode;
  actions: ReactNode;
};

export function DetourView({ variant, pictogram, eyebrow, title, lead, actions }: DetourViewProps): ReactElement {
  return (
    <PageTransition>
      <div data-calm="full">
        <section id="route-barree" data-sky="minuit" className={styles.detour}>
          <div className={cn(CONTAINER, styles.detourGrid)}>
            <div className={styles.detourText}>
              <p className={styles.plate}>
                <span className={styles.platePicto} aria-hidden="true">
                  <Icon name={pictogram} size={18} strokeWidth={2.4} />
                </span>
                {eyebrow ? <span className="font-plate text-plate">{eyebrow}</span> : null}
              </p>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.lead}>{lead}</p>
              <div className={styles.actions}>{actions}</div>
            </div>
            <div className={styles.stage}>
              <DetourScene variant={variant} id={`detour-${variant}`} />
            </div>
          </div>
        </section>

        <section id="deviation" data-sky="nuit" aria-labelledby="deviation-titre" className={styles.deviation}>
          <div className={CONTAINER}>
            <div className={styles.deviationHead}>
              <h2 id="deviation-titre" className={styles.deviationTitle}>
                Déviation
                <Icon name="arrowRight" size={26} strokeWidth={3} className="rotate-45" />
              </h2>
            </div>
            <nav aria-labelledby="deviation-titre" className={styles.mast}>
              <ul className={styles.mastList}>
                {MENU_ITEMS.filter((item) => item.href !== "/").map((item) => (
                  <li key={item.href} className={styles.mastItem}>
                    <Link href={item.href} className={styles.blade}>
                      <span className={styles.bladeFace}>
                        <span className={styles.bladePicto} aria-hidden="true">
                          <Icon name={PICTOGRAMS[item.href] ?? "arrowRight"} size={20} strokeWidth={2.3} />
                        </span>
                        <span>
                          <span className={styles.bladeLabel}>{item.label}</span>
                          <span className={styles.bladeHelp}>{item.help}</span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}

/** Lien secondaire des pages d'erreur (« Retour à l'accueil », « Accueil »). */
export function HomeLink({ children }: { children: ReactNode }): ReactElement {
  return (
    <Link href="/" className={styles.homeLink}>
      <Icon name="home" size={20} strokeWidth={2.4} />
      {children}
    </Link>
  );
}
