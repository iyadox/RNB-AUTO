/**
 * Logo RNB AUTO (proposition) : losange inspiré du panneau « route prioritaire »
 * avec un crochet de remorquage, et le nom en lettres larges.
 */
import { cn } from "@/components/ui/cn";

export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <path d="M24 1.5 46.5 24 24 46.5 1.5 24Z" fill="var(--color-chalk)" />
      <path d="M24 5.5 42.5 24 24 42.5 5.5 24Z" fill="var(--color-signal-500)" />
      <path d="M24 9 39 24 24 39 9 24Z" fill="none" stroke="var(--color-asphalt-950)" strokeWidth="1.2" opacity="0.18" />
      {/* Crochet de remorquage */}
      <circle cx="24" cy="13.2" r="2.2" fill="none" stroke="var(--color-asphalt-950)" strokeWidth="2.2" />
      <path
        d="M24 15.6V27.3a5.4 5.4 0 1 1-5.4-5.4"
        fill="none"
        stroke="var(--color-asphalt-950)"
        strokeWidth="3.1"
        strokeLinecap="round"
      />
      <path d="M18.6 21.9l-1.9 2.2" stroke="var(--color-asphalt-950)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  className,
  tone = "light",
  compact = false,
}: {
  className?: string;
  tone?: "light" | "dark";
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9 shrink-0" />
      {compact ? null : (
        <span className={cn("leading-none", tone === "light" ? "text-chalk" : "text-asphalt-950")}>
          <span className="font-wide block text-[1.15rem] tracking-[0.06em]">RNB AUTO</span>
          <span
            className={cn(
              "mt-1 block text-[0.6rem] font-semibold uppercase tracking-[0.32em]",
              tone === "light" ? "text-signal-500" : "text-asphalt-500",
            )}
          >
            Dépannage · Remorquage
          </span>
        </span>
      )}
    </span>
  );
}
