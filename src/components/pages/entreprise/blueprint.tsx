/**
 * /entreprise, PK 01 « Un plateau prêt à partir » (docs/09, F.6) : le plan technique.
 *
 * Un cadre `blueprint` quadrillé, la dépanneuse au trait (`TowTruck variant="blueprint"`) et trois
 * lignes de rappel qui se tracent vers des annotations. Les annotations reprennent mot pour mot
 * les textes existants de la page ; **aucune dimension, aucune caractéristique** (G.4).
 *
 * Deux repères pour les lignes de rappel : 1200 × 560 à partir de `md` (annotations autour du
 * dessin), 400 × 230 sur mobile (lettres sur le dessin, annotations en liste dessous). La boîte
 * de la dépanneuse est placée en pourcentages identiques dans le CSS.
 *
 * À l'entrée dans l'écran (une fois) : une ligne de balayage « imprime » la dépanneuse, les
 * pastilles tombent, les lignes se tracent, les annotations montent. Sans JavaScript et en
 * `off` : plan complet.
 */
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { TowTruck } from "@/components/brand/tow-truck";
import { cn } from "@/components/ui/cn";
import styles from "./entreprise.module.css";

const k = (index: number) => ({ "--k": index }) as CSSProperties;

function Letter({ x, y, label, index, r = 13 }: { x: number; y: number; label: string; index: number; r?: number }) {
  return (
    <g className={styles.letter} style={k(index)}>
      <circle className={styles.letterDisc} cx={x} cy={y} r={r} />
      <text className={styles.letterText} x={x} y={y + r * 0.36} textAnchor="middle" fontSize={r * 1.05}>
        {label}
      </text>
    </g>
  );
}

function Dot({ x, y, index, r = 5 }: { x: number; y: number; index: number; r?: number }) {
  return <circle className={styles.leaderDot} cx={x} cy={y} r={r} style={k(index)} />;
}

/** Lignes de rappel, ordinateur et tablette (repère 1200 × 560). */
function WideLeaders() {
  return (
    <svg className={cn(styles.leaders, styles.leadersWide)} viewBox="0 0 1200 560" preserveAspectRatio="none" aria-hidden="true">
      {/* A · Plateau : le point se pose sur le pont du plateau, derrière la voiture chargée ; le
          rappel part vers la gauche sans traverser le dessin. */}
      <path className={cn(styles.leaderLine, "draw")} pathLength={1} d="M350 258L318 200H48" style={k(0)} />
      <Dot x={350} y={258} index={0} />
      {/* C · Interlocuteur direct : le pare-brise de la cabine, rappel vers la droite au-dessus du capot. */}
      <path className={cn(styles.leaderLine, "draw")} pathLength={1} d="M795 231L826 200H1152" style={k(1)} />
      <Dot x={795} y={231} index={1} />
      {/* B · Départ : la flèche part des phares, puis le rappel descend vers l'annotation */}
      <path className={cn(styles.leaderArrow, "draw")} pathLength={1} d="M874 259H1096" style={k(2)} />
      <path className={cn(styles.leaderLine, "draw")} pathLength={1} d="M1082 248L1098 259L1082 270" style={k(2)} />
      <path className={cn(styles.leaderLine, "draw")} pathLength={1} d="M968 259V418M792 418H1152" style={k(2)} />
      <Dot x={968} y={259} index={2} />
    </svg>
  );
}

/** Lignes de rappel, mobile (repère 400 × 230) : une lettre près de chaque partie. */
function NarrowLeaders() {
  return (
    <svg className={cn(styles.leaders, styles.leadersNarrow)} viewBox="0 0 400 230" preserveAspectRatio="none" aria-hidden="true">
      <path className={cn(styles.leaderLine, "draw")} pathLength={1} d="M67 106L54 34" style={k(0)} />
      <Dot x={67} y={106} index={0} r={3.5} />
      <Letter x={52} y={22} label="A" index={0} r={12} />

      <path className={cn(styles.leaderLine, "draw")} pathLength={1} d="M304 92L320 34" style={k(1)} />
      <Dot x={304} y={92} index={1} r={3.5} />
      <Letter x={322} y={22} label="C" index={1} r={12} />

      <path className={cn(styles.leaderArrow, "draw")} pathLength={1} d="M344 106H392" style={k(2)} />
      <path className={cn(styles.leaderLine, "draw")} pathLength={1} d="M366 106V192" style={k(2)} />
      <Dot x={366} y={106} index={2} r={3.5} />
      <Letter x={366} y={206} label="B" index={2} r={12} />
    </svg>
  );
}

function Note({
  letter,
  title,
  className,
  index,
  children,
}: {
  letter: string;
  title: string;
  className?: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <li className={cn(styles.note, className)} style={k(index)}>
      <span className={styles.noteLetter} aria-hidden="true">
        {letter}
      </span>
      <span className={styles.noteTitle}>{title}</span>
      <span className={styles.noteText}>{children}</span>
    </li>
  );
}

export function Blueprint({ depotLabel }: { depotLabel: string }): ReactElement {
  return (
    <div className={styles.sheet} data-inview-once="">
      <span className={styles.sheetCorner} style={{ left: "0.15rem", top: "0.15rem" }} aria-hidden="true" />
      <span className={styles.sheetCorner} style={{ right: "0.15rem", top: "0.15rem" }} aria-hidden="true" />
      <span className={styles.sheetCorner} style={{ left: "0.15rem", bottom: "0.15rem" }} aria-hidden="true" />
      <span className={styles.sheetCorner} style={{ right: "0.15rem", bottom: "0.15rem" }} aria-hidden="true" />

      <div className={styles.plan}>
        <div className={styles.drawing}>
          <div className={styles.drawingTruck} aria-hidden="true">
            <TowTruck variant="blueprint" loaded beacon={false} id="entreprise-blueprint-truck" />
          </div>
          <div className={styles.scanBox} aria-hidden="true">
            <div className={styles.scan} />
          </div>
          <WideLeaders />
          <NarrowLeaders />
        </div>

        <ol className={styles.notes}>
          <Note letter="A" title="Plateau" className={styles.noteA} index={0}>
            Le chargement sur plateau protège votre véhicule pendant le transport, qu&apos;il roule ou non.
          </Note>
          <Note letter="B" title="Départ" className={styles.noteB} index={2}>
            Notre dépanneuse plateau part de <strong>{depotLabel}</strong>.
          </Note>
          <Note letter="C" title="Un interlocuteur direct" className={styles.noteC} index={1}>
            Chaque demande est traitée directement par RNB AUTO : la personne qui vous rappelle est celle qui organise
            l&apos;intervention.
          </Note>
        </ol>

        <div className={styles.cartouche} aria-hidden="true">
          <span className={styles.cartoucheMark} />
          <span className={styles.cartoucheText}>
            <span>RNB AUTO</span>
            <span>Notre dépanneuse</span>
          </span>
        </div>
      </div>
    </div>
  );
}
