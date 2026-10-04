/**
 * E.2 · Le portique (docs/09) : il remplace le bandeau défilant. Une poutre en treillis enjambe
 * la route (qui prolonge celle de l'ouverture) ; le panneau à messages (P13) y est suspendu et
 * donne les faits, un message à la fois. Liste fermée de messages, rien d'inventé : la
 * disponibilité n'est affichée que si elle est réglée.
 * Ordinateur : une ligne LED ; mobile : deux lignes. `off` et sans JavaScript : premier message.
 */
import type { PublicSiteInfo } from "@/server/site/public-info";
import { Pmv, type PmvMessage } from "@/components/motion/pmv";
import styles from "./home.module.css";

/** Coupe un message en deux lignes à peu près égales, sur une espace (mobile). */
function twoLines(text: string): PmvMessage {
  const words = text.split(" ");
  if (words.length < 2) return text;
  let best = 1;
  let bestGap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const gap = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (gap < bestGap) {
      bestGap = gap;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

function messages(info: PublicSiteInfo): { wide: PmvMessage[]; narrow: PmvMessage[] } {
  const city = info.depot.city?.toLocaleUpperCase("fr-FR") ?? null;
  const availability = info.availability?.toLocaleUpperCase("fr-FR") ?? null;
  const wide: PmvMessage[] = [
    "PRIX ESTIMÉ EN MOINS D'UNE MINUTE",
    "CONFIRMÉ PAR TÉLÉPHONE AVANT LE DÉPART",
    "DÉPANNAGE SUR PLACE OU REMORQUAGE",
    city ? `DÉPART DE ${city} · PARIS · ÎLE-DE-FRANCE` : "PARIS · ÎLE-DE-FRANCE",
    "APPEL · WHATSAPP · EN LIGNE",
  ];
  const narrow: PmvMessage[] = [
    ["PRIX ESTIMÉ", "EN MOINS D'UNE MINUTE"],
    ["CONFIRMÉ PAR TÉLÉPHONE", "AVANT LE DÉPART"],
    ["DÉPANNAGE SUR PLACE", "OU REMORQUAGE"],
    city ? [`DÉPART DE ${city}`, "PARIS · ÎLE-DE-FRANCE"] : ["PARIS", "ÎLE-DE-FRANCE"],
    ["APPEL · WHATSAPP", "EN LIGNE"],
  ];
  if (availability) {
    wide.push(availability);
    narrow.push(twoLines(availability));
  }
  return { wide, narrow };
}

export function Gantry({ info }: { info: PublicSiteInfo }) {
  const { wide, narrow } = messages(info);
  return (
    <section id="portique" aria-label="Informations RNB AUTO" data-sky="minuit" className={styles.gantry}>
      {/* Charpente : poteaux et poutre en treillis, projecteurs tournés vers le panneau. */}
      <div className={styles.gantryDecor} aria-hidden="true">
        <span className={`${styles.post} ${styles.postLeft}`} />
        <span className={`${styles.post} ${styles.postRight}`} />
        <span className={styles.truss} />
        <span className={styles.flood} style={{ left: "calc(50% - 7rem)" }} />
        <span className={styles.flood} style={{ left: "calc(50% + 5.9rem)" }} />
        <span className={styles.floodBeam} style={{ left: "calc(50% - 6.45rem)" }} />
        <span className={styles.floodBeam} style={{ left: "calc(50% + 6.45rem)" }} />
      </div>
      <div className={styles.pmvSlot}>
        <Pmv messages={narrow} label="Informations RNB AUTO" className="lg:hidden" />
        <Pmv messages={wide} label="Informations RNB AUTO" className="hidden lg:grid" />
      </div>
      <div className={styles.gantryRoad} aria-hidden="true">
        <span className={styles.gantryGlow} />
        <span className={styles.gantryDash} />
      </div>
    </section>
  );
}
