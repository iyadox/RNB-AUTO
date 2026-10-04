"use client";

/** Navigation de l'espace RNB AUTO : onglets en bas sur téléphone, menu à gauche sur ordinateur. */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/auth-actions";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";

const NAV: { href: string; label: string; icon: IconName; mobile: boolean }[] = [
  { href: "/admin", label: "Accueil", icon: "home", mobile: true },
  { href: "/admin/demandes", label: "Demandes", icon: "list", mobile: true },
  { href: "/admin/tarifs", label: "Mes tarifs", icon: "euro", mobile: true },
  { href: "/admin/tester", label: "Tester", icon: "flask", mobile: true },
  { href: "/admin/tarifs/historique", label: "Historique des tarifs", icon: "history", mobile: false },
  { href: "/admin/parametres", label: "Paramètres", icon: "settings", mobile: true },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/tarifs") return pathname === "/admin/tarifs";
  return pathname.startsWith(href);
}

export function AdminShell({ userName, newCount, children }: { userName: string; newCount: number; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-asphalt-200 bg-white px-4 py-6 lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-2">
          <LogoMark className="h-10 w-10" />
          <div>
            <p className="font-wide text-lg leading-none">RNB AUTO</p>
            <p className="mt-1 text-xs font-semibold text-asphalt-500">Espace de gestion</p>
          </div>
        </Link>
        <Link href="/admin/demandes/nouvelle" className="mt-8 flex h-12 items-center justify-center gap-2 rounded-2xl bg-signal-500 font-extrabold text-asphalt-950">
          <Icon name="phone" size={18} />
          Nouvelle demande
        </Link>
        <nav aria-label="Menu" className="mt-6 grid gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-12 items-center gap-3 rounded-2xl px-4 font-bold transition-colors",
                isActive(pathname, item.href) ? "bg-asphalt-900 text-chalk" : "text-asphalt-600 hover:bg-asphalt-100 hover:text-asphalt-900",
              )}
            >
              <Icon name={item.icon} size={20} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/admin/demandes" && newCount > 0 ? (
                <span className="rounded-full bg-signal-500 px-2 py-0.5 text-xs font-extrabold text-asphalt-950">{newCount}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-asphalt-200 pt-4">
          <p className="px-2 text-sm font-bold">{userName}</p>
          <div className="mt-2 flex gap-2">
            <Link href="/" className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-asphalt-600 hover:bg-asphalt-100">
              <Icon name="external" size={16} />
              Voir le site
            </Link>
            <form action={logoutAction} className="flex-1">
              <button type="submit" className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-asphalt-600 hover:bg-asphalt-100">
                <Icon name="logout" size={16} />
                Quitter
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-asphalt-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-wide text-base">RNB AUTO</span>
          </Link>
          <Link href="/admin/demandes/nouvelle" className="flex h-10 items-center gap-1.5 rounded-xl bg-signal-500 px-3 text-sm font-extrabold text-asphalt-950">
            <Icon name="plus" size={16} strokeWidth={3} />
            Demande
          </Link>
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 pb-32 pt-6 sm:px-6 lg:pb-16 lg:pt-10">{children}</main>
      </div>

      <nav aria-label="Menu" className="safe-bottom fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-asphalt-200 bg-white/95 px-1 pt-1.5 backdrop-blur lg:hidden">
        {NAV.filter((item) => item.mobile).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.7rem] font-extrabold",
              isActive(pathname, item.href) ? "text-asphalt-950" : "text-asphalt-400",
            )}
          >
            <span className={cn("flex h-8 w-12 items-center justify-center rounded-full transition-colors", isActive(pathname, item.href) && "bg-signal-500")}>
              <Icon name={item.icon} size={20} />
            </span>
            {item.label.replace("Mes tarifs", "Tarifs")}
            {item.href === "/admin/demandes" && newCount > 0 ? (
              <span className="absolute right-2 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.65rem] text-white">{newCount}</span>
            ) : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
