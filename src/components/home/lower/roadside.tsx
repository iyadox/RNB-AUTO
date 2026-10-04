"use client";
/**
 * Bord de route de la section « Vos questions » (docs/09, E.8) : ligne de rive, balises en rang
 * et la borne kilométrique PK 06. Décor entièrement immobile (section calme), `aria-hidden`.
 * Composant client : son dessin n'est pas répété dans la charge RSC de la page (G.2).
 */
import type { ReactElement } from "react";
import styles from "../home-lower.module.css";

/** Borne kilométrique au tracé de la signalisation : tête jaune, fût clair, socle (décor). */
function Milestone(): ReactElement {
  return (
    <svg viewBox="0 0 120 200" className={styles.milestone} aria-hidden="true">
      <ellipse cx="60" cy="192" rx="54" ry="6" style={{ fill: "var(--color-night-950)" }} opacity="0.7" />
      <path d="M18 188V70a42 42 0 0 1 84 0v118Z" style={{ fill: "var(--color-asphalt-100)" }} />
      <path d="M18 70a42 42 0 0 1 84 0v12H18Z" style={{ fill: "var(--color-signal-500)" }} />
      <path d="M102 70v118h-10V76c0-20-10-34-26-40 20 2 36 16 36 34Z" style={{ fill: "var(--color-asphalt-300)" }} opacity="0.55" />
      <rect x="14" y="184" width="92" height="8" rx="2" style={{ fill: "var(--color-asphalt-600)" }} />
      <text
        x="60"
        y="68"
        textAnchor="middle"
        style={{ fill: "var(--color-ink)", fontSize: 15, fontWeight: 800, letterSpacing: "0.12em" }}
      >
        PK
      </text>
      <text
        x="60"
        y="134"
        textAnchor="middle"
        className="font-figure"
        style={{ fill: "var(--color-ink)", fontSize: 46 }}
      >
        06
      </text>
      <path d="M32 152h56" style={{ stroke: "var(--color-ink)" }} strokeOpacity="0.25" strokeWidth="2" />
    </svg>
  );
}

export function Roadside(): ReactElement {
  return (
    <div className={styles.roadside} aria-hidden="true">
      <svg className={styles.delineators} preserveAspectRatio="xMinYMax slice" viewBox="0 0 1600 80">
        <defs>
          <pattern id="faq-balises" width="200" height="80" patternUnits="userSpaceOnUse">
            <rect x="96" y="22" width="9" height="54" rx="2" style={{ fill: "var(--color-asphalt-200)" }} opacity="0.75" />
            <rect x="96" y="30" width="9" height="12" style={{ fill: "var(--color-night-950)" }} />
            <rect x="97.5" y="32" width="6" height="8" rx="1" style={{ fill: "var(--color-beacon-400)" }} opacity="0.85" />
          </pattern>
        </defs>
        <rect width="1600" height="80" fill="url(#faq-balises)" />
      </svg>
      <Milestone />
    </div>
  );
}
