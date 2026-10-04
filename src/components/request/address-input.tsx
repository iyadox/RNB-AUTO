"use client";

/**
 * Champ d'adresse avec suggestions (service d'adresses du serveur) et, en option,
 * bouton « Utiliser ma position ». Si la personne ne choisit pas de suggestion,
 * le texte saisi est gardé et le serveur cherchera l'adresse lui-même.
 */
import { useEffect, useId, useRef, useState } from "react";
import type { GeoPoint, Place } from "@/core/quotes/types";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/icon";

type Suggestion = { label: string; lat: number; lng: number; postcode: string | null; city: string | null };

export function AddressInput({
  value,
  onChange,
  placeholder,
  near,
  autoFocus,
  tone = "dark",
  label,
}: {
  value: Place | null;
  onChange: (place: Place | null) => void;
  placeholder: string;
  near?: GeoPoint | null;
  autoFocus?: boolean;
  tone?: "dark" | "light";
  label: string;
}) {
  const [text, setText] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const listId = useId();
  const abortRef = useRef<AbortController | null>(null);
  const skipNextFetch = useRef(false);

  // Adresse fixée de l'extérieur (position du téléphone, reprise d'une saisie) : on l'affiche.
  // Quand la personne modifie le texte, l'adresse choisie est oubliée mais son texte reste.
  const valueLabel = value?.label ?? null;
  const [syncedLabel, setSyncedLabel] = useState(valueLabel);
  if (valueLabel !== syncedLabel) {
    setSyncedLabel(valueLabel);
    if (valueLabel !== null) setText(valueLabel);
  }

  const query = text.trim();
  const searchable = query.length >= 3 && !(value && value.label === text && value.lat !== null);
  const visible = searchable ? suggestions : [];

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    if (!searchable) return;
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (near) {
          params.set("lat", near.lat.toFixed(4));
          params.set("lng", near.lng.toFixed(4));
        }
        const response = await fetch(`/api/adresses?${params}`, { signal: controller.signal });
        const data = (await response.json()) as { results?: Suggestion[] };
        setSuggestions(data.results ?? []);
        setOpen(true);
        setActive(-1);
      } catch {
        // Recherche interrompue ou service indisponible : la saisie libre reste possible.
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, near, searchable]);

  const choose = (suggestion: Suggestion) => {
    skipNextFetch.current = true;
    setText(suggestion.label);
    setSuggestions([]);
    setOpen(false);
    onChange({ ...suggestion, source: "search" });
  };

  const commitTyped = () => {
    const trimmed = text.trim();
    if (trimmed.length < 3) {
      if (!trimmed) onChange(null);
      return;
    }
    if (!value || value.label !== trimmed) {
      onChange({ label: trimmed, lat: null, lng: null, postcode: null, city: null, source: "typed" });
    }
  };

  const dark = tone === "dark";
  return (
    <div className="relative">
      <label className="sr-only" htmlFor={`${listId}-input`}>
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 px-4 transition-colors focus-within:border-signal-500",
          dark ? "border-white/15 bg-asphalt-850" : "border-asphalt-200 bg-white",
        )}
      >
        <Icon name="pin" size={22} className={dark ? "shrink-0 text-signal-500" : "shrink-0 text-asphalt-500"} />
        <input
          id={`${listId}-input`}
          type="text"
          inputMode="search"
          autoComplete="street-address"
          enterKeyHint="search"
          role="combobox"
          aria-expanded={open && visible.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoFocus={autoFocus}
          value={text}
          placeholder={placeholder}
          onChange={(event) => {
            setText(event.target.value);
            if (value && value.label !== event.target.value) onChange(null);
          }}
          onFocus={() => visible.length > 0 && setOpen(true)}
          onBlur={() => window.setTimeout(() => {
            setOpen(false);
            commitTyped();
          }, 150)}
          onKeyDown={(event) => {
            if (!open || visible.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(visible.length - 1, index + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(0, index - 1));
            } else if (event.key === "Enter" && active >= 0) {
              event.preventDefault();
              const suggestion = visible[active];
              if (suggestion) choose(suggestion);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          className={cn(
            "h-16 w-full min-w-0 bg-transparent text-lg font-semibold outline-none",
            dark ? "text-chalk placeholder:text-asphalt-400" : "text-asphalt-950 placeholder:text-asphalt-400",
          )}
        />
        {loading ? (
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" aria-hidden="true" />
        ) : text ? (
          <button
            type="button"
            onClick={() => {
              setText("");
              setSuggestions([]);
              onChange(null);
            }}
            className={cn("shrink-0 rounded-full p-1.5", dark ? "text-asphalt-300 hover:bg-white/10" : "text-asphalt-500 hover:bg-asphalt-100")}
            aria-label="Effacer l'adresse"
          >
            <Icon name="x" size={18} />
          </button>
        ) : null}
      </div>
      {open && visible.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className={cn(
            "absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border shadow-2xl",
            dark ? "border-white/10 bg-asphalt-850" : "border-asphalt-200 bg-white",
          )}
        >
          {visible.map((suggestion, index) => (
            <li
              key={`${suggestion.label}-${index}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(suggestion);
              }}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-3 px-4 py-3 text-base font-semibold",
                index === active ? (dark ? "bg-white/10" : "bg-asphalt-100") : "",
                dark ? "text-chalk hover:bg-white/5" : "text-asphalt-900 hover:bg-asphalt-50",
              )}
            >
              <Icon name="pin" size={18} className="shrink-0 text-signal-500" />
              <span>{suggestion.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Position du téléphone → adresse (avec l'accord de la personne). */
export function useGeolocation() {
  const [state, setState] = useState<{ status: "idle" | "locating" | "error"; message?: string }>({ status: "idle" });

  const locate = async (): Promise<Place | null> => {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", message: "Votre téléphone ne permet pas la localisation : tapez l'adresse." });
      return null;
    }
    setState({ status: "locating" });
    const position = await new Promise<GeolocationPosition | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(resolve, (error) => {
        setState({
          status: "error",
          message:
            error.code === error.PERMISSION_DENIED
              ? "Position refusée. Tapez l'adresse, ou autorisez la localisation dans les réglages du téléphone."
              : "Position introuvable pour le moment. Tapez l'adresse.",
        });
        resolve(null);
      }, { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 });
    });
    if (!position) return null;
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    let place: Place = { label: `Ma position (${lat.toFixed(5)}, ${lng.toFixed(5)})`, lat, lng, postcode: null, city: null, source: "gps" };
    try {
      const response = await fetch(`/api/adresses/inverse?lat=${lat}&lng=${lng}`);
      const data = (await response.json()) as { result: { label: string; postcode: string | null; city: string | null } | null };
      if (data.result) place = { ...place, label: data.result.label, postcode: data.result.postcode, city: data.result.city };
    } catch {
      // Sans adresse lisible, la position GPS suffit pour calculer le trajet.
    }
    setState({ status: "idle" });
    return place;
  };

  return { state, locate };
}
