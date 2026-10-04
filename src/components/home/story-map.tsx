"use client";
/**
 * La carte du récit « De la panne à la solution » (docs/09, E.4) : le Plan RNB autour du dépôt
 * (`PlanIdf variant="depot"`), l'épingle « Vous », l'étiquette du prix, les trois trajets de la
 * dépanneuse et le drapeau d'arrivée. Points ILLUSTRATIFS, cohérents avec l'exemple du moteur :
 * environ 6 km du dépôt jusqu'au client, puis environ 10 km de transport (repère 600 × 600 :
 * 300 unités = 12 km). Aucun nom de rue, aucune distance affichée.
 *
 * - `StoryMap` : la grande carte (collante sur ordinateur ; sur mobile, la mini-carte de
 *   l'étape 1, qui ne montre que le dépôt et l'épingle). Son fond est un `<symbol>` réutilisé
 *   par les mini-cartes, et les glyphes (dépanneuse, épingle, drapeau, dépôt) y sont définis UNE
 *   fois puis réutilisés (`<use>`) : budget de nœuds de l'accueil (G.2). Les trajets y sont en
 *   mode `static` : la scène « story » les trace au rythme des étapes (ordinateur).
 * - `MiniMap` : mobile, une mini-carte 16:10 par étape (le même symbole recadré), avec le
 *   tronçon de l'étape qui se dessine une fois à l'entrée (mode `view`, runtime du socle).
 * Trajets : même contrat et même code couleur que `RoutePaths` (P10), écrits ici en version
 * légère. Sans JavaScript et en `off` : tout est tracé, la dépanneuse est au drapeau.
 * Décoratif (`aria-hidden`) : tout est dit en texte à côté.
 *
 * Budget (G.2) : composant client (son dessin n'est pas répété dans la charge RSC) ; UNE seule
 * dépanneuse définie (`TruckTopGlyph dynamic`, vide ou chargée selon le tronçon, en CSS).
 * L'épingle « Vous » de la grande carte passe par la prop `points` de `PlanIdf` : les noms des
 * communes l'évitent (« Pantin » n'est plus recouvert).
 */
import type { ReactElement } from "react";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { DepotGlyph, FlagGlyph, PinGlyph, TruckTopGlyph } from "@/components/scenes/kit/glyphs";
import { PlanIdf, resolveDepotPosition } from "@/components/scenes/kit/plan-idf/plan-idf";
import { pathEnd, poseTransform, smoothPath } from "@/components/scenes/kit/svg-path";
import { planToGeo } from "./home-geo";
import { useDesktop } from "./use-desktop";
import styles from "./home.module.css";

/** Identifiants réutilisés par les mini-cartes (uniques dans la page). */
const STORY_SYMBOL = "story-plan";
const G_TRUCK = "story-g-truck";
const G_PIN = "story-g-pin";
const G_FLAG = "story-g-flag";
const G_DEPOT = "story-g-depot";
const G_TAG = "story-g-tag";

const DEPOT = { x: 300, y: 300 };
// L'épingle se tient sous le nom « Pantin » (plan étroit : noms agrandis), jamais dessus.
const YOU = { x: 168, y: 392 };
const DEST = { x: 380, y: 540 };

const ALLER = smoothPath([DEPOT, { x: 268, y: 320 }, { x: 230, y: 344 }, { x: 194, y: 366 }, YOU]);
const TRANSPORT = smoothPath([YOU, { x: 194, y: 428 }, { x: 258, y: 452 }, { x: 318, y: 484 }, { x: 352, y: 522 }, DEST]);
const RETOUR = smoothPath([DEST, { x: 428, y: 506 }, { x: 446, y: 446 }, { x: 410, y: 386 }, { x: 350, y: 336 }, { x: 312, y: 312 }]);
const RETOUR_SITE = smoothPath([YOU, { x: 206, y: 414 }, { x: 250, y: 400 }, { x: 284, y: 360 }, { x: 300, y: 318 }]);

type Leg = { key: string; style: "aller" | "transport" | "retour"; d: string };
const LEG_ALLER: Leg = { key: "aller", style: "aller", d: ALLER };
const LEG_TRANSPORT: Leg = { key: "transport", style: "transport", d: TRANSPORT };
const LEG_RETOUR: Leg = { key: "retour", style: "retour", d: RETOUR };
const LEG_RETOUR_SITE: Leg = { key: "retour", style: "retour", d: RETOUR_SITE };

const pose = (d: string) => {
  const end = pathEnd(d);
  return poseTransform(end.x, end.y, end.angle);
};

/**
 * Un trajet au contrat P10 (`data-route`, `data-route-leg`, tracés `draw` en pathLength 1,
 * pointillés révélés par un masque `data-draw-mask`, véhicule `data-route-truck` à l'arrivée).
 */
function Route({
  legs,
  mode,
  prefix,
  truck = 0,
  scale = 1,
  className,
}: {
  legs: Leg[];
  mode: "view" | "static";
  prefix: string;
  /** Taille de la dépanneuse (0 : aucune). */
  truck?: number;
  scale?: number;
  /** Classe ajoutée à la racine du trajet (ex. visible en « Remorquage » seulement). */
  className?: string;
}) {
  const last = legs[legs.length - 1]!;
  const dashed = legs.filter((leg) => leg.style !== "transport");
  return (
    <g data-route="" data-route-mode={mode} className={className ? `${styles.route} ${className}` : styles.route}>
      {/* Masques des pointillés (un <mask> n'est jamais dessiné : pas besoin de <defs>). */}
      {dashed.map((leg) => (
        <mask key={leg.key} id={`${prefix}-m-${leg.key}`} maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="600">
          <path
            id={`${prefix}-mp-${leg.key}`}
            className="draw"
            pathLength={1}
            d={leg.d}
            fill="none"
            stroke="#fff"
            strokeWidth={10 * scale}
            strokeLinecap="round"
          />
        </mask>
      ))}
      {legs.map((leg) =>
        leg.style === "transport" ? (
          <g key={leg.key} data-route-leg="transport">
            <path className={`draw ${styles.legGlow}`} pathLength={1} d={leg.d} fill="none" strokeWidth={15 * scale} strokeLinecap="round" />
            <path className={`draw ${styles.legTransport}`} pathLength={1} d={leg.d} fill="none" strokeWidth={5.5 * scale} strokeLinecap="round" />
          </g>
        ) : (
          <path
            key={leg.key}
            data-route-leg={leg.style}
            data-draw-mask={`${prefix}-mp-${leg.key}`}
            mask={`url(#${prefix}-m-${leg.key})`}
            d={leg.d}
            fill="none"
            className={leg.style === "aller" ? styles.legAller : styles.legRetour}
            strokeWidth={(leg.style === "aller" ? 3 : 2.4) * scale}
            strokeDasharray={leg.style === "aller" ? `${5 * scale} ${7 * scale}` : `${3 * scale} ${7 * scale}`}
            strokeLinecap="round"
          />
        ),
      )}
      {truck > 0 ? (
        <g
          data-route-truck=""
          transform={pose(last.d)}
          className={`${styles.routeTruck} ${last.style === "transport" ? styles.truckLoaded : ""}`}
        >
          <use href={`#${G_TRUCK}`} transform={truck === 1 ? undefined : `scale(${truck})`} />
        </g>
      ) : null}
    </g>
  );
}

/** Étiquette « Prix estimé · en 1 minute », un petit ticket accroché à l'épingle. */
function PriceTag() {
  return (
    <g id={G_TAG}>
      <path d="M158 334 L163 360" className={styles.tagLine} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="34" y="300" width="128" height="40" rx="3" className={styles.tagPaper} />
      <path d="M44 312h7v7h-7z" transform="rotate(45 47.5 315.5)" className={styles.tagMark} strokeWidth="1" />
      <text x="57" y="318" fontSize="8.6" fontWeight="800" className={styles.tagKicker} style={{ letterSpacing: "0.12em" }}>
        PRIX ESTIMÉ
      </text>
      <text x="44" y="333.5" fontSize="13" fontWeight="900" className={styles.tagText} style={{ fontStretch: "88%" }}>
        en 1 minute
      </text>
    </g>
  );
}

/** Épingle « Vous » (feux de détresse), posée sur le point du client. */
function Pin({ scale, label = true }: { scale: number; label?: boolean }) {
  return (
    <g className={styles.pin} transform={`translate(${YOU.x} ${YOU.y})`}>
      <use href={`#${G_PIN}`} transform={`scale(${scale})`} />
      {label ? (
        <text
          y={17 * scale}
          textAnchor="middle"
          fontSize={13 * scale}
          fontWeight="800"
          className={styles.pinLabel}
          strokeWidth={3.5 * scale}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          Vous
        </text>
      ) : null}
    </g>
  );
}

function Flag({ scale, className }: { scale: number; className?: string }) {
  return (
    <g transform={`translate(${DEST.x} ${DEST.y})`}>
      <g className={className}>
        <use href={`#${G_FLAG}`} transform={`scale(${scale})`} />
      </g>
    </g>
  );
}

export function StoryMap({ depot }: { depot: PublicSiteInfo["depot"] }): ReactElement {
  const known = resolveDepotPosition(depot) !== null;
  const you = planToGeo(YOU, depot);
  // Téléphone : la carte de l'étape 1 ne montre que le dépôt et l'épingle (le reste est masqué
  // en CSS) ; après l'hydratation, ces calques ne sont plus rendus du tout.
  const desktop = useDesktop();
  const full = desktop !== false;
  // Les trajets sont un calque du plan : sous les noms, le losange du dépôt et l'épingle.
  const routes = (
    <g className={styles.routes}>
      <g data-story-route="tow">
        <Route legs={[LEG_ALLER, LEG_TRANSPORT]} mode="static" prefix="story-a" truck={1.45} scale={1.3} />
      </g>
      <g data-story-route="back" className={styles.towOnly}>
        <Route legs={[LEG_RETOUR]} mode="static" prefix="story-r" scale={1.3} />
      </g>
      <g data-story-route="back-site" className={styles.retourSite}>
        <Route legs={[LEG_RETOUR_SITE]} mode="static" prefix="story-s" scale={1.3} />
      </g>
      <g className={styles.siteTruck} transform={pose(ALLER)}>
        <use href={`#${G_TRUCK}`} transform="scale(1.45)" />
      </g>
    </g>
  );
  return (
    <div className={styles.mapFrame}>
      <div className="tilt-cam-frame">
        <div data-tilt-cam="" className={styles.mapPlane}>
          <div className={styles.planBox}>
            <PlanIdf
              depot={depot}
              variant="depot"
              labels="all"
              symbolId={STORY_SYMBOL}
              points={[{ kind: "vous", lat: you.lat, lng: you.lng }]}
              underlay={full ? routes : null}
              className={styles.plan}
            >
              <defs>
                <g id={G_TRUCK}>
                  <TruckTopGlyph headlights dynamic />
                </g>
                {/* Épingle des mini-cartes (téléphone) ; la grande carte a la sienne (`points`). */}
                {desktop === true ? null : (
                  <g id={G_PIN}>
                    <PinGlyph hazards />
                  </g>
                )}
                <g id={G_FLAG}>
                  <FlagGlyph />
                </g>
                <g id={G_DEPOT}>
                  <DepotGlyph />
                </g>
                <PriceTag />
              </defs>
              {known ? null : <use href={`#${G_DEPOT}`} x={DEPOT.x} y={DEPOT.y} />}
              {full ? (
                <>
                  <Flag scale={1.4} className={`${styles.flag} ${styles.towOnly}`} />
                  <use href={`#${G_TAG}`} className={styles.priceTag} />
                </>
              ) : null}
            </PlanIdf>
            {/* Onde du dépôt en calque HTML (seules l'échelle et l'opacité varient) : l'onde SVG du
                kit repeignait tout le plan à chaque image (G.2). Le dépôt est au centre du plan. */}
            {known ? (
              <span className={`${styles.depotPulse} animate-pulse-ring`} data-pause-offscreen="" aria-hidden="true" />
            ) : null}
          </div>
          {full ? (
            <div className={styles.mapLegend} aria-hidden="true">
              <span className="text-small font-bold">
                <span className={styles.swatch} />1 Aller
              </span>
              <span className={`${styles.towOnly} text-small font-bold`}>
                <span className={`${styles.swatch} ${styles.swatchTransport}`} />2 Transport
              </span>
              <span className="text-small font-bold">
                <span className={`${styles.swatch} ${styles.swatchRetour}`} />
                <span className={styles.towOnly}>3</span>
                <span className={styles.siteOnly}>2</span> Retour
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <p className={`${styles.mapNote} text-small`}>Plan schématique.</p>
    </div>
  );
}

/**
 * Recadrages 16:10 des mini-cartes (repère du plan), calés sur YOU, le dépôt et DEST : à revoir
 * si l'un de ces points bouge (l'épingle et « Vous » doivent rester entiers dans le cadre).
 */
const VIEWS: Record<2 | 3 | 4, string> = {
  2: "20 280 240 150",
  3: "113 267 240 150",
  4: "60 298 448 280",
};

export function MiniMap({ step }: { step: 2 | 3 | 4 }): ReactElement | null {
  // Ordinateur : la carte collante remplace les mini-cartes (masquées en CSS, retirées après
  // l'hydratation).
  if (useDesktop() === true) return null;
  return (
    <div className={styles.mini} aria-hidden="true" data-pause-offscreen="">
      <svg viewBox={VIEWS[step]} preserveAspectRatio="xMidYMid slice">
        <use href={`#${STORY_SYMBOL}`} width="600" height="600" />
        <use href={`#${G_DEPOT}`} x={DEPOT.x} y={DEPOT.y} />
        {step === 2 ? <use href={`#${G_TAG}`} /> : null}
        {step === 3 ? <Route legs={[LEG_ALLER]} mode="view" prefix="story-m3" truck={0.9} scale={0.8} /> : null}
        {step === 4 ? (
          <>
            <Route legs={[LEG_RETOUR]} mode="view" prefix="story-m4r" className={styles.towOnly} />
            <Route legs={[LEG_RETOUR_SITE]} mode="view" prefix="story-m4s" className={styles.retourSite} />
            <Route legs={[LEG_TRANSPORT]} mode="view" prefix="story-m4t" truck={1.1} className={styles.towOnly} />
            <use href={`#${G_FLAG}`} transform={`translate(${DEST.x} ${DEST.y})`} className={styles.towOnly} />
            <g className={styles.siteTruck} transform={pose(ALLER)}>
              <use href={`#${G_TRUCK}`} />
            </g>
          </>
        ) : null}
        <Pin scale={step === 4 ? 1 : 0.75} label={step !== 4} />
      </svg>
    </div>
  );
}
