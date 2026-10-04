"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="flex min-h-[70svh] items-center bg-asphalt-950 px-4 pb-24 pt-32">
      <div className="mx-auto max-w-xl text-center">
        <Icon name="alert" size={44} className="mx-auto text-beacon-500" />
        <h1 className="font-display mt-5 text-6xl">Petite panne technique</h1>
        <p className="mt-4 text-lg text-asphalt-300">
          Cette page n&apos;a pas pu s&apos;afficher. Les boutons Appeler et WhatsApp en bas de l&apos;écran fonctionnent
          toujours.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="h-14 rounded-2xl bg-signal-500 px-6 font-extrabold text-asphalt-950">
            Réessayer
          </button>
          <Link href="/" className="inline-flex h-14 items-center justify-center rounded-2xl border border-white/20 px-6 font-bold">
            Accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
