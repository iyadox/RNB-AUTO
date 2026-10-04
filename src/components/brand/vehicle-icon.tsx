/** Silhouettes de véhicules (vue de profil) pour les tuiles de choix. */
import type { SVGProps } from "react";
import type { IconName } from "@/components/ui/icon";

const SHAPES: Record<string, { body: string; wheels: [number, number]; windows?: string }> = {
  citadine: {
    body: "M8 31 V24 Q8 21 11 20 L19 13 Q21 11.5 24 11.5 H37 Q40 11.5 42 14 L47 20 Q53 21 55 24 V31 Z",
    wheels: [17, 46],
    windows: "M21 19 L26 14.5 H32 V19 Z M34 19 V14.5 H38 Q39.5 14.5 40.5 16 L43 19 Z",
  },
  berline: {
    body: "M4 31 V25 Q4 22 8 21.5 L18 20 L25 13 Q27 11.5 30 11.5 H41 Q44 11.5 46 14 L51 20 Q59 21 60 25 V31 Z",
    wheels: [15, 50],
    windows: "M24 19.5 L28.5 14.5 H35 V19.5 Z M37 19.5 V14.5 H42 Q43.5 14.5 44.5 16 L47 19.5 Z",
  },
  break: {
    body: "M4 31 V24 Q4 21 8 20.5 L17 19.5 L23 12.5 Q24.5 11 27 11 H54 Q57 11 58.5 14 L60 20 V31 Z",
    wheels: [15, 50],
    windows: "M22 18.5 L26.5 13.5 H35 V18.5 Z M37 18.5 V13.5 H47 V18.5 Z M49 18.5 V13.5 H55 Q56 13.5 56.5 15 L57.5 18.5 Z",
  },
  suv: {
    body: "M5 32 V22 Q5 19 9 18.5 L17 17.5 L22 9.5 Q23.5 8 26 8 H52 Q55 8 56.5 11 L59 18 V32 Z",
    wheels: [16, 49],
    windows: "M21 16.5 L25 10.5 H34 V16.5 Z M36 16.5 V10.5 H45 V16.5 Z M47 16.5 V10.5 H52 Q53.5 10.5 54.5 12.5 L56 16.5 Z",
  },
  "4x4": {
    body: "M6 32 V21 Q6 18 9 17.5 L16 17 L20 8.5 Q21 7 23.5 7 H52 Q55 7 56 10 L57 17 V32 Z",
    wheels: [17, 47],
    windows: "M19.5 15.5 L23 9.5 H33 V15.5 Z M35 15.5 V9.5 H44 V15.5 Z M46 15.5 V9.5 H52 Q53.5 9.5 54 11.5 L54.5 15.5 Z",
  },
  utilitaire: {
    body: "M5 32 V22 Q5 18.5 9 18 L15 17 L20 9.5 Q21.5 8 24 8 H56 Q59 8 59 11 V32 Z",
    wheels: [16, 49],
    windows: "M19 16 L23 10.5 H31 V16 Z",
  },
  petit_fourgon: {
    body: "M4 32 V20 Q4 16.5 8 16 L13 15.5 L17 6.5 Q18.5 5 21 5 H58 Q60 5 60 7.5 V32 Z",
    wheels: [15, 50],
    windows: "M16 14 L19.5 7.5 H27 V14 Z",
  },
  grand_fourgon: {
    body: "M3 33 V18 Q3 14.5 7 14 L11 13.5 L14 4 Q15 2.5 17.5 2.5 H60 Q61.5 2.5 61.5 4.5 V33 Z",
    wheels: [14, 52],
    windows: "M13 12 L15.8 5 H23 V12 Z",
  },
};

export function VehicleIcon({ code, ...props }: SVGProps<SVGSVGElement> & { code: string }) {
  const shape = SHAPES[code];
  if (!shape) {
    return (
      <svg viewBox="0 0 64 40" aria-hidden="true" {...props}>
        <circle cx="32" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M27.5 16a4.5 4.5 0 0 1 8.7 1.6c0 3-4.2 3.6-4.2 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="28" r="1.6" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true" {...props}>
      <path d={shape.body} fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {shape.windows ? <path d={shape.windows} fill="currentColor" opacity="0.55" /> : null}
      {shape.wheels.map((x) => (
        <g key={x}>
          <circle cx={x} cy={32} r={5.6} fill="var(--wheel-bg, #0d0f12)" stroke="currentColor" strokeWidth="2" />
          <circle cx={x} cy={32} r={1.8} fill="currentColor" />
        </g>
      ))}
    </svg>
  );
}

/** Pictogramme associé à une situation (problème, état, particularité). */
export const SITUATION_ICONS: Record<string, IconName> = {
  battery: "battery",
  flat_tire: "tire",
  breakdown: "engine",
  accident: "accident",
  locked_wheels: "wheelLock",
  other: "question",
  rolling: "rolling",
  non_rolling: "nonRolling",
  parking: "parking",
  hard_to_load: "lowCar",
  winching: "winch",
  difficult_access: "access",
  heavy: "weight",
};
