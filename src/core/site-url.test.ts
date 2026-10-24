import { describe, expect, it } from "vitest";
import { resolveSiteUrl } from "./site-url";

describe("adresse publique du site", () => {
  it("prend NEXT_PUBLIC_SITE_URL en priorité, sans barre finale", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: " https://www.rnb-auto.fr/ ", URL: "https://rnb-auto.netlify.app" })).toBe("https://www.rnb-auto.fr");
  });

  it("se replie sur l'adresse Netlify quand NEXT_PUBLIC_SITE_URL manque", () => {
    expect(resolveSiteUrl({ URL: "https://rnb-auto.netlify.app" })).toBe("https://rnb-auto.netlify.app");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "", URL: "https://rnb-auto.netlify.app/" })).toBe("https://rnb-auto.netlify.app");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "   ", URL: "https://rnb-auto.netlify.app" })).toBe("https://rnb-auto.netlify.app");
  });

  it("garde le repli Vercel (adresse sans https://)", () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "rnb-auto.vercel.app" })).toBe("https://rnb-auto.vercel.app");
    expect(resolveSiteUrl({ VERCEL_URL: "rnb-auto-abc.vercel.app" })).toBe("https://rnb-auto-abc.vercel.app");
  });

  it("corrige une adresse écrite sans https://", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "rnb-auto.fr" })).toBe("https://rnb-auto.fr");
  });

  it("ignore une valeur inutilisable au lieu de casser le site", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "ftp://rnb-auto.fr", URL: "https://rnb-auto.netlify.app" })).toBe("https://rnb-auto.netlify.app");
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://", URL: "https://rnb-auto.netlify.app" })).toBe("https://rnb-auto.netlify.app");
  });

  it("vaut l'adresse locale sans aucune variable", () => {
    expect(resolveSiteUrl({})).toBe("http://localhost:3000");
  });
});
