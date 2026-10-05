"use client";

/**
 * PK 01 · « Votre commune ? » (docs/09, F.3). Recherche dans les listes de la page, sans aucun
 * appel réseau, sans tenir compte des accents ni des majuscules.
 *
 * - Commune trouvée : « Oui, nous intervenons à {commune}. » et « Calculer mon prix → » ; la
 *   puce de la commune s'éclaire dans la liste du PK 02.
 * - Début de nom : propositions (boutons) pour compléter.
 * - Commune absente : « Pas dans la liste ? Envoyez quand même votre demande : nous vous
 *   rappelons avec un prix précis. »
 * Le panneau de localité affiche ce que l'on tape (décor, `aria-hidden`) ; le résultat est
 * annoncé dans une zone `aria-live`. La section entière est masquée sans JavaScript.
 */
import { useEffect, useId, useMemo, useState, type FormEvent, type ReactElement } from "react";
import { PrimaryLink } from "@/components/public/actions";
import { Skyline } from "@/components/scenes/base/skyline";
import { StreetLamps } from "@/components/scenes/base/street-lamps";
import { Icon } from "@/components/ui/icon";
import { AREAS, matchPlace, placeSlug, type PlaceMatch } from "./areas";
import { NoBreakHyphens } from "./no-break-hyphens";
import { ZoneRings } from "./zone-rings";
import styles from "./zones.module.css";

export function CommuneSearch(): ReactElement {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const match = useMemo(() => matchPlace(query), [query]);
  const found = match.kind === "found" ? match : null;

  // La puce de la commune trouvée s'éclaire dans la liste (« Paris 15e » → la puce Paris).
  useEffect(() => {
    if (!found) return;
    const chip =
      document.querySelector(`[data-place="${placeSlug(found.place)}"]`) ??
      (found.area.zone === "paris" ? document.querySelector('[data-place="paris"]') : null);
    chip?.setAttribute("data-found", "");
    // Nettoyage : à la saisie suivante comme au démontage (navigation vers une autre page).
    return () => chip?.removeAttribute("data-found");
  }, [found]);

  // Entrée : si la saisie est un début de nom, la première proposition est retenue.
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (match.kind === "suggest" && match.places[0]) setQuery(match.places[0].place);
  };

  return (
    <div className={styles.search}>
      <form role="search" className={styles.searchForm} onSubmit={onSubmit}>
        <label htmlFor={inputId} className="sr-only">
          Votre commune
        </label>
        <div className={styles.field}>
          <Icon name="search" size={24} strokeWidth={2.4} className={styles.fieldIcon} aria-hidden="true" />
          <input
            id={inputId}
            type="search"
            className={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pantin, Créteil, Paris…"
            autoComplete="address-level2"
            enterKeyHint="search"
            spellCheck={false}
            maxLength={60}
          />
          {query ? (
            <button type="button" className={styles.clear} onClick={() => setQuery("")} aria-label="Effacer la commune">
              <Icon name="x" size={22} strokeWidth={2.4} />
            </button>
          ) : null}
        </div>
        {match.kind === "suggest" ? (
          <ul className={styles.suggest} aria-label="Communes de la liste">
            {match.places.map(({ place }) => (
              <li key={place}>
                <button type="button" className={styles.suggestButton} onClick={() => setQuery(place)}>
                  <Icon name="pin" size={18} strokeWidth={2.2} aria-hidden="true" />
                  {place}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <div className={styles.result} aria-live="polite">
        <Result match={match} />
      </div>

      {/* Légende : les quatre secteurs, liens vers leur liste ; celui de la commune s'allume. */}
      <ul className={styles.legend}>
        {AREAS.map((area) => (
          <li key={area.zone}>
            <a
              href={`#secteur-${area.zone}`}
              className={styles.legendLink}
              data-on={found?.area.zone === area.zone ? "" : undefined}
            >
              <ZoneRings active={area.zone} className={styles.legendRings} />
              <span className={styles.legendLabel}>
                <NoBreakHyphens text={area.title} />
              </span>
              <Icon name="arrowRight" size={20} strokeWidth={2.4} className={styles.legendArrow} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>

      <TownSign query={query} match={match} />
    </div>
  );
}

function Result({ match }: { match: PlaceMatch }): ReactElement | null {
  if (match.kind === "found") {
    return (
      <div>
        <p key={match.place} className={`${styles.resultYes} ${styles.resultIn}`}>
          Oui, nous intervenons à{" "}
          <span className={styles.resultPlace}>
            <strong>{match.place}</strong>.
          </span>
        </p>
        <PrimaryLink href="/demande" className={styles.resultAction}>
          Calculer mon prix
        </PrimaryLink>
      </div>
    );
  }
  if (match.kind === "missing") {
    return (
      <div>
        <p className={`${styles.resultText} ${styles.resultIn}`}>
          <strong className="font-bold text-chalk">Pas dans la liste&nbsp;?</strong> Envoyez quand même votre demande&nbsp;: nous
          vous rappelons avec un prix précis.
        </p>
        <PrimaryLink href="/demande" className={styles.resultAction}>
          Demander un dépannage
        </PrimaryLink>
      </div>
    );
  }
  return null;
}

/**
 * Panneau de localité, version nuit, planté au bord d'une rue éclairée par deux lampadaires au
 * sodium (les sources de sa lumière), devant l'horizon de la ville. Il affiche ce que l'on tape
 * et s'éclaire quand la commune est desservie. Décor (`aria-hidden`).
 */
function TownSign({ query, match }: { query: string; match: PlaceMatch }): ReactElement {
  const state = match.kind === "found" ? "found" : match.kind === "missing" ? "missing" : "idle";
  const name = match.kind === "found" ? match.place : query.trim() || "Votre commune";
  return (
    <div className={styles.sign} data-state={state} data-inview-once="" aria-hidden="true">
      <Skyline layer="far" className={styles.signSkyline} />
      <StreetLamps count={2} className={styles.signLamps} />
      <div className={styles.signRoad} />
      <div className={styles.signStand}>
        <div className={styles.signPlate}>
          <ZoneRings active={match.kind === "found" ? match.area.zone : null} className={styles.signRings} />
          <span className={styles.signName}>{name}</span>
          <span className={styles.signArea}>{match.kind === "found" ? match.area.title : "\u00a0"}</span>
          {match.kind === "found" ? <span key={match.place} className={styles.signSweep} /> : null}
        </div>
        <div className={styles.signPosts}>
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
