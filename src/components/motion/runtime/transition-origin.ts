/**
 * Origine de la transition de page (docs/09, D.4) : le cercle de lumière s'ouvre depuis le
 * point touché. Un écouteur `click` en capture écrit `--vt-x` et `--vt-y` sur <html> pour les
 * liens internes ; au clavier, c'est le centre du lien.
 */
export function installTransitionOrigin(): () => void {
  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!(target instanceof HTMLAnchorElement)) return;
    if (target.target && target.target !== "_self") return;
    if (target.hasAttribute("download")) return;
    let url: URL;
    try {
      url = new URL(target.href, window.location.href);
    } catch {
      return;
    }
    // Liens tel:, wa.me, mailto: et sites externes : jamais de transition.
    if (url.origin !== window.location.origin) return;
    let x = event.clientX;
    let y = event.clientY;
    if (event.detail === 0 || (x === 0 && y === 0)) {
      const rect = target.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    const html = document.documentElement;
    html.style.setProperty("--vt-x", `${Math.round(x)}px`);
    html.style.setProperty("--vt-y", `${Math.round(y)}px`);
  };
  document.addEventListener("click", onClick, { capture: true, passive: true });
  return () => document.removeEventListener("click", onClick, { capture: true });
}
