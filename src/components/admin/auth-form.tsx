"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/admin/auth-actions";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

type FieldDef = { name: string; label: string; type: string; autoComplete?: string; placeholder?: string; hint?: string };

export function AuthForm({
  action,
  fields,
  submitLabel,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: FieldDef[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-5">
      {state?.error ? (
        <div role="alert" className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900">
          <Icon name="alert" size={22} className="shrink-0" />
          <p className="font-semibold">{state.error}</p>
        </div>
      ) : null}
      {fields.map((field) => (
        <label key={field.name} className="block">
          <span className="text-base font-bold">{field.label}</span>
          {field.hint ? <span className="mt-0.5 block text-sm text-asphalt-500">{field.hint}</span> : null}
          <input
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            required
            className={cn(
              "mt-2 h-14 w-full rounded-2xl border-2 border-asphalt-200 bg-white px-4 text-lg font-semibold outline-none focus:border-asphalt-900",
              state?.fieldErrors?.[field.name] && "border-red-500",
            )}
          />
          {state?.fieldErrors?.[field.name] ? <span className="mt-1 block text-sm font-semibold text-red-700">{state.fieldErrors[field.name]}</span> : null}
        </label>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-asphalt-900 text-lg font-extrabold text-chalk transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-chalk border-t-transparent" /> : null}
        {submitLabel}
      </button>
    </form>
  );
}
