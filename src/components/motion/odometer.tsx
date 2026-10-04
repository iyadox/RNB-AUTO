"use client";

/**
 * P11 · Odometer : les chiffres roulent comme ceux d'un compteur kilométrique.
 * Le serveur rend le VRAI texte (« 105 € ») ; pendant le roulement il reste dans l'arbre
 * d'accessibilité (simplement rendu transparent) et des colonnes décoratives `aria-hidden`
 * passent par-dessus, en chiffres de largeur fixe : aucun décalage de mise en page.
 * Jamais sur un numéro de téléphone ni sur une référence de demande.
 * `off`, préférence « moins d'animations » et sans JavaScript : valeur fixe.
 */
import { useEffect, useRef } from "react";
import { formatEurosShort } from "@/core/format";
import { cn } from "@/components/ui/cn";
import { currentMotionLevel } from "./level";

type OdometerProps = {
  /** Valeur dans l'unité affichée (euros, kilomètres), telle que renvoyée par le serveur. */
  value: number;
  unit?: "€" | "km" | null;
  /** `view` : roule à l'entrée dans l'écran ; `mount` : dès l'affichage. */
  trigger?: "view" | "mount";
  /** Durée totale en ms (par défaut `--dur-odometer` : 1 100 ms, 700 ms sur /demande). */
  duration?: number;
  className?: string;
};

const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export function formatOdometer(value: number, unit: OdometerProps["unit"]): string {
  if (unit === "€") return formatEurosShort(Math.round(value * 100));
  if (unit === "km") return `${numberFormat.format(value)} km`;
  return numberFormat.format(value);
}

/** Lit une durée CSS (« 700ms » ou « 1.1s », la minification change l'unité) en millisecondes. */
function cssDurationMs(value: string): number {
  const number = parseFloat(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  return /\d\s*s\s*$/.test(value.trim()) && !/ms\s*$/.test(value.trim()) ? number * 1000 : number;
}

/** Construit les colonnes et lance le roulement. Retourne l'arrêt (qui remet le vrai texte). */
function roll(root: HTMLElement, text: string, duration: number): () => void {
  const valueEl = root.querySelector<HTMLElement>(".odometer-value");
  if (!valueEl) return () => {};
  // Hauteur de la ligne (boîte de la racine), pas celle des glyphes : chaque cellule fait
  // exactement la hauteur visible de la colonne et son chiffre tombe sur la ligne de base du
  // vrai texte. Sinon la colonne laisse voir les chiffres voisins et le texte saute à la fin.
  const height = root.getBoundingClientRect().height || valueEl.getBoundingClientRect().height;
  if (!height) return () => {};

  const overlay = document.createElement("span");
  overlay.className = "odometer-roll";
  overlay.setAttribute("aria-hidden", "true");
  const strips: { strip: HTMLElement; digit: number }[] = [];
  for (const char of Array.from(text)) {
    if (/\d/.test(char)) {
      const col = document.createElement("span");
      col.className = "odometer-col";
      const strip = document.createElement("span");
      strip.className = "odometer-strip";
      for (let i = 0; i < 20; i++) {
        const cell = document.createElement("span");
        cell.textContent = String(i % 10);
        cell.style.height = `${height}px`;
        cell.style.lineHeight = `${height}px`;
        strip.appendChild(cell);
      }
      col.appendChild(strip);
      overlay.appendChild(col);
      strips.push({ strip, digit: Number(char) });
    } else {
      const glyph = document.createElement("span");
      glyph.textContent = char;
      glyph.style.lineHeight = `${height}px`;
      overlay.appendChild(glyph);
    }
  }
  root.appendChild(overlay);
  valueEl.style.color = "transparent";

  // Cascade de droite à gauche : 60 ms entre deux colonnes.
  const count = strips.length;
  const lastDelay = (count - 1) * 60;
  const each = Math.max(240, duration - lastDelay);
  const frame = requestAnimationFrame(() => {
    strips.forEach(({ strip, digit }, index) => {
      const delay = (count - 1 - index) * 60;
      strip.style.transition = `transform ${each}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
      strip.style.transform = `translateY(${-(10 + digit) * height}px)`;
    });
  });
  const finish = () => {
    cancelAnimationFrame(frame);
    overlay.remove();
    valueEl.style.removeProperty("color");
  };
  const timer = window.setTimeout(finish, each + lastDelay + 60);
  return () => {
    window.clearTimeout(timer);
    finish();
  };
}

export function Odometer({ value, unit = "€", trigger = "view", duration, className }: OdometerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const text = formatOdometer(value, unit);

  useEffect(() => {
    const root = ref.current;
    if (!root || currentMotionLevel() === "off") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const total = duration ?? (cssDurationMs(getComputedStyle(root).getPropertyValue("--dur-odometer")) || 1100);
    let stop = () => {};
    if (trigger === "mount") {
      stop = roll(root, text, total);
      return () => stop();
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        stop = roll(root, text, total);
      },
      { threshold: 0.6 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      stop();
    };
  }, [text, trigger, duration]);

  return (
    <span ref={ref} data-odometer={trigger} className={cn("tabular-nums", className)}>
      <span className="odometer-value">{text}</span>
    </span>
  );
}
