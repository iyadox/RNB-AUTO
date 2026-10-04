/**
 * P21 · Halo des phares : sur ordinateur, une lumière chaude très douce suit la souris, sous le
 * contenu (dans le ciel). Lissage de 0,18 par image, arrêt dès que le halo a rejoint le pointeur.
 * Masqué quand un champ a le focus. Le curseur système n'est jamais remplacé.
 */
const FIELD = "input, textarea, select, [contenteditable='true']";

export function startHalo(): () => void {
  const halo = document.querySelector<HTMLElement>(".night-sky__halo");
  if (!halo) return () => {};
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 3;
  let targetX = x;
  let targetY = y;
  let frame = 0;
  let typing = false;

  const render = () => {
    halo.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
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
