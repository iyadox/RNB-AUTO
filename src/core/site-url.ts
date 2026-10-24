/**
 * Adresse publique du site (liens absolus, référencement, liens de suivi envoyés aux clients).
 *
 * Ordre de recherche :
 * 1. `NEXT_PUBLIC_SITE_URL` (réglée par l'administrateur, prioritaire partout) ;
 * 2. Vercel : `VERCEL_PROJECT_PRODUCTION_URL`, puis `VERCEL_URL` (sans « https:// ») ;
 * 3. Netlify : `URL`, l'adresse principale du site (« https://rnb-auto.netlify.app » ou le domaine
 *    personnalisé), fournie par Netlify à la construction comme à l'exécution ;
 * 4. à défaut, `http://localhost:3000` (poste de développement).
 *
 * Une valeur mal écrite (sans « https:// », avec une barre finale, des espaces) est corrigée ; une
 * valeur inutilisable est ignorée au lieu de casser toutes les pages (`new URL()` du layout).
 */
type Env = Record<string, string | undefined>;

/** « rnb-auto.fr/ » → « https://rnb-auto.fr » ; renvoie null si ce n'est pas une adresse web. */
function normalize(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname) return null;
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

export function resolveSiteUrl(env: Env): string {
  return (
    normalize(env.NEXT_PUBLIC_SITE_URL) ??
    normalize(env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalize(env.VERCEL_URL) ??
    // Netlify : adresse principale du site (jamais l'adresse d'un aperçu de déploiement).
    normalize(env.URL) ??
    "http://localhost:3000"
  );
}

export function siteUrl(): string {
  // `NEXT_PUBLIC_SITE_URL` est lue telle quelle pour que Next.js puisse l'inscrire au build.
  return resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    URL: process.env.URL,
  });
}
