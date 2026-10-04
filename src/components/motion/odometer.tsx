"use client";

/**
 * P11 · Odometer : les chiffres roulent comme ceux d'un compteur kilométrique.
 * Le serveur rend le VRAI texte (« 105 € ») ; pendant le roulement il reste dans l'arbre
 * d'accessibilité (simplement rendu transparent) et des colonnes décoratives `aria-hidden`
 * passent par-dessus, en chiffres de largeur fixe : aucun décalage de mise en page.
 * Premier affichage : AUCUN faux montant, jamais « 000 € » ni chiffre intermédiaire. Chaque
 * tambour part vide et le vrai chiffre monte dans le hublot puis se cale (léger dépassement),
 * de droite à gauche. Quand la valeur change (choix du moment de l'accueil), le compteur roule
 * de l'ANCIENNE valeur vers la nouvelle en 700 ms (E.5), en avançant si elle monte, en reculant
 * si elle baisse : c'est le visiteur qui change le prix, le roulement montre le passage.
 * Chaque colonne est découpée à la hauteur des chiffres (hublot) : rien ne dépasse du prix.
 * Jamais sur un numéro de téléphone ni sur une référence de demande.
 * `off`, préférence « moins d'animations » et sans JavaScript : valeur fixe.
 */
import { useLayoutEffect, useRef } from "react";
import { formatEurosShort } from "@/core/format";
import { cn } from "@/components/ui/cn";
import { currentMotionLevel } from "./level";

type OdometerProps = {
  /** Valeur dans l'unité affichée (euros, kilomètres), telle que renvoyée par le serveur. */
  value: number;
  unit?: "€" | "km" | null;
  /** `view` : roule à l'entrée dans l'écran ; `mount` : dès l'affichage. */
  trigger?: "view" | "mount";
  /** Durée totale en ms (par défaut `--dur-odometer` : 1 100 ms, 600 ms sur /demande). */
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

/** Durée du roulement quand la valeur change (E.5 : de l'ancienne à la nouvelle valeur). */
const CHANGE_DURATION_MS = 700;
/** Cascade de droite à gauche entre deux colonnes. */
const STAGGER_MS = 60;
/** Premier affichage : durée de la montée d'un chiffre dans son hublot (au plus). */
const LAND_MS = 520;
/** Courbe de la montée : arrive vite, dépasse à peine et se cale (pas de rebond). */
const LAND_EASE = "cubic-bezier(0.3, 1.32, 0.5, 1)";

/**
 * Ligne de base d'un texte, en px depuis le haut de `root` (boîte de mise en page, insensible aux
 * transformations) : une sonde de hauteur nulle posée sur la ligne de base.
 * `root` doit être positionné (c'est le cas de [data-odometer]) pour servir de `offsetParent`.
 */
function baselineIn(host: HTMLElement, root: HTMLElement): number | null {
  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline;";
  host.appendChild(probe);
  let y = 0;
  let node: HTMLElement | null = probe;
  // Somme des offsetTop jusqu'à la racine (les transform du ticket ou des bandes sont ignorés).
  while (node && node !== root) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  probe.remove();
  return node === root ? y : null;
}

/**
 * Hauteur d'encre des chiffres (au-dessus et au-dessous de la ligne de base), mesurée sur la
 * police réelle. Chaque colonne est découpée à cette fenêtre, comme le hublot d'un compteur :
 * rien ne dépasse au-dessus du prix pendant le roulement (sinon la cellule voisine chevauchait
 * le libellé du ticket, constaté).
 */
function digitInk(el: HTMLElement): { ascent: number; descent: number } | null {
  const style = getComputedStyle(el);
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return null;
  // La largeur de police (font-stretch en %) ne change pas les mesures verticales : on l'omet.
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const m = ctx.measureText("0123456789");
  if (!Number.isFinite(m.actualBoundingBoxAscent) || !m.actualBoundingBoxAscent) return null;
  return { ascent: m.actualBoundingBoxAscent, descent: Math.max(0, m.actualBoundingBoxDescent || 0) };
}

/** Chiffres d'un texte, alignés à droite sur `count` colonnes (colonne absente : 0). */
function digitsOf(text: string, count: number): number[] {
  const digits = Array.from(text).filter((c) => /\d/.test(c)).map(Number);
  return [...Array<number>(Math.max(0, count - digits.length)).fill(0), ...digits].slice(-count);
}

/** Valeur numérique d'un texte formaté (« 187,50 € » → 187.5), pour le sens du roulement. */
const numericOf = (text: string) => Number(text.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;

/**
 * Construit les colonnes et lance le roulement de `fromText` vers `text`. `fromText` null :
 * premier affichage, chaque chiffre monte d'un tambour vide (aucune valeur fausse affichée).
 * Retourne l'arrêt (qui remet le vrai texte).
 */
function roll(root: HTMLElement, text: string, duration: number, fromText: string | null = null): () => void {
  const valueEl = root.querySelector<HTMLElement>(".odometer-value");
  if (!valueEl) return () => {};
  // Hauteur de MISE EN PAGE de la ligne (offsetHeight), jamais getBoundingClientRect : le
  // ticket est tourné de quelques degrés, sa boîte englobante est plus haute que la ligne. Les
  // cellules étaient alors trop hautes, les colonnes décalées et le haut d'un chiffre voisin
  // dépassait au-dessus du prix (constaté à mi-roulement).
  const height = root.offsetHeight || valueEl.offsetHeight;
  if (!height) return () => {};
  const baseline = baselineIn(valueEl, root);
  const ink = digitInk(root);
  const fontSize = parseFloat(getComputedStyle(root).fontSize) || 16;
  // Fondu du hublot : le chiffre qui sort s'efface sur `fade` px, comme sur un tambour. Le pas
  // des cellules laisse toujours un blanc entre deux chiffres : à mi-roulement, on ne voit jamais
  // deux moitiés de chiffres collées l'une à l'autre.
  const fade = fontSize * 0.14;
  const inkHeight = ink ? ink.ascent + ink.descent : fontSize * 0.72;
  const pitch = Math.max(height, Math.ceil(inkHeight + 2 * fade + fontSize * 0.16));

  const chars = Array.from(text);
  const digitCount = chars.filter((c) => /\d/.test(c)).length;
  const targets = digitsOf(text, digitCount);
  const sources = fromText === null ? null : digitsOf(fromText, digitCount);
  // Le compteur avance quand la valeur monte, recule quand elle baisse.
  const upward = fromText === null || numericOf(text) >= numericOf(fromText);
  // Premier affichage : bande [vide, vrai chiffre] ; changement de valeur : bande 0-9 0-9.
  const landing = sources === null;

  const overlay = document.createElement("span");
  overlay.className = "odometer-roll";
  overlay.setAttribute("aria-hidden", "true");
  const strips: { strip: HTMLElement; start: number; end: number }[] = [];
  const glyphs: HTMLElement[] = [];
  let digitIndex = 0;
  for (const char of chars) {
    if (/\d/.test(char)) {
      const col = document.createElement("span");
      col.className = "odometer-col";
      const strip = document.createElement("span");
      strip.className = "odometer-strip";
      const target = targets[digitIndex] ?? 0;
      const source = sources ? (sources[digitIndex] ?? 0) : 0;
      // Cellule vide (insécable, même hauteur) au-dessus du vrai chiffre pour la montée.
      const labels = landing ? ["\u00a0", String(target)] : Array.from({ length: 20 }, (_, i) => String(i % 10));
      for (const label of labels) {
        const cell = document.createElement("span");
        cell.textContent = label;
        cell.style.height = `${pitch}px`;
        cell.style.lineHeight = `${pitch}px`;
        strip.appendChild(cell);
      }
      col.appendChild(strip);
      overlay.appendChild(col);
      // Positions dans la bande : départ et arrivée, toujours dans le sens du roulement.
      let start: number;
      let end: number;
      if (landing) {
        start = 0;
        end = 1;
      } else if (upward) {
        start = source;
        end = target >= source ? target : target + 10;
      } else {
        start = source + 10;
        end = target <= source ? target + 10 : target;
      }
      strips.push({ strip, start, end });
      strip.style.transform = `translateY(${-start * pitch}px)`;
      digitIndex++;
    } else {
      const glyph = document.createElement("span");
      glyph.textContent = char;
      glyph.style.lineHeight = `${height}px`;
      overlay.appendChild(glyph);
      glyphs.push(glyph);
    }
  }
  root.appendChild(overlay);

  // Les chiffres des cellules tombent exactement sur la ligne de base du vrai texte (aucun saut
  // à la fin), et chaque colonne est découpée à la hauteur d'encre des chiffres.
  const firstCell = strips[0]?.strip.firstElementChild as HTMLElement | null | undefined;
  const cellBaseline = firstCell ? baselineIn(firstCell, root) : null;
  const shift = baseline !== null && cellBaseline !== null ? baseline - cellBaseline : 0;
  const line = baseline ?? cellBaseline;
  // Les autres signes (« € », espace) gardent la hauteur de ligne du vrai texte.
  const glyphBaseline = glyphs[0] ? baselineIn(glyphs[0], root) : null;
  const glyphShift = baseline !== null && glyphBaseline !== null ? baseline - glyphBaseline : 0;
  if (glyphShift) for (const glyph of glyphs) glyph.style.translate = `0 ${glyphShift}px`;
  for (const { strip } of strips) {
    if (shift) strip.style.marginTop = `${shift}px`;
    if (ink && line !== null) {
      // Hublot : l'encre des chiffres, plus la bande de fondu au-dessus et au-dessous.
      // La colonne déborde de la ligne de `bleed` px en haut et en bas : le fondu n'est jamais
      // coupé net par le bord de la boîte (le masque ne peint rien hors de la colonne).
      const bleed = Math.ceil(fade * 2);
      const top = line - ink.ascent - fade + bleed;
      const bottom = line + ink.descent + fade + bleed;
      const col = strip.parentElement as HTMLElement;
      col.style.alignSelf = "flex-start";
      col.style.boxSizing = "border-box";
      col.style.marginTop = `${-bleed}px`;
      col.style.paddingTop = `${bleed}px`;
      col.style.height = `${height + 2 * bleed}px`;
      const mask = `linear-gradient(to bottom, transparent ${top.toFixed(1)}px, #000 ${(top + fade).toFixed(1)}px, #000 ${(bottom - fade).toFixed(1)}px, transparent ${bottom.toFixed(1)}px)`;
      col.style.setProperty("-webkit-mask-image", mask);
      col.style.maskImage = mask;
    }
  }
  valueEl.style.color = "transparent";
  // Position de départ calculée avant la transition (sinon le navigateur saute à l'arrivée).
  void overlay.offsetWidth;

  // Cascade de droite à gauche ; seules les colonnes qui changent roulent.
  const moving = strips.filter(({ start, end }) => start !== end);
  const count = moving.length;
  const lastDelay = Math.max(0, count - 1) * STAGGER_MS;
  const each = landing ? Math.min(LAND_MS, Math.max(240, duration - lastDelay)) : Math.max(240, duration - lastDelay);
  const ease = landing ? LAND_EASE : "cubic-bezier(0.16, 1, 0.3, 1)";
  const frame = requestAnimationFrame(() => {
    moving.forEach(({ strip, end }, index) => {
      const delay = (count - 1 - index) * STAGGER_MS;
      strip.style.transition = `transform ${each}ms ${ease} ${delay}ms`;
      strip.style.transform = `translateY(${-end * pitch}px)`;
    });
  });
  const finish = () => {
    cancelAnimationFrame(frame);
    overlay.remove();
    valueEl.style.removeProperty("color");
  };
  // Le vrai texte revient dès la fin de la dernière colonne (mêmes chiffres, même ligne de base).
  const timer = window.setTimeout(finish, each + lastDelay + 20);
  return () => {
    window.clearTimeout(timer);
    finish();
  };
}

export function Odometer({ value, unit = "€", trigger = "view", duration, className }: OdometerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  /** Texte affiché lors du passage précédent de l'effet (pour rouler de l'ancienne valeur). */
  const lastTextRef = useRef<string | null>(null);
  /** Le premier roulement a commencé : un changement de valeur roule alors de l'ancienne à la nouvelle. */
  const startedRef = useRef(false);
  const text = formatOdometer(value, unit);

  // Avant la peinture : en `mount`, le vrai prix n'est jamais affiché une image avant que les
  // tambours vides ne le remplacent (il l'était environ 50 ms sur mobile, entre montage et effet).
  useLayoutEffect(() => {
    const root = ref.current;
    const previous = lastTextRef.current;
    lastTextRef.current = text;
    if (!root || currentMotionLevel() === "off") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop = () => {};

    // Changement de valeur après le premier roulement : de l'ancienne à la nouvelle, en 700 ms.
    if (startedRef.current && previous !== null && previous !== text) {
      stop = roll(root, text, CHANGE_DURATION_MS, previous);
      return () => stop();
    }

    const total = duration ?? (cssDurationMs(getComputedStyle(root).getPropertyValue("--dur-odometer")) || 1100);
    const start = () => {
      startedRef.current = true;
      stop = roll(root, text, total);
    };
    if (trigger === "mount") {
      start();
      return () => stop();
    }
    // `view` : le hublot reste vide jusqu'au roulement. Sinon le vrai prix apparaissait avec le
    // haut du ticket imprimé, disparaissait au départ des tambours vides, puis remontait (constaté).
    // Le texte reste dans l'arbre d'accessibilité ; il n'est caché qu'avec le mouvement actif.
    const valueEl = root.querySelector<HTMLElement>(".odometer-value");
    if (valueEl) valueEl.style.color = "transparent";
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        io.disconnect();
        start();
      },
      { threshold: 0.6 },
    );
    io.observe(root);
    return () => {
      io.disconnect();
      stop();
      valueEl?.style.removeProperty("color");
    };
  }, [text, trigger, duration]);

  return (
    <span ref={ref} data-odometer={trigger} className={cn("tabular-nums", className)}>
      <span className="odometer-value">{text}</span>
    </span>
  );
}
