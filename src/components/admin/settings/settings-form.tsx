"use client";

/**
 * Formulaire d'une section de « Paramètres », généré à partir du registre des réglages.
 * Rien n'est enregistré avant la confirmation, qui récapitule chaque changement.
 */
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SETTINGS, type SettingDef, type SettingKey } from "@/core/settings/registry";
import { displaySettingValue, softLimitWarning } from "@/core/settings/validation";
import { saveSettingsAction } from "@/app/admin/(espace)/parametres/actions";
import { Modal, Toast, Toggle } from "@/components/admin/inputs";
import { SettingField } from "@/components/admin/pricing/fields";
import { Alert, Badge, buttonClass } from "@/components/admin/ui";
import { Icon } from "@/components/ui/icon";

export function SettingsForm({ section, keys, initial }: { section: string; keys: SettingKey[]; initial: Record<string, unknown> }) {
  const router = useRouter();
  const [base, setBase] = useState(initial);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pending, startTransition] = useTransition();

  const simple = keys.filter((key) => SETTINGS[key].level === "simple");
  const advanced = keys.filter((key) => SETTINGS[key].level === "advanced");
  const changes = useMemo(
    () =>
      keys
        .filter((key) => JSON.stringify(values[key]) !== JSON.stringify(base[key]))
        .map((key) => ({ key, label: SETTINGS[key].label, before: displaySettingValue(key, base[key]), after: displaySettingValue(key, values[key]) })),
    [keys, values, base],
  );
  const warnings = changes.map((change) => softLimitWarning(change.key, values[change.key])).filter((w): w is string => w !== null);

  const save = () => {
    setMessage(null);
    const payload = Object.fromEntries(changes.map((change) => [change.key, values[change.key]]));
    startTransition(async () => {
      const result = await saveSettingsAction({ section, values: payload });
      if (result.ok) {
        setBase(values);
        setErrors({});
        setConfirmOpen(false);
        setToast(result.changeCount > 0 ? "Paramètres enregistrés. Le site est à jour." : "Aucun changement.");
        router.refresh();
      } else {
        setErrors(result.errors);
        setMessage(result.message);
        setConfirmOpen(false);
      }
    });
  };

  const field = (key: SettingKey) => {
    const def = SETTINGS[key] as SettingDef;
    const empty = typeof values[key] === "string" && (values[key] as string).trim() === "";
    const badge = "toComplete" in def && def.toComplete && empty ? <Badge tone="warn">À compléter</Badge> : null;
    return (
      <SettingField
        key={key}
        settingKey={key}
        value={values[key]}
        onChange={(value) => setValues((current) => ({ ...current, [key]: value }))}
        error={errors[key]}
        badge={badge}
      />
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 pb-28">
      {message ? <Alert tone="danger">{message}</Alert> : null}
      {simple.map(field)}
      {advanced.length > 0 ? (
        <>
          <label className="mt-2 flex items-center justify-between gap-4 rounded-3xl border border-dashed border-asphalt-300 bg-white px-5 py-4">
            <span>
              <span className="block font-extrabold">Afficher les réglages avancés</span>
              <span className="block text-sm text-asphalt-500">{advanced.length} réglage(s) supplémentaire(s). Rarement utiles.</span>
            </span>
            <Toggle checked={showAdvanced} onChange={setShowAdvanced} label="Afficher les réglages avancés" />
          </label>
          {showAdvanced ? advanced.map(field) : null}
        </>
      ) : null}

      {changes.length > 0 ? (
        <div className="fixed inset-x-3 bottom-[5.25rem] z-[60] mx-auto flex max-w-3xl items-center gap-3 rounded-3xl bg-asphalt-900 p-3 pl-5 text-chalk shadow-2xl animate-fade-up lg:bottom-6 lg:left-[300px]">
          <p className="flex-1 font-bold">
            {changes.length} modification{changes.length > 1 ? "s" : ""} non enregistrée{changes.length > 1 ? "s" : ""}
          </p>
          <button type="button" onClick={() => setValues(base)} className="h-12 rounded-2xl px-4 font-bold text-asphalt-200 hover:bg-white/10">
            Annuler
          </button>
          <button type="button" onClick={() => setConfirmOpen(true)} disabled={pending} className={buttonClass("primary")}>
            Enregistrer
          </button>
        </div>
      ) : null}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Vérifier les modifications"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={buttonClass("secondary")} onClick={() => setConfirmOpen(false)}>
              Revenir
            </button>
            <button type="button" className={buttonClass("primary")} disabled={pending} onClick={save}>
              <Icon name="check" size={18} />
              Confirmer et enregistrer
            </button>
          </div>
        }
      >
        <ul className="divide-y divide-asphalt-100 rounded-2xl border border-asphalt-200">
          {changes.map((change) => (
            <li key={change.key} className="px-4 py-3">
              <p className="font-bold">{change.label}</p>
              <p className="mt-0.5 break-words text-sm text-asphalt-600">
                <span className="line-through decoration-asphalt-300">{change.before}</span>
                <Icon name="arrowRight" size={13} className="mx-1.5 inline text-asphalt-400" />
                <strong className="text-asphalt-900">{change.after}</strong>
              </p>
            </li>
          ))}
        </ul>
        {warnings.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {warnings.map((warning) => (
              <Alert key={warning} tone="warn">
                {warning}
              </Alert>
            ))}
          </div>
        ) : null}
      </Modal>
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
