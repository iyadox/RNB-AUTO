/**
 * Outils purs du pilote du décor (story-drive.scene.ts), testés à part. Ils reproduisent en
 * JavaScript les frises que le navigateur lit seul quand il prend en charge `animation-timeline`.
 */

/** Durée des animations du décor quand la progression est réglée à la main (0 à 1 = 0 à 1 000 ms). */
export const STORY_DURATION_MS = 1000;

/** Position d'un bloc dans le document (en px, défilement compris). */
export type Span = { top: number; height: number };

/** Géométrie lue au chargement et à chaque redimensionnement. */
export type StoryGeometry = {
  viewport: number;
  /** La piste entière (acte 0, l'aube). */
  track: Span;
  /** Les fenêtres des actes 1, 2 et 3, dans l'ordre. */
  windows: Span[];
};

const clamp01 = (value: number) => (value <= 0 ? 0 : value >= 1 ? 1 : value);

/**
 * Progression de la piste, identique à `animation-range: contain 0% contain 100%` : 0 quand le
 * haut de la piste touche le haut de l'écran, 1 quand son bas touche le bas de l'écran.
 * `top` est la position du haut de la piste dans l'écran (`getBoundingClientRect().top`).
 */
export function storyProgress(top: number, height: number, viewport: number): number {
  const range = height - viewport;
  if (!(range > 0)) return top <= 0 ? 1 : 0;
  return clamp01(-top / range);
}

/**
 * Progression « cover » d'une fenêtre (`view-timeline`, plage par défaut) : 0 quand son haut
 * entre par le bas de l'écran, 1 quand son bas sort par le haut.
 */
export function coverProgress(top: number, height: number, viewport: number): number {
  const range = viewport + height;
  if (!(range > 0)) return 0;
  return clamp01((viewport - top) / range);
}

/** Progression de l'acte `act` (0 = la piste, 1 à 3 = les fenêtres) pour un défilement donné. */
export function actProgress(scroll: number, geometry: StoryGeometry, act: number): number {
  if (act === 0) return storyProgress(geometry.track.top - scroll, geometry.track.height, geometry.viewport);
  const span = geometry.windows[act - 1];
  if (!span) return 0;
  return coverProgress(span.top - scroll, span.height, geometry.viewport);
}

/**
 * Temps à donner à une animation pour une progression : avant le début (`-1`, phase « avant »,
 * où seul un remplissage `backwards` s'applique), puis 0 à `STORY_DURATION_MS`.
 */
export function storyTime(progress: number): number {
  if (progress <= 0) return -1;
  return Math.round(clamp01(progress) * STORY_DURATION_MS * 10) / 10;
}

/**
 * Acte de chaque animation d'un élément : `--acts` répète, dans l'ordre de `animation-name`,
 * l'acte de chaque animation (« 2 3 » pour deux animations). Valeur absente : acte 0.
 */
export function actFor(animationNames: string, acts: string, name: string): number {
  const names = animationNames.split(",").map((value) => value.trim());
  const list = acts.trim().split(/[\s,]+/).filter(Boolean).map(Number);
  const index = names.indexOf(name);
  const act = index >= 0 ? list[index] : undefined;
  return act !== undefined && Number.isFinite(act) ? act : 0;
}

/** Animations de la chorégraphie (une itération), avec leur acte ; les boucles sont laissées. */
export function collectStoryAnimations(root: Element): { animation: Animation; act: number }[] {
  const styles = new Map<Element, CSSStyleDeclaration>();
  const result: { animation: Animation; act: number }[] = [];
  for (const animation of root.getAnimations({ subtree: true })) {
    const effect = animation.effect as KeyframeEffect | null;
    if (!effect || effect.getTiming().iterations === Infinity) continue;
    // Seules les animations sur l'horloge du document se règlent en millisecondes (une frise de
    // défilement encore attachée lèverait une erreur).
    if (!(animation.timeline instanceof DocumentTimeline)) continue;
    const target = effect.target;
    const name = (animation as CSSAnimation).animationName;
    if (!target || !name) continue;
    let style = styles.get(target);
    if (!style) {
      style = getComputedStyle(target);
      styles.set(target, style);
    }
    result.push({ animation, act: actFor(style.animationName, style.getPropertyValue("--acts"), name) });
  }
  return result;
}
