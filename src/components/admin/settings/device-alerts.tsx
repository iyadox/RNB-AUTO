"use client";

/**
 * Alertes sur CET appareil : notification du téléphone (quand l'espace est ouvert en arrière-plan)
 * et petit son à l'arrivée d'une demande. Préférences gardées dans le navigateur de l'appareil.
 */
import { useEffect, useState } from "react";
import { ensureAlertWorker, playChime, readAlertPrefs, showAlertNotification, writeAlertPrefs, type AlertPrefs } from "@/components/admin/alert-prefs";
import { Toggle } from "@/components/admin/inputs";
import { Alert } from "@/components/admin/ui";

type Support = "unknown" | "unsupported" | "denied" | "ok";

export function DeviceAlerts() {
  const [prefs, setPrefs] = useState<AlertPrefs>({ notify: false, sound: false });
  const [support, setSupport] = useState<Support>("unknown");

  useEffect(() => {
    // Lecture après le premier rendu : les préférences n'existent que dans le navigateur.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(readAlertPrefs());
    setSupport(!("Notification" in window) ? "unsupported" : Notification.permission === "denied" ? "denied" : "ok");
  }, []);

  const update = (next: AlertPrefs) => {
    setPrefs(next);
    writeAlertPrefs(next);
  };

  const toggleNotify = async (value: boolean) => {
    if (!value) return update({ ...prefs, notify: false });
    if (!("Notification" in window)) return setSupport("unsupported");
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission === "granted") {
      await ensureAlertWorker();
      // Essai immédiat : la personne voit tout de suite à quoi ressemble l'alerte.
      const shown = await showAlertNotification("Alertes activées", "Vous serez prévenu ici à chaque nouvelle demande.", "/admin", "essai-alerte");
      update({ ...prefs, notify: shown });
      setSupport(shown ? "ok" : "unsupported");
    } else setSupport("denied");
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-asphalt-200 px-4 py-3">
        <span>
          <span className="block font-extrabold">Notification sur cet appareil</span>
          <span className="block text-sm text-asphalt-500">Quand l&apos;espace est ouvert mais que vous faites autre chose.</span>
        </span>
        <Toggle checked={prefs.notify} onChange={(value) => void toggleNotify(value)} label="Notification sur cet appareil" disabled={support === "unsupported"} />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-asphalt-200 px-4 py-3">
        <span>
          <span className="block font-extrabold">Petit son à chaque nouvelle demande</span>
          <span className="block text-sm text-asphalt-500">Deux bips courts, seulement quand l&apos;espace est ouvert.</span>
        </span>
        <Toggle
          checked={prefs.sound}
          onChange={(value) => {
            update({ ...prefs, sound: value });
            if (value) playChime();
          }}
          label="Petit son à chaque nouvelle demande"
        />
      </div>
      {support === "unsupported" ? (
        <Alert tone="info">Ce navigateur ne permet pas les notifications. Sur iPhone, ajoutez d&apos;abord l&apos;espace à l&apos;écran d&apos;accueil (Partager → Sur l&apos;écran d&apos;accueil).</Alert>
      ) : null}
      {support === "denied" ? (
        <Alert tone="warn">Les notifications sont bloquées pour ce site. Autorisez-les dans les réglages du navigateur, puis réessayez.</Alert>
      ) : null}
    </div>
  );
}
