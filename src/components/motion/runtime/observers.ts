/**
 * Observateurs du runtime (docs/09, C.4) : aucun GSAP, quelques centaines d'octets.
 * - « vu une fois » : pose `data-inview` (apparitions, impressions, voyants, arrivées…) ;
 * - reflet rétroréfléchissant (`data-retro-play`, une fois au milieu de l'écran) ;
 * - pause des scènes hors de l'écran (`.scene-paused`) ;
 * - ciel : recopie le `data-sky` de la section au centre de l'écran sur <html> ;
 * - `aria-current="location"` sur les liens `[data-follow-section]` de la section active ;
 * - contenu ajouté après coup (étapes de /demande…) : pris en compte automatiquement.
 */

/** Éléments qui reçoivent `data-inview` une seule fois. */
export const INVIEW_SELECTOR =
  "[data-reveal],[data-inview-once],[data-retro],[data-beam=view],[data-print=view],[data-ignite],[data-arrive]";

type Scan = () => void;

const domListeners = new Set<Scan>();
let domObserver: MutationObserver | null = null;
let domFrame = 0;

/** Appelle `listener` (au plus une fois par image) quand des éléments sont ajoutés à la page. */
export function onDomChange(listener: Scan): () => void {
  domListeners.add(listener);
  if (!domObserver) {
    domObserver = new MutationObserver((records) => {
      if (domFrame || !records.some((record) => record.addedNodes.length > 0)) return;
      domFrame = requestAnimationFrame(() => {
        domFrame = 0;
        for (const fn of Array.from(domListeners)) {
          try {
            fn();
          } catch {
            // Un observateur en échec ne bloque pas les autres.
          }
        }
      });
    });
    domObserver.observe(document.body, { childList: true, subtree: true });
  }
  return () => {
    domListeners.delete(listener);
    if (domListeners.size === 0 && domObserver) {
      domObserver.disconnect();
      domObserver = null;
      cancelAnimationFrame(domFrame);
      domFrame = 0;
    }
  };
}

const markInView = (el: Element) => el.setAttribute("data-inview", "");

/**
 * Pose `data-inview` sur les éléments qui entrent dans l'écran (seuil : 92 % de la hauteur).
 * Au premier passage, ceux qui sont déjà visibles sont marqués tout de suite : ils ne seront
 * jamais cachés. Retourne la fonction de nettoyage.
 */
export function observeInView(root: ParentNode): () => void {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        markInView(entry.target);
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  const seen = new WeakSet<Element>();
  let first = true;
  const scan = () => {
    const limit = window.innerHeight * 0.92;
    for (const el of Array.from(root.querySelectorAll(INVIEW_SELECTOR))) {
      if (seen.has(el) || el.hasAttribute("data-inview")) continue;
      seen.add(el);
      if (first) {
        const rect = el.getBoundingClientRect();
        if (rect.top < limit && rect.bottom > 0) {
          markInView(el);
          continue;
        }
      }
      io.observe(el);
    }
    first = false;
  };
  scan();
  const stop = onDomChange(scan);
  return () => {
    stop();
    io.disconnect();
  };
}

/** Ligne de l'écran (65 % de la hauteur) que le haut d'une plaque doit franchir pour son reflet (P6). */
export const RETRO_LINE = 0.65;
/** Durée du balayage du reflet (motion.css, `retro-sweep`), plus une marge. */
const RETRO_SWEEP_MS = 900 + 150;

/**
 * Vrai si le haut d'un élément (`top`, position dans le DOCUMENT, en px) pourra franchir la ligne
 * des 65 % de l'écran avec un défilement compris entre 0 et `maxScroll`. Faux pour un élément tout
 * en bas de la page, que le défilement n'amène jamais au milieu de l'écran.
 */
export function canReachRetroLine(top: number, viewport: number, maxScroll: number): boolean {
  return top - viewport * RETRO_LINE < Math.max(0, maxScroll);
}

/**
 * P6 · Reflet rétroréfléchissant : la bande blanche traverse la plaque UNE fois, dans le temps
 * (900 ms), quand son haut franchit les 65 % de l'écran (elle arrive au milieu). Une plaque déjà
 * au-dessus de cette ligne au chargement (haut de page, page courte comme /demande) le reçoit tout
 * de suite ; une plaque tout en bas de la page, que le défilement n'amène jamais là, le reçoit dès
 * qu'elle entre dans l'écran. Un saut de défilement (ancre, geste rapide) ne fait rien manquer. Le runtime pose `data-retro-play` le temps
 * du balayage, puis le retire : au repos, la bande est hors de la plaque (jamais figée à
 * mi-course, ce que faisait une animation liée au défilement sur une page immobile).
 */
export function observeRetro(root: ParentNode): () => void {
  const played = new WeakSet<Element>();
  const timers = new Set<number>();
  const playing = new Set<Element>();
  const play = (el: Element) => {
    if (played.has(el)) return;
    played.add(el);
    band.unobserve(el);
    view.unobserve(el);
    el.setAttribute("data-retro-play", "");
    playing.add(el);
    const timer = window.setTimeout(() => {
      timers.delete(timer);
      playing.delete(el);
      el.removeAttribute("data-retro-play");
    }, RETRO_SWEEP_MS);
    timers.add(timer);
  };
  const band = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) play(entry.target);
    },
    { rootMargin: `0px 0px -${Math.round((1 - RETRO_LINE) * 100)}% 0px` },
  );
  // Entrée dans l'écran : si la plaque ne pourra jamais atteindre la ligne, le reflet passe ici.
  const view = new IntersectionObserver(
    (entries) => {
      const html = document.documentElement;
      const maxScroll = html.scrollHeight - window.innerHeight;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const top = entry.target.getBoundingClientRect().top + window.scrollY;
        if (!canReachRetroLine(top, window.innerHeight, maxScroll)) play(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  const seen = new WeakSet<Element>();
  const scan = () => {
    for (const el of Array.from(root.querySelectorAll("[data-retro]"))) {
      if (seen.has(el)) continue;
      seen.add(el);
      band.observe(el);
      view.observe(el);
    }
  };
  scan();
  const stop = onDomChange(scan);
  return () => {
    stop();
    band.disconnect();
    view.disconnect();
    for (const timer of timers) window.clearTimeout(timer);
    for (const el of playing) el.removeAttribute("data-retro-play");
  };
}

/** Met en pause les scènes `[data-pause-offscreen]` hors de l'écran (sauf pause demandée). */
export function observePause(root: ParentNode): () => void {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target;
      el.classList.toggle("scene-paused", !entry.isIntersecting || el.hasAttribute("data-user-paused"));
    }
  });
  const seen = new WeakSet<Element>();
  const scan = () => {
    for (const el of Array.from(root.querySelectorAll("[data-pause-offscreen]"))) {
      if (seen.has(el)) continue;
      seen.add(el);
      io.observe(el);
    }
  };
  scan();
  const stop = onDomChange(scan);
  return () => {
    stop();
    io.disconnect();
  };
}

/**
 * Lit la bande centrale de l'écran : la section `[data-sky]` qui la traverse donne l'heure du
 * ciel (`html[data-sky]`), et les liens `[data-follow-section]` vers elle reçoivent
 * `aria-current="location"`.
 */
export function observeSky(root: ParentNode): () => void {
  const html = document.documentElement;
  const follow = (id: string) => {
    for (const link of Array.from(root.querySelectorAll<HTMLAnchorElement>("a[data-follow-section]"))) {
      const target = decodeURIComponent((link.getAttribute("href") ?? "").split("#")[1] ?? "");
      if (target && target === id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const sky = el.getAttribute("data-sky");
        if (sky && html.getAttribute("data-sky") !== sky) html.setAttribute("data-sky", sky);
        if (el.id) follow(el.id);
      }
    },
    { rootMargin: "-50% 0px -50% 0px" },
  );
  const seen = new WeakSet<Element>();
  const scan = () => {
    const targets = new Set<Element>(Array.from(root.querySelectorAll("body [data-sky]")));
    for (const link of Array.from(root.querySelectorAll<HTMLAnchorElement>("a[data-follow-section]"))) {
      const id = decodeURIComponent((link.getAttribute("href") ?? "").split("#")[1] ?? "");
      const target = id ? document.getElementById(id) : null;
      if (target) targets.add(target);
    }
    for (const el of targets) {
      if (seen.has(el)) continue;
      seen.add(el);
      io.observe(el);
    }
  };
  // Nouvelle page : la nuit retombe. L'observateur donne aussitôt l'heure de la section visible.
  const first = root.querySelector("body [data-sky]")?.getAttribute("data-sky");
  html.setAttribute("data-sky", first ?? "minuit");
  scan();
  const stop = onDomChange(scan);
  return () => {
    stop();
    io.disconnect();
  };
}

/**
 * Repli de la progression de lecture quand `animation-timeline: scroll()` manque (ou en `off`) :
 * écrit `--scroll-progress` (0 → 1) sur <html>, une fois par image au plus.
 */
export function trackScrollProgress(): () => void {
  const html = document.documentElement;
  let frame = 0;
  const update = () => {
    frame = 0;
    const max = html.scrollHeight - window.innerHeight;
    html.style.setProperty("--scroll-progress", max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)).toFixed(4) : "0");
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    cancelAnimationFrame(frame);
    html.style.removeProperty("--scroll-progress");
  };
}
