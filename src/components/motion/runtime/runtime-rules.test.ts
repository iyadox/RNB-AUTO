import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DetourView } from "@/components/pages/errors/detour-view";
import { CALM_MARKER, CALM_ROUTES, NO_HALO_ROUTES, isCalmRoute, isNoHaloRoute } from "@/content/site-map";
import { ambientEffects, readCalmMarker } from "./calm";
import { prepareSplitText } from "./helpers";
import { canReachRetroLine } from "./observers";

describe("routes calmes et routes sans halo (C.6)", () => {
  it("coupe Lenis et halo sur les routes calmes et leurs sous-routes", () => {
    for (const route of CALM_ROUTES) {
      expect(isCalmRoute(route)).toBe(true);
      expect(isCalmRoute(`${route}/suite`)).toBe(true);
      expect(isNoHaloRoute(route)).toBe(true);
    }
  });
  it("/panne-autoroute : Lenis seulement, sans halo", () => {
    expect(NO_HALO_ROUTES).toContain("/panne-autoroute");
    expect(isCalmRoute("/panne-autoroute")).toBe(false);
    expect(isNoHaloRoute("/panne-autoroute")).toBe(true);
  });
  it("garde le halo ailleurs, sans confondre deux routes au même début", () => {
    for (const route of ["/", "/depannage", "/remorquage", "/zones-d-intervention", "/questions-frequentes", "/entreprise"]) {
      expect(isNoHaloRoute(route)).toBe(false);
    }
    expect(isCalmRoute("/demandes-speciales")).toBe(false);
    expect(isNoHaloRoute("/panne-autoroute-a86")).toBe(false);
  });
});

describe("pages marquées calmes (404, erreur) : ni Lenis ni halo (L9-F1-2)", () => {
  /** Document réduit au marqueur : `querySelector` renvoie l'élément marqué, ou rien. */
  const rootWith = (value: string | null) => ({
    querySelector: () => (value === null ? null : { getAttribute: (name: string) => (name === CALM_MARKER ? value : null) }),
  });
  const desktopFull = { desktop: true, level: "full" as const };

  it("la vue partagée par la 404 et la page d'erreur porte le marqueur complet", () => {
    for (const variant of ["notfound", "error"] as const) {
      const html = renderToStaticMarkup(createElement(DetourView, { variant, pictogram: "road", title: "Titre", lead: "Texte", actions: null }));
      expect(html, variant).toContain(`${CALM_MARKER}="full"`);
    }
  });
  it("lit le marqueur : vide ou « full » = page calme complète, « halo » = sans halo", () => {
    expect(readCalmMarker(rootWith(null) as never)).toBeNull();
    expect(readCalmMarker(rootWith("") as never)).toBe("full");
    expect(readCalmMarker(rootWith("full") as never)).toBe("full");
    expect(readCalmMarker(rootWith("halo") as never)).toBe("halo");
  });
  it("une page marquée coupe Lenis et le halo, même à une adresse ordinaire", () => {
    expect(ambientEffects({ ...desktopFull, pathname: "/route-inconnue", marker: "full" })).toEqual({ halo: false, lenis: false });
    expect(ambientEffects({ ...desktopFull, pathname: "/depannage", marker: "full" })).toEqual({ halo: false, lenis: false });
    expect(ambientEffects({ ...desktopFull, pathname: "/depannage", marker: "halo" })).toEqual({ halo: false, lenis: true });
    expect(ambientEffects({ ...desktopFull, pathname: "/depannage", marker: null })).toEqual({ halo: true, lenis: true });
  });
  it("routes : calmes sans rien, /panne-autoroute avec Lenis seulement ; jamais au doigt ni en lite", () => {
    expect(ambientEffects({ ...desktopFull, pathname: "/demande", marker: null })).toEqual({ halo: false, lenis: false });
    expect(ambientEffects({ ...desktopFull, pathname: "/panne-autoroute", marker: null })).toEqual({ halo: false, lenis: true });
    expect(ambientEffects({ desktop: false, level: "full", pathname: "/", marker: null })).toEqual({ halo: false, lenis: false });
    expect(ambientEffects({ desktop: true, level: "lite", pathname: "/", marker: null })).toEqual({ halo: false, lenis: false });
  });
});

describe("reflet des plaques (P6) : le haut de la plaque franchira-t-il les 65 % de l'écran ?", () => {
  const vh = 800;
  it("oui, pour une plaque au milieu d'une longue page", () => {
    expect(canReachRetroLine(2000, vh, 6000)).toBe(true);
  });
  it("oui (tout de suite), pour une plaque en haut de page, même immobile", () => {
    expect(canReachRetroLine(300, vh, 0)).toBe(true);
    expect(canReachRetroLine(40, vh, 2000)).toBe(true);
  });
  it("non, pour une plaque tout en bas, que le défilement n'amène jamais au milieu (repli : à l'entrée)", () => {
    expect(canReachRetroLine(2700, vh, 2000)).toBe(false);
    expect(canReachRetroLine(700, vh, 0)).toBe(false);
  });
});

describe("découpage des titres (P5)", () => {
  it("garde l'espace insécable avant une ponctuation haute", () => {
    expect(prepareSplitText("Transportons-nous ?")).toBe("Transportons-nous ?");
  });
  it("colle à son mot une ponctuation haute précédée d'une espace simple", () => {
    expect(prepareSplitText("Où en êtes-vous ?")).toBe("Où en êtes-vous ?");
    expect(prepareSplitText("Attention : danger !")).toBe("Attention : danger !");
    expect(prepareSplitText("« Route »")).toBe("« Route »");
  });
  it("regroupe les blancs ordinaires", () => {
    expect(prepareSplitText("  Le prix\n   avant le départ. ")).toBe(" Le prix avant le départ. ");
  });
});
