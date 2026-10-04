"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { PhoneLink } from "@/core/contact";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

const NAV = [
  { href: "/depannage", label: "Dépannage" },
  { href: "/remorquage", label: "Remorquage" },
  { href: "/zones-d-intervention", label: "Zones" },
  { href: "/panne-autoroute", label: "Autoroute" },
  { href: "/questions-frequentes", label: "Questions" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ phone, announcement }: { phone: PhoneLink | null; announcement: string | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "border-b border-white/10 bg-asphalt-950/85 backdrop-blur-xl" : "border-b border-transparent bg-transparent",
      )}
    >
      {announcement ? (
        <div className="bg-beacon-500 px-4 py-1.5 text-center text-sm font-bold text-asphalt-950">
          <Icon name="info" size={15} className="mr-1.5 inline -translate-y-px" />
          {announcement}
        </div>
      ) : null}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
        <Link href="/" className="shrink-0" aria-label="RNB AUTO, accueil">
          <Logo />
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                pathname.startsWith(item.href) ? "bg-white/10 text-signal-400" : "text-asphalt-200 hover:text-chalk",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {phone ? (
            <a
              href={phone.href}
              className="hidden items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-bold tabular text-chalk transition-colors hover:border-signal-500 hover:text-signal-400 sm:flex"
            >
              <Icon name="phone" size={16} strokeWidth={2.4} />
              {phone.display}
            </a>
          ) : null}
          <Link
            href="/demande"
            className="hidden items-center gap-2 rounded-full bg-signal-500 px-5 py-2.5 text-sm font-extrabold text-asphalt-950 transition-transform hover:-translate-y-0.5 md:flex"
          >
            Demander un dépannage
            <Icon name="arrowRight" size={16} strokeWidth={2.6} />
          </Link>

          <details ref={menuRef} className="group relative lg:hidden">
            <summary
              className="flex h-11 w-11 list-none items-center justify-center rounded-full border border-white/15 text-chalk [&::-webkit-details-marker]:hidden"
              aria-label="Ouvrir le menu"
            >
              <Icon name="menu" size={20} className="group-open:hidden" />
              <Icon name="x" size={20} className="hidden group-open:block" />
            </summary>
            <div className="fixed inset-x-3 top-[4.5rem] rounded-3xl border border-white/10 bg-asphalt-900/97 p-3 shadow-2xl backdrop-blur-xl">
              <nav aria-label="Menu" className="grid">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl px-4 py-3.5 text-lg font-bold text-chalk active:bg-white/5"
                  >
                    {item.label}
                    <Icon name="chevronRight" size={18} className="text-asphalt-400" />
                  </Link>
                ))}
                <Link
                  href="/demande"
                  className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-signal-500 px-4 py-4 text-lg font-extrabold text-asphalt-950"
                >
                  Demander un dépannage
                  <Icon name="arrowRight" size={18} strokeWidth={2.6} />
                </Link>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
