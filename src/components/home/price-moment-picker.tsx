"use client";

/**
 * Le sélecteur « Quand ? » de la section prix (docs/09, E.5) : En journée | La nuit | Le dimanche.
 * Trois boutons segmentés (48 px) qui changent l'exemple affiché par le ticket, avec les valeurs
 * calculées par le SERVEUR (jamais un montant calculé ici). Le compteur roule de l'ancien au
 * nouveau prix (700 ms) et la fenêtre de rue suit l'heure (`data-moment`).
 *
 * Sans JavaScript : exemple « En journée » seulement, sélecteur masqué (CSS, `html:not(.js)`).
 * En « moins d'animations » : changement instantané.
 */
import { useId, useState, type ReactNode } from "react";
import { EstimateTicket } from "@/components/scenes/kit/estimate-ticket";
import { cn } from "@/components/ui/cn";
import type { HomePriceExamples } from "@/server/site/price-examples";
import { exampleFootnote } from "./lower/example-footnote";
import styles from "./home-lower.module.css";

type Moment = keyof HomePriceExamples;

const MOMENTS: { key: Moment; label: string; scene: "day" | "night" | "sunday" }[] = [
  { key: "weekday", label: "En journée", scene: "day" },
  { key: "night", label: "La nuit", scene: "night" },
  { key: "sunday", label: "Le dimanche", scene: "sunday" },
];

export function PriceMomentPicker({
  examples,
  vehicle,
  scene,
}: {
  examples: HomePriceExamples;
  /** « citadine en panne » : véhicule du trajet type. */
  vehicle: string;
  /** Fenêtre de rue, rendue par le serveur. */
  scene: ReactNode;
}) {
  const [moment, setMoment] = useState<Moment>("weekday");
  const labelId = useId();
  const choices = MOMENTS.filter((m) => examples[m.key] !== null);
  const example = examples[moment] ?? examples.weekday;
  const sceneMoment = MOMENTS.find((m) => m.key === moment)?.scene ?? "day";

  return (
    <div className={styles.stage} data-moment={sceneMoment}>
      <div className={styles.window} data-inview-once="">
        {scene}
      </div>

      {choices.length > 1 ? (
        <div className={styles.picker}>
          <p id={labelId} className={cn(styles.pickerLabel, "font-plate text-plate")}>
            Quand ?
          </p>
          <div role="group" aria-labelledby={labelId} className={styles.pickerGroup}>
            {choices.map((choice) => (
              <button
                key={choice.key}
                type="button"
                aria-pressed={moment === choice.key}
                onClick={() => setMoment(choice.key)}
                className={styles.pickerButton}
              >
                <span className={styles.pickerLed} aria-hidden="true" />
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.ticketSlot}>
        <EstimateTicket
          priceCents={example.priceTtcCents}
          priceLabel="Total estimé TTC"
          lines={example.includedLabels}
          stamp="exemple"
          footnote={exampleFootnote(example, vehicle)}
          className={styles.ticket}
        />
      </div>
    </div>
  );
}
