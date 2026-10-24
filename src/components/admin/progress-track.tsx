/** Frise d'avancement d'une intervention : étapes passées (avec l'heure), étape actuelle, à venir. */
import { formatTime } from "@/core/format";
import { progressIndex, progressSteps, STEP_LABELS, type InterventionStatus, type ServiceKind } from "@/core/interventions/status";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

export function ProgressTrack({
  status,
  serviceKind,
  times,
}: {
  status: InterventionStatus;
  serviceKind: ServiceKind;
  /** Heure de passage à chaque étape (première fois). */
  times: Partial<Record<InterventionStatus, Date>>;
}) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-asphalt-200 bg-white px-5 py-4 text-asphalt-600">
        <Icon name="x" size={20} />
        <p className="font-bold">Demande annulée{times.cancelled ? ` à ${formatTime(times.cancelled)}` : ""}.</p>
      </div>
    );
  }
  const steps = progressSteps(serviceKind);
  const current = progressIndex(status, serviceKind);
  return (
    <nav aria-label="Avancement de l'intervention" className="rounded-3xl border border-asphalt-200 bg-white px-3 py-4 sm:px-5">
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const done = index < current || (index === current && status === "completed");
          const active = index === current && status !== "completed";
          const time = times[step];
          return (
            <li key={step} className="relative flex flex-col items-center text-center" aria-current={active ? "step" : undefined}>
              {index < steps.length - 1 ? (
                <span className={cn("absolute left-1/2 top-[15px] h-0.5 w-full", index < current ? "bg-asphalt-900" : "bg-asphalt-200")} aria-hidden="true" />
              ) : null}
              <span
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-extrabold",
                  done && "border-asphalt-900 bg-asphalt-900 text-signal-500",
                  active && "border-signal-500 bg-signal-500 text-asphalt-950 ring-4 ring-signal-200",
                  !done && !active && "border-asphalt-200 bg-white text-asphalt-400",
                )}
              >
                {done ? <Icon name="check" size={16} strokeWidth={3} /> : index + 1}
              </span>
              <span className={cn("mt-1.5 hidden px-0.5 text-xs font-extrabold leading-tight sm:block", active ? "text-asphalt-950" : done ? "text-asphalt-700" : "text-asphalt-400")}>
                {status === "to_call_back" && step === "new" ? "À rappeler" : STEP_LABELS[step]}
              </span>
              <span className="mt-0.5 hidden h-4 text-[0.7rem] font-semibold tabular text-asphalt-500 sm:block">{time && (done || active) ? formatTime(time) : ""}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-sm sm:hidden">
        <span className="text-asphalt-500">
          Étape {current + 1} sur {steps.length} :{" "}
        </span>
        <strong>{status === "to_call_back" ? "À rappeler" : STEP_LABELS[steps[current] ?? "new"]}</strong>
        {times[steps[current] ?? "new"] ? <span className="text-asphalt-500"> · {formatTime(times[steps[current] ?? "new"]!)}</span> : null}
      </p>
    </nav>
  );
}
