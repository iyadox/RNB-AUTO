/** Éléments d'interface de l'espace RNB AUTO : simples, gros, lisibles en plein jour. */
import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { Icon, type IconName } from "@/components/ui/icon";

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-asphalt-500 hover:text-asphalt-900">
            <Icon name="arrowLeft" size={16} />
            {back.label}
          </Link>
        ) : null}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-base text-asphalt-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className, tone = "white" }: { children: React.ReactNode; className?: string; tone?: "white" | "muted" | "warn" | "danger" | "good" | "dark" }) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-5 sm:p-6",
        tone === "white" && "border-asphalt-200 bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.04)]",
        tone === "muted" && "border-asphalt-200 bg-asphalt-100/60",
        tone === "warn" && "border-signal-500/50 bg-signal-100",
        tone === "danger" && "border-red-300 bg-red-50",
        tone === "good" && "border-green-300 bg-green-50",
        tone === "dark" && "border-asphalt-800 bg-asphalt-900 text-chalk",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, description, icon }: { children: React.ReactNode; description?: string; icon?: IconName }) {
  return (
    <div className="mb-3 mt-8 flex items-start gap-3 first:mt-0">
      {icon ? (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-asphalt-900 text-signal-500">
          <Icon name={icon} size={20} />
        </span>
      ) : null}
      <div>
        <h2 className="text-xl font-extrabold">{children}</h2>
        {description ? <p className="text-sm text-asphalt-500">{description}</p> : null}
      </div>
    </div>
  );
}

type ButtonVariant = "primary" | "dark" | "secondary" | "ghost" | "danger" | "whatsapp";

export function buttonClass(variant: ButtonVariant = "primary", size: "md" | "lg" | "sm" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl font-extrabold transition-[transform,background-color] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
    size === "lg" && "h-16 px-6 text-lg",
    size === "md" && "h-12 px-5 text-base",
    size === "sm" && "h-10 px-4 text-sm",
    variant === "primary" && "bg-signal-500 text-asphalt-950 hover:bg-signal-400",
    variant === "dark" && "bg-asphalt-900 text-chalk hover:bg-asphalt-800",
    variant === "secondary" && "border-2 border-asphalt-200 bg-white text-asphalt-900 hover:border-asphalt-400",
    variant === "ghost" && "text-asphalt-700 hover:bg-asphalt-100",
    variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
    variant === "whatsapp" && "bg-whatsapp text-asphalt-950 hover:brightness-95",
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "md" | "lg" | "sm";
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonClass(variant, size), className)}>
      {children}
    </Link>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "info" | "good" | "warn" | "bad" | "danger" | "progress" | "muted" | "done"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide",
        tone === "neutral" && "bg-asphalt-100 text-asphalt-700",
        tone === "info" && "bg-sky-100 text-sky-800",
        tone === "good" && "bg-green-100 text-green-800",
        tone === "warn" && "bg-signal-200 text-asphalt-950",
        tone === "bad" && "bg-orange-100 text-orange-800",
        tone === "danger" && "bg-red-100 text-red-800",
        tone === "progress" && "bg-violet-100 text-violet-800",
        tone === "done" && "bg-asphalt-900 text-chalk",
        tone === "muted" && "bg-asphalt-100 text-asphalt-500 line-through",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatTile({ label, value, hint, icon, tone = "white" }: { label: string; value: React.ReactNode; hint?: string; icon?: IconName; tone?: "white" | "dark" | "yellow" }) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-5",
        tone === "white" && "border-asphalt-200 bg-white",
        tone === "dark" && "border-asphalt-800 bg-asphalt-900 text-chalk",
        tone === "yellow" && "border-signal-500 bg-signal-500 text-asphalt-950",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={cn("text-sm font-bold", tone === "dark" ? "text-asphalt-300" : tone === "yellow" ? "text-asphalt-800" : "text-asphalt-500")}>{label}</p>
        {icon ? <Icon name={icon} size={20} className={tone === "dark" ? "text-signal-500" : "text-asphalt-400"} /> : null}
      </div>
      <p className="mt-2 text-3xl font-extrabold tabular">{value}</p>
      {hint ? <p className={cn("mt-1 text-sm", tone === "dark" ? "text-asphalt-300" : "text-asphalt-500")}>{hint}</p> : null}
    </div>
  );
}

export function Alert({ tone = "info", title, children, icon }: { tone?: "info" | "warn" | "danger" | "good"; title?: string; children: React.ReactNode; icon?: IconName }) {
  return (
    <div
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "flex gap-3 rounded-2xl border p-4",
        tone === "info" && "border-sky-200 bg-sky-50 text-sky-900",
        tone === "warn" && "border-signal-500/60 bg-signal-100 text-asphalt-900",
        tone === "danger" && "border-red-200 bg-red-50 text-red-900",
        tone === "good" && "border-green-200 bg-green-50 text-green-900",
      )}
    >
      <Icon
        name={icon ?? (tone === "good" ? "checkCircle" : tone === "info" ? "info" : "alert")}
        size={22}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0">
        {title ? <p className="font-extrabold">{title}</p> : null}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-asphalt-200 bg-white px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-asphalt-100 text-asphalt-500">
        <Icon name={icon} size={28} />
      </span>
      <p className="mt-4 text-lg font-extrabold">{title}</p>
      {children ? <div className="mt-1 max-w-md text-asphalt-500">{children}</div> : null}
    </div>
  );
}

/** Ligne « libellé : valeur » pour les détails. */
export function DetailRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-2.5", className)}>
      <dt className="text-asphalt-500">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}
