"use client";

/**
 * Script en ligne, premier enfant du layout public : pose `html.js` et `data-motion` avant le
 * premier affichage (docs/09, C.3). La politique de sécurité du site autorise les scripts en ligne.
 *
 * Le script n'existe que dans le HTML envoyé par le serveur (c'est là qu'il s'exécute). Quand le
 * layout est rendu dans le navigateur (navigation depuis /admin, par exemple), un script ne
 * s'exécuterait jamais et React le signalerait : on ne rend rien, et MotionRuntime pose le niveau.
 */
import { useSyncExternalStore, type ReactElement } from "react";
import { MOTION_BOOT_SCRIPT } from "./level";

const subscribe = () => () => {};
const onClient = () => true;
const onServer = () => false;

export function MotionHeadScript(): ReactElement | null {
  // Pendant l'hydratation, React lit la valeur « serveur » : le script rendu par le serveur est conservé.
  const clientRender = useSyncExternalStore(subscribe, onClient, onServer);
  if (clientRender) return null;
  return <script id="rnb-motion-boot" dangerouslySetInnerHTML={{ __html: MOTION_BOOT_SCRIPT }} />;
}
