"use client";

/**
 * Commandes de la fiche d'une demande : gros bouton d'étape suivante, autres statuts, annulation,
 * prix (confirmation, ajustements avec motif) et notes internes. Le serveur vérifie tout.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatEuros, formatPercentBp, formatSignedEuros } from "@/core/format";
import {
  allowedTransitions,
  CANCEL_REASONS,
  canTransition,
  isStandardTransition,
  isTerminal,
  primaryNextStatus,
  STATUS_META,
  STATUSES,
  type InterventionStatus,
} from "@/core/interventions/status";
import {
  addAdjustmentAction,
  changeStatusAction,
  confirmPriceAction,
  removeAdjustmentAction,
  saveNotesAction,
} from "@/app/admin/(espace)/demandes/actions";
import { ChoiceCards, Modal, MoneyInput, PercentInput, Segmented, TextArea, TextInput, Toast } from "@/components/admin/inputs";
import { Alert, buttonClass } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

type ActionResult = { ok: true } | { ok: false; message: string };

function useServerAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (action: () => Promise<ActionResult>, onSuccess?: () => void) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        onSuccess?.();
        router.refresh();
      } else setError(result.message);
    });
  };
  return { pending, error, setError, run };
}

// ─── Statuts ─────────────────────────────────────────────────────────────────

export function StatusControls({ id, status, serviceKind }: { id: string; status: InterventionStatus; serviceKind: "tow" | "on_site" | "unknown" }) {
  const { pending, error, run } = useServerAction();
  const [toast, setToast] = useState<string | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const next = primaryNextStatus(status, serviceKind);

  if (isTerminal(status)) {
    return (
      <div className="rounded-3xl border border-asphalt-200 bg-white p-5">
        <p className="font-extrabold">{status === "completed" ? "Intervention terminée." : "Demande annulée."}</p>
        <p className="text-sm text-asphalt-500">Elle reste consultable ; son prix et son calcul ne changent plus.</p>
      </div>
    );
  }

  const move = (to: InterventionStatus, force = false, cancelReason?: string) =>
    run(
      () => changeStatusAction({ id, to, force, cancelReason }),
      () => {
        setOtherOpen(false);
        setCancelOpen(false);
        setToast(`Statut : ${STATUS_META[to].label}`);
      },
    );

  const others = STATUSES.filter((to) => to !== next && to !== "cancelled" && to !== "new" && canTransition(status, to, true));

  return (
    <div className="grid grid-cols-1 gap-3">
      {next ? (
        <button type="button" disabled={pending} onClick={() => move(next)} className={cn(buttonClass("primary", "lg"), "h-20 w-full text-xl")}>
          {pending ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-asphalt-950 border-t-transparent" aria-hidden="true" />
          ) : (
            <Icon name={STATUS_META[next].icon} size={26} />
          )}
          {STATUS_META[next].action}
        </button>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending || others.length === 0} onClick={() => setOtherOpen(true)} className={cn(buttonClass("secondary"), "flex-1 whitespace-nowrap")}>
          <Icon name="list" size={18} />
          Autre statut
        </button>
        <button type="button" disabled={pending} onClick={() => setCancelOpen(true)} className={cn(buttonClass("secondary"), "flex-1 whitespace-nowrap text-red-700")}>
          <Icon name="x" size={18} />
          Annuler la demande
        </button>
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Modal open={otherOpen} onClose={() => setOtherOpen(false)} title="Choisir un statut">
        <div className="grid gap-2">
          {others.map((to) => {
            const standard = isStandardTransition(status, to);
            return (
              <button
                key={to}
                type="button"
                disabled={pending}
                onClick={() => move(to, !standard)}
                className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-asphalt-200 px-4 py-3 text-left hover:border-asphalt-900"
              >
                <Icon name={STATUS_META[to].icon} size={22} className="text-asphalt-500" />
                <span className="flex-1">
                  <span className="block font-extrabold">{STATUS_META[to].label}</span>
                  {!standard ? <span className="block text-sm text-asphalt-500">Saute une ou plusieurs étapes (noté dans le journal).</span> : null}
                </span>
                <Icon name="chevronRight" size={18} className="text-asphalt-400" />
              </button>
            );
          })}
        </div>
      </Modal>

      <CancelModal open={cancelOpen} onClose={() => setCancelOpen(false)} pending={pending} onConfirm={(reason) => move("cancelled", !allowedTransitions(status).includes("cancelled"), reason)} />
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

function CancelModal({ open, onClose, onConfirm, pending }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void; pending: boolean }) {
  const [choice, setChoice] = useState<string>(CANCEL_REASONS[0]);
  const [other, setOther] = useState("");
  const reason = choice === "Autre" ? other.trim() : choice;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Annuler la demande ?"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={buttonClass("secondary")} onClick={onClose}>
            Ne pas annuler
          </button>
          <button type="button" className={buttonClass("danger")} disabled={pending || reason.length < 2} onClick={() => onConfirm(reason)}>
            Annuler la demande
          </button>
        </div>
      }
    >
      <p className="mb-3 font-bold">Pour quelle raison ?</p>
      <ChoiceCards value={choice} onChange={setChoice} options={CANCEL_REASONS.map((r) => ({ value: r, label: r }))} name="Motif d'annulation" />
      {choice === "Autre" ? (
        <div className="mt-3">
          <TextInput value={other} onChange={setOther} ariaLabel="Motif" placeholder="Précisez le motif" maxLength={200} />
        </div>
      ) : null}
    </Modal>
  );
}

// ─── Prix ────────────────────────────────────────────────────────────────────

export type AdjustmentRow = { id: string; effect: "supplement" | "discount"; mode: "amount" | "percent"; value: number; reason: string };

const QUICK_REASONS = ["Client régulier", "Accès difficile", "Attente supplémentaire", "Remise commerciale", "Geste commercial"];

export function PriceControls({
  id,
  locked,
  calculatedCents,
  adjustedCents,
  adjustments,
  confirmedCents,
  hasQuote,
}: {
  id: string;
  locked: boolean;
  calculatedCents: number | null;
  adjustedCents: number | null;
  adjustments: AdjustmentRow[];
  confirmedCents: number | null;
  hasQuote: boolean;
}) {
  const { pending, error, run } = useServerAction();
  const [open, setOpen] = useState(false);
  const current = adjustedCents ?? calculatedCents;
  const confirmedUpToDate = confirmedCents !== null && confirmedCents === current;

  return (
    <div className="grid grid-cols-1 gap-3">
      {adjustments.length > 0 ? (
        <ul className="divide-y divide-asphalt-100 rounded-2xl border border-asphalt-200">
          {adjustments.map((adjustment) => (
            <li key={adjustment.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn("font-extrabold tabular", adjustment.effect === "discount" ? "text-green-700" : "text-asphalt-900")}>
                {adjustment.effect === "discount" ? "−" : "+"}
                {adjustment.mode === "percent" ? formatPercentBp(adjustment.value) : formatEuros(adjustment.value)}
              </span>
              <span className="min-w-0 flex-1 truncate text-asphalt-700">{adjustment.reason}</span>
              {!locked ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => removeAdjustmentAction({ id, adjustmentId: adjustment.id }))}
                  className="rounded-full p-2 text-asphalt-400 hover:bg-asphalt-100 hover:text-red-700"
                  aria-label={`Retirer l'ajustement « ${adjustment.reason} »`}
                >
                  <Icon name="x" size={16} />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {!locked && hasQuote ? (
        <div className="grid grid-cols-1 gap-2">
          <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary")}>
            <Icon name="plus" size={18} />
            Ajouter un ajustement
          </button>
          <button
            type="button"
            disabled={pending || current === null || confirmedUpToDate}
            onClick={() => run(() => confirmPriceAction(id))}
            className={buttonClass(confirmedUpToDate ? "secondary" : "dark")}
          >
            <Icon name="check" size={18} />
            {confirmedUpToDate ? "Prix confirmé" : "Confirmer ce prix"}
          </button>
        </div>
      ) : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <AdjustmentModal open={open} onClose={() => setOpen(false)} pending={pending} baseCents={current} onSubmit={(adjustment) => run(() => addAdjustmentAction({ id, ...adjustment }), () => setOpen(false))} />
    </div>
  );
}

function AdjustmentModal({
  open,
  onClose,
  onSubmit,
  pending,
  baseCents,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (adjustment: Omit<AdjustmentRow, "id">) => void;
  pending: boolean;
  baseCents: number | null;
}) {
  const [effect, setEffect] = useState<AdjustmentRow["effect"]>("supplement");
  const [mode, setMode] = useState<AdjustmentRow["mode"]>("amount");
  const [amount, setAmount] = useState(1000);
  const [rate, setRate] = useState(1000);
  const [reason, setReason] = useState("");
  const value = mode === "amount" ? amount : rate;
  const preview = baseCents !== null ? Math.round(mode === "amount" ? value : (baseCents * value) / 10_000) * (effect === "discount" ? -1 : 1) : null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter un ajustement"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className={buttonClass("secondary")} onClick={onClose}>
            Annuler
          </button>
          <button type="button" className={buttonClass("primary")} disabled={pending || value <= 0 || reason.trim().length < 2} onClick={() => onSubmit({ effect, mode, value, reason: reason.trim() })}>
            Ajouter
          </button>
        </div>
      }
    >
      <div className="grid gap-5">
        <div>
          <p className="mb-2 font-bold">Type</p>
          <Segmented
            value={effect}
            onChange={setEffect}
            options={[
              { value: "supplement", label: "Supplément" },
              { value: "discount", label: "Remise" },
            ]}
            ariaLabel="Type d'ajustement"
          />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-bold">En</p>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "amount", label: "€" },
                { value: "percent", label: "%" },
              ]}
              ariaLabel="Mode"
            />
          </div>
          {mode === "amount" ? (
            <MoneyInput cents={amount} onChange={setAmount} ariaLabel="Montant de l'ajustement" width="w-36" />
          ) : (
            <PercentInput bp={rate} onChange={setRate} ariaLabel="Pourcentage de l'ajustement" />
          )}
        </div>
        <div>
          <p className="mb-2 font-bold">Motif</p>
          <div className="mb-2 flex flex-wrap gap-2">
            {QUICK_REASONS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setReason(quick)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-bold",
                  reason === quick ? "bg-asphalt-900 text-chalk" : "bg-asphalt-100 text-asphalt-700 hover:bg-asphalt-200",
                )}
              >
                {quick}
              </button>
            ))}
          </div>
          <TextInput value={reason} onChange={setReason} ariaLabel="Motif de l'ajustement" placeholder="Ex. Attente sur place" maxLength={200} />
        </div>
        {preview !== null ? (
          <p className="rounded-2xl bg-asphalt-50 px-4 py-3 font-bold">
            Effet : {formatSignedEuros(preview)} sur le prix (arrondi appliqué ensuite selon vos réglages).
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

// ─── Notes internes ──────────────────────────────────────────────────────────

export function NotesEditor({ id, initial }: { id: string; initial: string }) {
  const { pending, error, run } = useServerAction();
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(false);
  const dirty = notes.trim() !== initial.trim();
  return (
    <div className="grid grid-cols-1 gap-3">
      <TextArea
        value={notes}
        onChange={(value) => {
          setNotes(value);
          setSaved(false);
        }}
        ariaLabel="Notes internes"
        placeholder="Visible uniquement par RNB AUTO (code portail, clés, contact sur place…)"
        rows={4}
        maxLength={4000}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-bold text-green-700" role="status">
          {saved && !dirty ? "Notes enregistrées." : ""}
        </p>
        <button type="button" disabled={pending || !dirty} onClick={() => run(() => saveNotesAction({ id, notes }), () => setSaved(true))} className={cn(buttonClass("dark", "sm"), "shrink-0")}>
          Enregistrer
        </button>
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </div>
  );
}
