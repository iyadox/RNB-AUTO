import Link from "next/link";
import { TowTruck } from "@/components/brand/tow-truck";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden bg-asphalt-950 pb-24 pt-32">
      <div className="map-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-signal-500">Erreur 404</p>
          <h1 className="font-display mt-4 text-[clamp(3rem,12vw,7rem)]">
            Cette page est <span className="text-signal-500">en panne.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-asphalt-300">
            La page demandée n&apos;existe pas ou a été déplacée. Pas d&apos;inquiétude : nous pouvons toujours vous
            dépanner.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/demande" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-signal-500 px-6 font-extrabold text-asphalt-950">
              Demander un dépannage
              <Icon name="arrowRight" size={20} strokeWidth={2.6} />
            </Link>
            <Link href="/" className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/20 px-6 font-bold">
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
        <TowTruck loaded moving id="notfound-truck" />
      </div>
    </section>
  );
}
