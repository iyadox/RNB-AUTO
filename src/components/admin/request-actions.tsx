"use client";

/**
 * Petites actions de la fiche d'une demande : copier une adresse, noter un appel, ajouter une note
 * au journal, partager le bon d'intervention. Le serveur vérifie la session et valide tout.
 */
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addJournalNoteAction, createTrackingLinkAction, logCallAction } from "@/app/admin/(espace)/demandes/actions";
import { whatsappHref } from "@/core/contact";
import { smsHref, trackingMessage, type MessageContext } from "@/core/interventions/links";
import { AdminIcon } from "@/components/admin/admin-icons";
import { Toast } from "@/components/admin/inputs";
import { Alert, buttonClass } from "@/components/admin/ui";
import { cn } from "@/components/ui/cn";
import { Icon, WhatsAppIcon } from "@/components/ui/icon";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Ancien navigateur ou page non sécurisée : sélection manuelle.
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export function CopyButton({ text, label = "Copier l'adresse", className }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        if (await copyText(text)) {
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        }
      }}
      className={cn("flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-2xl bg-asphalt-100 px-2 text-sm font-extrabold transition-colors hover:bg-asphalt-200", className)}
    >
      <Icon name={done ? "check" : "copy"} size={16} className="shrink-0" />
      <span aria-live="polite">{done ? "Copiée" : label}</span>
    </button>
  );
}

/** « Client joint » / « Pas de réponse » : noté dans le journal ; sans réponse, la demande passe « À rappeler ». */
export function CallLogButtons({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const log = (outcome: "reached" | "no_answer") =>
    startTransition(async () => {
      setError(null);
      const result = await logCallAction({ id, outcome });
      if (result.ok) {
        setToast(outcome === "reached" ? "Appel noté dans le journal." : result.movedToCallBack ? "Noté. La demande passe « À rappeler »." : "Appel sans réponse noté.");
        router.refresh();
      } else setError(result.message);
    });
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-asphalt-500">Après l&apos;appel :</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={pending} onClick={() => log("reached")} className={cn(buttonClass("secondary", "custom"), "h-11 whitespace-nowrap px-2 text-sm")}>
          <AdminIcon name="phoneCheck" size={16} />
          Client joint
        </button>
        <button type="button" disabled={pending} onClick={() => log("no_answer")} className={cn(buttonClass("secondary", "custom"), "h-11 whitespace-nowrap px-2 text-sm")}>
          <AdminIcon name="phoneOff" size={16} />
          Pas de réponse
        </button>
      </div>
      {error ? (
        <div className="mt-2">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}

const QUICK_NOTES = ["Client prévenu", "Clés récupérées", "Attente sur place", "Code portail noté"];

export function JournalNoteForm({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (message: string) =>
    startTransition(async () => {
      setError(null);
      const result = await addJournalNoteAction({ id, message });
      if (result.ok) {
        setText("");
        router.refresh();
      } else setError(result.message);
    });
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (text.trim().length >= 2) submit(text.trim());
      }}
      className="grid grid-cols-[minmax(0,1fr)] gap-2"
    >
      <label htmlFor={`note-${id}`} className="text-sm font-bold text-asphalt-500">
        Ajouter au journal
      </label>
      <div className="flex gap-2">
        <input
          id={`note-${id}`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={1000}
          placeholder="Ex. Client rappelé, arrive dans le parking"
          className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-asphalt-200 bg-white px-4 font-semibold outline-none placeholder:font-normal placeholder:text-asphalt-400 focus:border-asphalt-900"
        />
        <button type="submit" disabled={pending || text.trim().length < 2} className={cn(buttonClass("dark", "custom"), "h-12 shrink-0 px-4 text-base")}>
          Noter
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_NOTES.map((quick) => (
          <button key={quick} type="button" disabled={pending} onClick={() => submit(quick)} className="rounded-full bg-asphalt-100 px-3 py-1.5 text-xs font-bold text-asphalt-700 hover:bg-asphalt-200">
            + {quick}
          </button>
        ))}
      </div>
      {error ? <Alert tone="danger">{error}</Alert> : null}
    </form>
  );
}

/** Imprimer (ou enregistrer en PDF) et partager le bon d'intervention. */
export function PrintShareBar({ title, text }: { title: string; text: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    setMessage((await copyText(text)) ? "Bon copié : collez-le dans un message." : "Copie impossible sur cet appareil.");
  };
  return (
    <div className="grid grid-cols-2 gap-2 print:hidden">
      <button type="button" onClick={() => window.print()} className={cn(buttonClass("primary", "custom"), "h-14 px-5 text-base")}>
        <AdminIcon name="printer" size={20} />
        Imprimer
      </button>
      <button type="button" onClick={share} className={cn(buttonClass("dark", "custom"), "h-14 px-5 text-base")}>
        <AdminIcon name="share" size={20} />
        Partager
      </button>
      <p className="col-span-2 text-center text-sm text-asphalt-500">« Imprimer » permet aussi d&apos;enregistrer le bon en PDF.</p>
      <Toast message={message} onClose={() => setMessage(null)} />
    </div>
  );
}

/**
 * « Envoyer le lien de suivi » : crée un lien personnel (le client y voit l'avancement en direct)
 * puis propose WhatsApp, SMS ou copie, avec un message déjà écrit. Utile pour une demande saisie
 * au téléphone, ou si le client a perdu son lien.
 */
export function TrackingLinkPanel({ id, phoneE164, context }: { id: string; phoneE164: string | null; context: MessageContext }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const create = () =>
    startTransition(async () => {
      setError(null);
      const result = await createTrackingLinkAction({ id });
      if (result.ok) {
        setUrl(`${window.location.origin}${result.path}`);
        router.refresh();
      } else setError(result.message);
    });
  const message = url ? trackingMessage(context, url) : "";
  return (
    <div>
      {!url ? (
        <button type="button" disabled={pending} onClick={create} className={cn(buttonClass("secondary", "custom"), "h-12 w-full px-3 text-base")}>
          {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" /> : <Icon name="route" size={18} />}
          Envoyer le lien de suivi
        </button>
      ) : (
        <div className="grid gap-2 rounded-2xl bg-signal-100 p-3">
          <p className="text-sm font-bold">Lien prêt : le client y voit l&apos;avancement en direct.</p>
          <input readOnly value={url} onFocus={(event) => event.currentTarget.select()} aria-label="Lien de suivi" className="h-11 min-w-0 rounded-xl border border-asphalt-200 bg-white px-3 text-sm font-semibold" />
          <div className="grid grid-cols-2 gap-2">
            {phoneE164 ? (
              <a href={whatsappHref(phoneE164, message)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-whatsapp text-sm font-extrabold text-asphalt-950 hover:brightness-95">
                <WhatsAppIcon size={16} />
                WhatsApp
              </a>
            ) : null}
            {phoneE164 ? (
              <a href={smsHref(phoneE164, message)} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-asphalt-900 text-sm font-extrabold text-chalk hover:bg-asphalt-800">
                <AdminIcon name="message" size={16} />
                SMS
              </a>
            ) : null}
            <CopyButton text={message} label="Copier le message" className="col-span-2 h-11 rounded-xl bg-white" />
          </div>
        </div>
      )}
      {error ? (
        <div className="mt-2">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}
    </div>
  );
}
