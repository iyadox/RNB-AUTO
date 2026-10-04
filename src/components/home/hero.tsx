/**
 * E.1 · L'ouverture de l'accueil (docs/09) : le décor de nuit que le client apprécie, conservé
 * et enrichi. Le titre, l'accroche et les boutons sont visibles et immobiles dès la première
 * image (aucune apparition, aucun délai) ; seule une lumière de phare passe sur « dépannage ? »
 * (P4, CSS seul). La scène (`NightRoad`) freine au défilement (scène « hero-brake »).
 */
import type { PublicSiteInfo } from "@/server/site/public-info";
import { ScenePause } from "@/components/motion/scene-pause";
import { CallLink, PrimaryLink, WhatsAppLink } from "@/components/public/actions";
import { Icon } from "@/components/ui/icon";
import { MediaGate } from "./media-gate";
import { NightRoad, SCENE_ID } from "./night-road";
import styles from "./home.module.css";

const REASSURANCE = ["Prix estimé en ligne", "Confirmé avant de partir", "Appel, WhatsApp ou en ligne"];

/** Pastille : la disponibilité (point vert) si elle est réglée, sinon la ville du dépôt. */
function HeroBadge({ info }: { info: PublicSiteInfo }) {
  if (info.availability) {
    return (
      <p className={styles.heroBadge}>
        <span className={styles.heroDot} aria-hidden="true">
          <span className="animate-pulse-ring" />
          <span />
        </span>
        <span className="font-plate text-plate">{info.availability}</span>
      </p>
    );
  }
  return (
    <p className={styles.heroBadge}>
      <Icon name="pin" size={16} strokeWidth={2.4} className={styles.heroBadgePin} aria-hidden="true" />
      <span className="font-plate text-plate">
        {info.depot.city ? `${info.depot.city} · Île-de-France` : "Île-de-France"}
      </span>
    </p>
  );
}

export function Hero({ info }: { info: PublicSiteInfo }) {
  return (
    <section id="ouverture" data-sky="minuit" className={styles.hero}>
      <div className={styles.container}>
        <div data-hero-copy className={styles.heroCopy}>
          <div data-hero-fade>
            <HeroBadge info={info} />
            <h1 className={styles.heroTitle}>
              Besoin d&apos;un{" "}
              <em data-beam="load" className="not-italic">
                dépannage{" "}?
              </em>
            </h1>
            <p className={styles.heroLead}>
              {/* Requêtes en rem, comme les classes Tailwind `sm:`/`md:` qu'elles doublent : avec une
                  taille de police du navigateur agrandie, px et rem divergent (texte perdu). */}
              <MediaGate query="(min-width: 40rem)">
                <span className="hidden sm:inline">Remorquage et assistance à {info.serviceArea}. </span>
              </MediaGate>
              <MediaGate query="not all and (min-width: 40rem)">
                <span className="sm:hidden">Remorquage et assistance en Île-de-France. </span>
              </MediaGate>
              <strong>Votre prix estimé en moins d&apos;une minute</strong>, confirmé avant l&apos;intervention.
            </p>
          </div>

          <div className={styles.heroActions}>
            <PrimaryLink href="/demande" size="lg" className="w-full sm:w-auto">
              Demander un dépannage
            </PrimaryLink>
            <MediaGate query="(min-width: 48rem)">
              <div className="hidden gap-3 md:flex">
                <CallLink phone={info.phone} label="short" size="lg" />
                <WhatsAppLink whatsapp={info.whatsapp} size="lg" />
              </div>
            </MediaGate>
          </div>

          {/* Réassurance entre 640 et 1 023 px seulement (E.1) : retirée ailleurs après l'hydratation. */}
          <MediaGate query="(min-width: 640px) and (max-width: 1023px)">
            <ul data-hero-fade className={`${styles.heroReassure} text-small`}>
              {REASSURANCE.map((item) => (
                <li key={item}>
                  <Icon name="check" size={16} strokeWidth={3} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </MediaGate>
        </div>
      </div>

      <NightRoad>
        <ScenePause targetId={SCENE_ID} className={styles.heroPause} />
      </NightRoad>
      <MediaGate query="(min-width: 1024px)">
        <div className={styles.heroCue} aria-hidden="true">
          <span className="font-plate text-plate">Défiler</span>
          <span className={styles.heroCueRail}>
            <span className="animate-scroll-cue" />
          </span>
        </div>
      </MediaGate>
    </section>
  );
}
