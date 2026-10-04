/**
 * E.2 · Le portique (docs/09) : il remplace le bandeau défilant. Une poutre en treillis enjambe
 * la route (qui prolonge celle de l'ouverture) ; le panneau à messages (P13) y est suspendu et
 * donne les faits, un message à la fois. Liste fermée de messages, rien d'inventé : la
 * disponibilité n'est affichée que si elle est réglée.
 * Ordinateur : une ligne LED ; mobile : deux lignes (UN seul panneau, `joinFrom="lg"`).
 * `off` et sans JavaScript : premier message.
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
  return { lines: [words.slice(0, best).join(" "), words.slice(best).join(" ")] };
}

/**
 * Messages en deux parties : deux lignes sur téléphone, une seule ligne à partir de 1 024 px
 * (`joinFrom="lg"`) réunie par `joiner` ; le texte sur une ligne est exactement celui de E.2.
 */
function messages(info: PublicSiteInfo): PmvMessage[] {
  const city = info.depot.city?.toLocaleUpperCase("fr-FR") ?? null;
  const availability = info.availability?.toLocaleUpperCase("fr-FR") ?? null;
  const dot = " · ";
  const list: PmvMessage[] = [
    { lines: ["PRIX ESTIMÉ", "EN MOINS D'UNE MINUTE"] },
    { lines: ["CONFIRMÉ PAR TÉLÉPHONE", "AVANT LE DÉPART"] },
    { lines: ["DÉPANNAGE SUR PLACE", "OU REMORQUAGE"] },
    city
      ? { lines: [`DÉPART DE ${city}`, "PARIS · ÎLE-DE-FRANCE"], joiner: dot }
      : { lines: ["PARIS", "ÎLE-DE-FRANCE"], joiner: dot },
    { lines: ["APPEL · WHATSAPP", "EN LIGNE"], joiner: dot },
  ];
  if (availability) list.push(twoLines(availability));
  return list;
}

export function Gantry({ info }: { info: PublicSiteInfo }) {
  return (
    <section id="portique" aria-label="Informations RNB AUTO" data-sky="minuit" className={styles.gantry}>
      {/* Charpente : poteaux et poutre en treillis, projecteurs tournés vers le panneau. */}
      <div className={styles.gantryDecor} aria-hidden="true">
        <span className={`${styles.post} ${styles.postLeft}`} />
        <span className={`${styles.post} ${styles.postRight}`} />
        <span className={styles.truss} />
      </div>
      <div className={styles.pmvSlot}>
        <Pmv messages={messages(info)} label="Informations RNB AUTO" joinFrom="lg" />
      </div>
      <div className={styles.gantryRoad} aria-hidden="true">
        <span className={styles.gantryGlow} />
        <span className={styles.gantryDash} />
      </div>
    </section>
  );
}
