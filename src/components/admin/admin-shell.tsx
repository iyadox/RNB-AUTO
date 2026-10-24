"use client";

/**
 * Coque de l'espace RNB AUTO : barre sombre en haut et onglets en bas sur téléphone, menu sombre
 * à gauche sur ordinateur. Veille des nouvelles demandes (compteur dans l'onglet, alerte discrète).
 * Rien de la coque n'est imprimé (bon d'intervention).
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/auth-actions";
import { AdminIcon } from "@/components/admin/admin-icons";
import { NewRequestWatcher, type WatchState } from "@/components/admin/new-request-watcher";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";

const NAV: { href: string; label: string; short: string; icon: IconName; mobile: boolean }[] = [
  { href: "/admin", label: "Accueil", short: "Accueil", icon: "home", mobile: true },
  { href: "/admin/demandes", label: "Demandes", short: "Demandes", icon: "list", mobile: true },
  { href: "/admin/tarifs", label: "Mes tarifs", short: "Tarifs", icon: "euro", mobile: true },
  { href: "/admin/tester", label: "Tester mes tarifs", short: "Tester", icon: "flask", mobile: true },
  { href: "/admin/tarifs/historique", label: "Historique des tarifs", short: "Historique", icon: "history", mobile: false },
  { href: "/admin/parametres", label: "Paramètres", short: "Réglages", icon: "settings", mobile: true },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/tarifs") return pathname === "/admin/tarifs";
  return pathname.startsWith(href);
}

export function AdminShell({ userName, watch, children }: { userName: string; watch: WatchState; children: React.ReactNode }) {
  const pathname = usePathname();
  const waiting = watch.waitingCount;
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_1fr] print:block">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-asphalt-950 px-4 py-6 text-chalk lg:flex print:hidden">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <LogoMark className="h-10 w-10" />
          <div>
            <p className="font-wide text-lg leading-none">RNB AUTO</p>
            <p className="mt-1 text-xs font-semibold text-asphalt-300">Espace de gestion</p>
          </div>
        </Link>
        <div className="chevrons mt-6 h-1.5 rounded-full opacity-90" aria-hidden="true" />
        <Link
          href="/admin/demandes/nouvelle"
          className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-signal-500 font-extrabold text-asphalt-950 transition-colors hover:bg-signal-400"
        >
          <Icon name="plus" size={18} strokeWidth={3} />
          Nouvelle demande
        </Link>
        <nav aria-label="Menu" className="mt-6 grid gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-2xl px-4 font-bold transition-colors",
                  active ? "bg-white text-asphalt-950" : "text-asphalt-300 hover:bg-white/10 hover:text-chalk",
                )}
              >
                <Icon name={item.icon} size={20} className={active ? "text-asphalt-950" : undefined} />
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin/demandes" && waiting > 0 ? (
                  <span className="min-w-6 rounded-full bg-signal-500 px-2 py-0.5 text-center text-xs font-extrabold text-asphalt-950 tabular" aria-label={`${waiting} à traiter`}>
                    {waiting}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/5 p-3">
          <Link href="/admin/parametres/compte" className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-white/5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-asphalt-700 text-sm font-extrabold uppercase text-signal-400">
              {userName.trim().charAt(0) || "?"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">{userName}</span>
              <span className="block text-xs text-asphalt-400">Mon compte</span>
            </span>
          </Link>
          <div className="mt-2 flex gap-1">
            <Link href="/" className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-asphalt-300 hover:bg-white/10 hover:text-chalk">
              <Icon name="external" size={16} />
              Voir le site
            </Link>
            <form action={logoutAction} className="flex-1">
              <button type="submit" className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-asphalt-300 hover:bg-white/10 hover:text-chalk">
                <Icon name="logout" size={16} />
                Quitter
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 bg-asphalt-950 px-4 text-chalk lg:hidden print:hidden">
          <Link href="/admin" className="mr-auto flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-wide text-base">RNB AUTO</span>
          </Link>
          <Link
            href={watch.newCount > 0 ? "/admin/demandes?statut=nouvelles" : "/admin/demandes"}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-chalk hover:bg-white/10"
            aria-label={watch.newCount > 0 ? `${watch.newCount} nouvelle${watch.newCount > 1 ? "s" : ""} demande${watch.newCount > 1 ? "s" : ""}` : "Demandes"}
          >
            <AdminIcon name="bell" size={22} />
            {watch.newCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-signal-500 px-1 text-[0.7rem] font-extrabold text-asphalt-950 tabular">
                {watch.newCount}
              </span>
            ) : null}
          </Link>
          <Link href="/admin/demandes/nouvelle" className="flex h-10 items-center gap-1.5 rounded-xl bg-signal-500 px-3 text-sm font-extrabold text-asphalt-950">
            <Icon name="plus" size={16} strokeWidth={3} />
            Demande
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10 print:max-w-none print:p-0">{children}</main>
      </div>

      <nav
        aria-label="Menu"
        className="safe-bottom fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-asphalt-200 bg-white/95 px-1 pt-1.5 backdrop-blur lg:hidden print:hidden"
      >
        {NAV.filter((item) => item.mobile).map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.7rem] font-extrabold", active ? "text-asphalt-950" : "text-asphalt-500")}
            >
              <span className={cn("flex h-8 w-12 items-center justify-center rounded-full transition-colors", active && "bg-signal-500")}>
                <Icon name={item.icon} size={20} />
              </span>
              {item.short}
              {item.href === "/admin/demandes" && waiting > 0 ? (
                <span className="absolute right-2 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] text-white tabular">{waiting}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <NewRequestWatcher initial={watch} />
    </div>
  );
}
