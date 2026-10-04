/**
 * PK 04 · « Sur l'autoroute ? Votre sécurité d'abord. » (docs/09, E.6), `id="autoroute"`,
 * ciel `bleue`.
 *
 * La sécurité d'abord : le titre, le paragraphe et les quatre réflexes sont STATIQUES (aucune
 * montée, aucune apparition, aucune animation avant une consigne). Le décor (glissière et
 * catadioptres) et le schéma du relais viennent ensuite. La dépanneuse RNB AUTO n'apparaît
 * qu'après le panneau bleu « SORTIE » (HighwayRelay) : jamais sur une voie d'autoroute.
 */
import { Plate } from "@/components/public/page-blocks";
import { DirectionSign } from "@/components/scenes/kit/direction-sign";
import { HighwayRelay } from "@/components/scenes/kit/highway-relay";
import { InfoPlaque } from "@/components/scenes/kit/info-plaque";
import { cn } from "@/components/ui/cn";
import type { IconName } from "@/components/ui/icon";
import styles from "./home-lower.module.css";

const REFLEXES: { icon: IconName; text: string }[] = [
  { icon: "hazard", text: "Allumez vos feux de détresse et enfilez votre gilet avant de sortir." },
  { icon: "guardrail", text: "Mettez tout le monde à l'abri derrière la glissière de sécurité." },
  { icon: "callbox", text: "Appelez depuis une borne orange ou le 112 : le dépanneur agréé arrive." },
  { icon: "truck", text: "Une fois hors de l'autoroute, demandez-nous de prendre le relais." },
];

/** Glissière de sécurité vue de face, avec ses catadioptres (décor statique, pleine largeur). */
function Guardrail() {
  return (
    <div className={styles.guardrail} aria-hidden="true">
      <span className={styles.guardrailPosts} />
      <span className={styles.guardrailSweep} />
    </div>
  );
}

export function HighwaySection() {
  return (
    <section id="autoroute" data-sky="bleue" aria-labelledby="autoroute-titre" className={cn(styles.section, styles.highwaySection)}>
      <Guardrail />
      <div className={cn(styles.container, styles.highwayGrid)}>
        <div className={styles.highwayHead}>
          <Plate pk="04" tone="beacon" pictogram="alert">
            Panne sur autoroute
          </Plate>
          <h2 id="autoroute-titre" className={cn(styles.title, styles.highwayTitle, "mt-5")}>
            Sur l&apos;autoroute&nbsp;? <em>Votre sécurité d&apos;abord.</em>
          </h2>
        </div>
        <div className={styles.highwayText}>
          <p className={styles.lead}>
            Sur l&apos;autoroute et les voies rapides, seul le dépanneur agréé pour le secteur peut intervenir. Il sort votre
            véhicule de la voie. <strong className="font-bold text-chalk">RNB AUTO prend ensuite le relais</strong> et
            l&apos;emmène où vous voulez.
          </p>
        </div>

        {/* Les réflexes, fixés sur un mât comme des plaques de signalisation : jamais animés. */}
        <div className={styles.reflexMount}>
          <ol className={styles.reflexes}>
            {REFLEXES.map((reflex, index) => (
              <li key={reflex.text}>
                <InfoPlaque
                  number={index + 1}
                  pictogram={reflex.icon}
                  tone="beacon"
                  layout="inline"
                  title={reflex.text}
                  titleAs="p"
                  className={styles.reflex}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className={cn(styles.container, "mt-10 lg:mt-20")}>
        <div className={styles.relayFrame}>
          <HighwayRelay draw="scrub" className={styles.relay} />
        </div>
        <div className={styles.highwayLinks}>
          <DirectionSign
            href="/panne-autoroute"
            title="Que faire en cas de panne sur autoroute"
            arrow="right"
            pictogram="hazard"
            tone="beacon"
            size="compact"
          />
          <DirectionSign
            href="/demande?autoroute=1"
            title="Demander le relais"
            subtitle="Votre véhicule est sorti ?"
            arrow="right"
            pictogram="truck"
            tone="signal"
          />
        </div>
      </div>
    </section>
  );
}
