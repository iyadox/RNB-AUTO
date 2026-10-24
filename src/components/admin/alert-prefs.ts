/**
 * Préférences d'alerte propres à CET appareil (notification du téléphone, petit son).
 * Simple confort local : rangées dans le navigateur, jamais nécessaires au fonctionnement.
 */
export type AlertPrefs = { notify: boolean; sound: boolean };

const KEY = "rnb-admin-alerts";
const DEFAULTS: AlertPrefs = { notify: false, sound: false };

export function readAlertPrefs(): AlertPrefs {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<AlertPrefs>;
    return { notify: parsed.notify === true, sound: parsed.sound === true };
  } catch {
    return DEFAULTS;
  }
}

export function writeAlertPrefs(prefs: AlertPrefs): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Stockage indisponible (navigation privée) : la préférence vaut pour cette visite seulement.
  }
}

/** Petit signal sonore (deux bips courts), sans fichier à télécharger. */
export function playChime(): void {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const beep = (start: number, frequency: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + 0.25);
    };
    beep(0, 880);
    beep(0.28, 1175);
    window.setTimeout(() => void ctx.close().catch(() => undefined), 1000);
  } catch {
    // Son impossible (navigateur, réglages) : l'alerte visuelle suffit.
  }
}

const WORKER_URL = "/admin/sw.js";
const WORKER_SCOPE = "/admin/";

/**
 * Prépare le petit service de notification de l'espace. Sur Android (et sur iPhone, espace
 * ajouté à l'écran d'accueil), le téléphone refuse `new Notification(...)` : il faut passer par lui.
 */
export async function ensureAlertWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (!("serviceWorker" in navigator)) return null;
    const existing = await navigator.serviceWorker.getRegistration(WORKER_SCOPE);
    return existing ?? (await navigator.serviceWorker.register(WORKER_URL, { scope: WORKER_SCOPE }));
  } catch {
    return null;
  }
}

/** Affiche une notification du téléphone ; renvoie false si l'appareil la refuse. */
export async function showAlertNotification(title: string, body: string, url: string, tag: string): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;
  const registration = await ensureAlertWorker();
  if (registration) {
    try {
      await registration.showNotification(title, { body, tag, data: { url }, icon: "/icon.svg", badge: "/icon.svg" });
      return true;
    } catch {
      // On essaie la méthode simple ci-dessous.
    }
  }
  try {
    const notification = new Notification(title, { body, tag });
    notification.onclick = () => {
      window.focus();
      window.location.assign(url);
    };
    return true;
  } catch {
    // Certains appareils n'acceptent aucune notification hors application installée.
    return false;
  }
}
