"use client";

/**
 * Veille des nouvelles demandes, discrète :
 * - interroge l'espace toutes les 20 s quand l'onglet est visible (60 s sinon) ;
 * - affiche le nombre de nouvelles demandes dans le titre de l'onglet : « (2) Accueil · … » ;
 * - à l'arrivée d'une demande : un bandeau avec « Voir », et la page se met à jour d'elle-même ;
 * - si la personne l'a choisi pour cet appareil : notification du téléphone et petit son.
 * Une panne réseau n'affiche rien : on réessaie au tour suivant.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminIcon } from "@/components/admin/admin-icons";
import { ensureAlertWorker, playChime, readAlertPrefs, showAlertNotification } from "@/components/admin/alert-prefs";
import { Icon } from "@/components/ui/icon";

export type WatchState = {
  newCount: number;
  waitingCount: number;
  openCount: number;
  latest: { id: string; reference: string; createdAt: string; contactName: string; place: string } | null;
};

const VISIBLE_MS = 20_000;
const HIDDEN_MS = 60_000;
const PREFIX = /^\(\d+\)\s/;

function applyTitle(count: number) {
  const base = document.title.replace(PREFIX, "");
  const next = count > 0 ? `(${count}) ${base}` : base;
  if (document.title !== next) document.title = next;
}

export function NewRequestWatcher({ initial, onCount }: { initial: WatchState; onCount?: (state: WatchState) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [banner, setBanner] = useState<WatchState["latest"]>(null);
  // Session terminée (déconnexion à distance, accès suspendu, expiration) : plus aucune alerte n'arriverait.
  const [expired, setExpired] = useState(false);
  const stateRef = useRef(initial);
  const seenRef = useRef(initial.latest?.id ?? null);
  const onCountRef = useRef(onCount);

  useEffect(() => {
    onCountRef.current = onCount;
  }, [onCount]);

  // Compteur dans le titre, y compris après un changement de page (Next réécrit le titre).
  useEffect(() => {
    applyTitle(stateRef.current.newCount);
    const observer = new MutationObserver(() => applyTitle(stateRef.current.newCount));
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname]);

  const poll = useCallback(async () => {
    try {
      // Sans suivre la redirection vers la connexion : une session terminée doit se voir.
      const response = await fetch("/admin/etat", { cache: "no-store", redirect: "manual", headers: { Accept: "application/json" } });
      if (response.status === 401 || response.type === "opaqueredirect") {
        setExpired(true);
        return;
      }
      if (!response.ok) return;
      setExpired(false);
      const next = (await response.json()) as WatchState;
      const previous = stateRef.current;
      stateRef.current = next;
      applyTitle(next.newCount);
      onCountRef.current?.(next);

      const arrived = next.latest && next.latest.id !== seenRef.current && (!previous.latest || next.latest.createdAt > previous.latest.createdAt);
      if (next.latest) seenRef.current = next.latest.id;
      if (arrived && next.latest) {
        setBanner(next.latest);
        const prefs = readAlertPrefs();
        if (prefs.sound) playChime();
        try {
          navigator.vibrate?.([120, 80, 120]);
        } catch {
          // Vibration indisponible.
        }
        if (prefs.notify && document.visibilityState === "hidden") {
          void showAlertNotification("Nouvelle demande", `${next.latest.contactName} · ${next.latest.place}`, `/admin/demandes/${next.latest.id}`, `demande-${next.latest.id}`);
        }
      }
      if (next.newCount !== previous.newCount || next.waitingCount !== previous.waitingCount || next.openCount !== previous.openCount) {
        router.refresh();
      }
    } catch {
      // Réseau indisponible : on réessaie au prochain tour.
    }
  }, [router]);

  // Notifications choisies sur cet appareil : le service de notification doit être prêt.
  useEffect(() => {
    if (readAlertPrefs().notify) void ensureAlertWorker();
  }, []);

  useEffect(() => {
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(
        () => {
          void poll().finally(schedule);
        },
        document.visibilityState === "visible" ? VISIBLE_MS : HIDDEN_MS,
      );
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
      schedule();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  if (expired) {
    return (
      <div
        role="alert"
        className="fixed inset-x-3 top-[4.5rem] z-[70] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border-2 border-red-500 bg-asphalt-900 p-2.5 pl-3 text-chalk shadow-2xl print:hidden lg:left-[296px] lg:top-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
          <Icon name="lock" size={20} />
        </span>
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block font-extrabold">Vous êtes déconnecté</span>
          <span className="block text-sm text-asphalt-300">Les nouvelles demandes ne s&apos;affichent plus.</span>
        </p>
        <Link href="/admin/connexion" prefetch={false} className="flex h-10 shrink-0 items-center rounded-xl bg-signal-500 px-4 text-sm font-extrabold text-asphalt-950 hover:bg-signal-400">
          Se reconnecter
        </Link>
      </div>
    );
  }
  if (!banner || pathname === `/admin/demandes/${banner.id}`) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-3 top-[4.5rem] z-[70] mx-auto flex max-w-lg items-center gap-3 rounded-2xl border-2 border-signal-500 bg-asphalt-900 p-2.5 pl-3 text-chalk shadow-2xl animate-fade-up print:hidden lg:left-[296px] lg:top-5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-signal-500 text-asphalt-950">
        <AdminIcon name="bell" size={20} />
      </span>
      <p className="min-w-0 flex-1 leading-tight">
        <span className="block text-xs font-extrabold uppercase tracking-wider text-signal-400">Nouvelle demande</span>
        <span className="block truncate font-bold">
          {banner.contactName} · {banner.place}
        </span>
      </p>
      <Link
        href={`/admin/demandes/${banner.id}`}
        onClick={() => setBanner(null)}
        className="flex h-10 shrink-0 items-center rounded-xl bg-signal-500 px-4 text-sm font-extrabold text-asphalt-950 hover:bg-signal-400"
      >
        Voir
      </Link>
      <button type="button" onClick={() => setBanner(null)} aria-label="Fermer l'alerte" className="rounded-full p-1.5 text-asphalt-300 hover:text-chalk">
        <Icon name="x" size={18} />
      </button>
    </div>
  );
}
