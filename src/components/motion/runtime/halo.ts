/**
 * P21 · Halo des phares : sur ordinateur, une lumière chaude très douce suit la souris, sous le
 * contenu (dans le ciel). Lissage de 0,18 par image, arrêt dès que le halo a rejoint le pointeur.
 * Masqué quand un champ a le focus. Le curseur système n'est jamais remplacé.
 * Le grain renforcé sous le halo (`.night-sky__halo-grain`) est recalé à chaque image sur la grille
 * de 128 px du grain du ciel : il reste immobile à l'écran pendant que la fenêtre ronde se déplace.
 */
/** Côté de la tuile de grain (motion.css, `.night-sky__grain` et `.night-sky__halo-grain`). */
const GRAIN_TILE = 128;
const FIELD = "input, textarea, select, [contenteditable='true']";

export function startHalo(): () => void {
  const halo = document.querySelector<HTMLElement>(".night-sky__halo");
  if (!halo) return () => {};
  const grain = halo.querySelector<HTMLElement>(".night-sky__halo-grain");
  // Le halo est centré sur (x, y) par une marge négative de la moitié de sa taille.
  const half = halo.offsetWidth / 2;
  const wrap = (value: number) => ((value % GRAIN_TILE) + GRAIN_TILE) % GRAIN_TILE;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 3;
  let targetX = x;
  let targetY = y;
  let frame = 0;
  let typing = false;

  // Pixels entiers : la tuile de grain n'est jamais rééchantillonnée entre deux pixels (sinon
  // elle scintillerait en bougeant) ; le halo, très doux, n'en paraît pas moins fluide.
  const render = () => {
    const px = Math.round(x);
    const py = Math.round(y);
    halo.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    if (grain) grain.style.transform = `translate3d(${-wrap(px - half)}px, ${-wrap(py - half)}px, 0)`;
  };
  const step = () => {
    x += (targetX - x) * 0.18;
    y += (targetY - y) * 0.18;
    render();
    frame = Math.abs(targetX - x) > 0.4 || Math.abs(targetY - y) > 0.4 ? requestAnimationFrame(step) : 0;
  };
  const show = (on: boolean) => {
    if (on && !typing) halo.setAttribute("data-on", "");
    else halo.removeAttribute("data-on");
  };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    targetX = event.clientX;
    targetY = event.clientY;
    if (!halo.hasAttribute("data-on")) {
      // Première apparition : le halo naît sous le pointeur, sans glisser depuis le centre.
      x = targetX;
      y = targetY;
      render();
      show(true);
    }
    if (!frame) frame = requestAnimationFrame(step);
  };
  const onLeave = (event: MouseEvent) => {
    if (!event.relatedTarget) show(false);
  };
  const onFocus = (event: FocusEvent) => {
    typing = event.target instanceof Element && event.target.matches(FIELD);
    if (typing) show(false);
  };
  // Le champ perd le focus (clic dans le vide, Échap…) : le halo revient au prochain mouvement.
  const onBlur = () => {
    typing = false;
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("mouseout", onLeave, { passive: true });
  document.addEventListener("focusin", onFocus);
  document.addEventListener("focusout", onBlur);
  return () => {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("mouseout", onLeave);
    document.removeEventListener("focusin", onFocus);
    document.removeEventListener("focusout", onBlur);
    cancelAnimationFrame(frame);
    halo.removeAttribute("data-on");
  };
}
