import { LogoMark } from "@/components/brand/logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark className="h-12 w-12" />
          <div>
            <p className="font-wide text-xl">RNB AUTO</p>
            <p className="text-sm font-semibold text-asphalt-500">Espace de gestion</p>
          </div>
        </div>
        <div className="rounded-[2rem] border border-asphalt-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-1.5 text-asphalt-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
