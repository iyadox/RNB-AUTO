/** Type d'appareil connecté : choisit le pictogramme affiché dans « Appareils connectés ». */
export type DeviceKind = "phone" | "tablet" | "computer" | "unknown";

type System = { kind: DeviceKind; name: string };

/** Système reconnu à partir du navigateur. L'ordre compte : un iPhone annonce aussi « Mac OS X ». */
function detectSystem(ua: string): System {
  if (/iPhone|iPod/.test(ua)) return { kind: "phone", name: "iPhone" };
  if (/iPad/.test(ua)) return { kind: "tablet", name: "iPad" };
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? { kind: "phone", name: "Téléphone Android" } : { kind: "tablet", name: "Tablette Android" };
  if (/Windows/.test(ua)) return { kind: "computer", name: "Ordinateur Windows" };
  if (/Macintosh|Mac OS X/.test(ua)) return { kind: "computer", name: "Mac" };
  if (/CrOS/.test(ua)) return { kind: "computer", name: "Chromebook" };
  if (/Linux/.test(ua)) return { kind: "computer", name: "Ordinateur Linux" };
  if (/Mobile/.test(ua)) return { kind: "phone", name: "Téléphone" };
  return { kind: "unknown", name: "Appareil" };
}

/** Type d'appareil (téléphone, tablette, ordinateur), à partir de son navigateur. */
export function deviceKind(userAgent: string | null | undefined): DeviceKind {
  return userAgent ? detectSystem(userAgent).kind : "unknown";
}

/** Nom lisible d'un appareil connecté, à partir de son navigateur (« iPhone · Safari »). */
export function describeDevice(userAgent: string | null | undefined): string {
  const ua = userAgent ?? "";
  if (!ua) return "Appareil inconnu";
  const system = detectSystem(ua).name;
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /SamsungBrowser/.test(ua)
      ? "Samsung Internet"
      : /Firefox\/|FxiOS/.test(ua)
        ? "Firefox"
        : /Chrome\/|CriOS/.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : null;
  return browser ? `${system} · ${browser}` : system;
}
