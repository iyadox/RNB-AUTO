/** Appels HTTP vers les services externes : délai maximal, identification, erreurs claires. */
import { siteUrl } from "@/core/site-url";
import { ProviderError } from "./types";

export const USER_AGENT = `RNB-AUTO/1.0 (+${siteUrl()})`;

export async function fetchJson<T>(
  provider: string,
  url: string,
  init: RequestInit & { signal: AbortSignal },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { Accept: "application/json", "User-Agent": USER_AGENT, ...(init.headers ?? {}) },
      cache: "no-store",
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "délai dépassé" : "service injoignable";
    throw new ProviderError(provider, reason);
  }
  if (!response.ok) throw new ProviderError(provider, `réponse ${response.status}`);
  try {
    return (await response.json()) as T;
  } catch {
    throw new ProviderError(provider, "réponse illisible");
  }
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
