"use client";

/** Liste de choix qui applique le filtre dès qu'on la change (le bouton du formulaire suffit sans JavaScript). */
export function AutoSubmitSelect({ name, label, value, options }: { name: string; label: string; value: string; options: readonly { slug: string; label: string }[] }) {
  return (
    <label className="relative grid min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-[3.25rem] w-full min-w-0 appearance-none truncate rounded-2xl border-2 border-asphalt-200 bg-white pl-4 pr-9 text-sm font-bold text-asphalt-900 outline-none focus:border-asphalt-900"
      >
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.label}
          </option>
        ))}
      </select>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-asphalt-500" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
