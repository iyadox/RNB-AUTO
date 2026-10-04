/**
 * Recette du kit d'illustrations (docs/09, G.2 et L9) : rendu serveur des composants, budget de
 * nœuds, contrats lus par les pages et le runtime. Rendu en chaîne HTML (aucun navigateur).
 */
import { createElement as h, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TowTruck } from "@/components/brand/tow-truck";
import { Depot } from "@/components/scenes/base/depot";
import { CarSide } from "./car-side";
import { DirectionSign } from "./direction-sign";
import { EstimateTicket } from "./estimate-ticket";
import { HighwayRelay } from "./highway-relay";
import { InfoPlaque } from "./info-plaque";
import { CITIES } from "./plan-idf/geo";
import { estimateLabelWidth, PLAN_SIZE } from "./plan-idf/plan-geometry";
import { PlanIdf } from "./plan-idf/plan-idf";
import { CarTopGlyph, TruckTopGlyph } from "./glyphs";
import { RoutePaths } from "./route-paths";
import { Voyant } from "./voyant";

const render = (element: ReactElement) => renderToStaticMarkup(element);
/** Nombre d'éléments (balises ouvrantes) du balisage. */
const nodes = (html: string) => (html.match(/<[a-zA-Z]/g) ?? []).length;
const svg = (children: ReactElement) => h("svg", { viewBox: "0 0 600 600" }, children);

const DEPOT = { label: "Dépôt", city: "Bobigny", lat: null, lng: null };

describe("TowTruck", () => {
  it("reste sous son budget de nœuds", () => {
    expect(nodes(render(h(TowTruck, { id: "t" })))).toBeLessThanOrEqual(70);
    expect(nodes(render(h(TowTruck, { id: "t", loaded: true, headlights: true })))).toBeLessThanOrEqual(110);
  });

  it("charge la voiture du client (CarSide) et garde les repères lus par les scènes et la coque", () => {
    const html = render(h(TowTruck, { id: "t", loaded: true, cable: true, parts: true, headlights: true }));
    expect(html).toContain('data-part="car"');
    expect(html).toContain("M16 80L13 70Q12 60 17 53"); // caisse de CarSide
    expect(html).toContain('d="M232 64 L120 72"'); // sangle masquée par LoadingSequence
    expect(html).toContain('data-part="cable"');
    expect(html).toContain("data-wheel");
    expect(html).toContain("truck-body");
    // Gyrophare : barre, deux halos [data-glow], puis deux feux (rect:nth-of-type(n + 2)).
    const beacon = html.slice(html.indexOf('data-part="beacon"'));
    expect((beacon.match(/<rect/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("n'a aucun tracé invisible (opacité 0) quand la voiture n'est pas chargée", () => {
    expect(render(h(TowTruck, { id: "t" }))).not.toMatch(/\s(fill-|stroke-)?opacity="0"/);
  });
});

describe("CarSide", () => {
  it("capot ouvert : aucun tracé à opacité 0", () => {
    const html = render(h(CarSide, { id: "c", hazards: true, hoodOpen: true }));
    expect(html).not.toMatch(/\s(fill-|stroke-)?opacity="0"/);
  });

  it("feux de détresse : boucle du kit (classe hazard) et pause hors écran", () => {
    const html = render(h(CarSide, { id: "c", hazards: true }));
    expect(html).toContain('class="hazard');
    expect(html).toContain("data-pause-offscreen");
    expect(nodes(html)).toBeLessThanOrEqual(62);
  });
});

describe("RoutePaths", () => {
  it("une seule dépanneuse, dont l'allure suit le dernier tronçon", () => {
    const html = render(
      svg(
        h(RoutePaths, {
          legs: [
            { key: "a", style: "aller", d: "M0 0L100 0" },
            { key: "t", style: "transport", d: "M100 0L200 50" },
          ],
          mode: "view",
          truck: "top",
          idPrefix: "r",
        }),
      ),
    );
    expect((html.match(/data-route-truck/g) ?? []).length).toBe(1);
    // Un seul plateau (rect du plateau), une seule cabine.
    expect((html.match(/width="33.5"/g) ?? []).length).toBe(1);
    expect(html).toContain('data-draw-mask="r-maskpath-a"');
  });
});

describe("HighwayRelay", () => {
  it("auto : les deux schémas au rendu serveur (le CSS choisit sans JavaScript)", () => {
    const html = render(h(HighwayRelay, {}));
    expect(html).toContain('viewBox="0 0 960 300"');
    expect(html).toContain('viewBox="0 0 360 600"');
  });

  it("orientation fixe : un seul schéma ; l'étiquette verticale est sur deux lignes", () => {
    const vertical = render(h(HighwayRelay, { orientation: "vertical" }));
    expect(vertical).not.toContain('viewBox="0 0 960 300"');
    expect(vertical).toMatch(/DÉPANNEUR<tspan[^>]*>AGRÉÉ<\/tspan>/);
    expect(render(h(HighwayRelay, { orientation: "horizontal" }))).not.toContain('viewBox="0 0 360 600"');
  });
});

describe("PlanIdf", () => {
  it("static : aucune apparition, aucune boucle", () => {
    const html = render(h(PlanIdf, { depot: DEPOT, sweep: true, static: true }));
    expect(html).not.toContain("data-inview-once");
    expect(html).not.toContain("data-pause-offscreen");
    expect(html).not.toContain("pulse-ring");
  });

  it("underlay est dessiné sous les communes et le dépôt ; children au-dessus", () => {
    const html = render(
      h(PlanIdf, { depot: DEPOT, underlay: h("g", { id: "dessous" }) }, h("g", { id: "dessus" })),
    );
    const under = html.indexOf('id="dessous"');
    expect(under).toBeGreaterThan(0);
    expect(under).toBeLessThan(html.indexOf("Paris"));
    expect(html.indexOf('id="dessus"')).toBeGreaterThan(html.indexOf("BOBIGNY"));
  });

  it("detail low : moins de nœuds", () => {
    const full = nodes(render(h(PlanIdf, { depot: DEPOT })));
    const low = nodes(render(h(PlanIdf, { depot: DEPOT, detail: "low" })));
    expect(low).toBeLessThan(full);
  });

  it("aucun nom de commune hors du cadre à la taille normale", () => {
    for (const variant of ["region", "depot"] as const) {
      const html = render(h(PlanIdf, { depot: DEPOT, variant, labels: "all" }));
      for (const match of html.matchAll(/<text[^>]*x="([\d.-]+)"[^>]*text-anchor="(\w+)"[^>]*font-size="([\d.]+)"[^>]*font-weight="(\d+)"[^>]*>([^<]+)</g)) {
        const [, x, anchor, size, weight, name] = match;
        if (!CITIES.some((city) => city.name === name)) continue;
        const width = estimateLabelWidth(name!, Number(size), weight === "800");
        const left = anchor === "start" ? Number(x) : anchor === "end" ? Number(x) - width : Number(x) - width / 2;
        expect(left, `${variant} ${name}`).toBeGreaterThanOrEqual(0);
        expect(left + width, `${variant} ${name}`).toBeLessThanOrEqual(PLAN_SIZE);
      }
    }
  });
});

describe("Depot", () => {
  it("rideau ciblable par attribut, jaune par jeton (currentColor)", () => {
    const html = render(h(Depot, { animate: "open" }));
    expect(html).toContain("data-depot-shutter");
    expect(html).toMatch(/<g clip-path="url\([^)]+\)"><g[^>]*data-depot-shutter/);
    expect(html).not.toContain("#ffc400");
  });
});

describe("Finitions", () => {
  it("DirectionSign : largeur du plus long mot transmise au CSS (--sign-fit)", () => {
    const fit = (title: string) => Number(/--sign-fit:([\d.]+)/.exec(render(h(DirectionSign, { href: "/", title, arrow: "right", pictogram: "truck" })))?.[1]);
    expect(fit("Mon prix maintenant")).toBeGreaterThan(fit("Mon prix"));
    // « L'AUTOROUTE ? » reste un seul bloc insécable.
    expect(fit("Sur l'autoroute ?")).toBeGreaterThan(fit("l'autoroute"));
  });

  it("InfoPlaque inline : titre et texte regroupés à droite", () => {
    const html = render(h(InfoPlaque, { number: 1, title: "Titre", layout: "inline" }, "Texte"));
    expect(html).toMatch(/<div[^>]*><h3[^>]*>Titre<\/h3><div[^>]*>Texte<\/div><\/div>/);
  });

  it("EstimateTicket : lignes repliées sous le libellé fourni", () => {
    const html = render(h(EstimateTicket, { priceCents: 14000, lines: ["Remorquage", "Transport"], linesSummary: "Détail", odometer: "none" }));
    expect(html).toContain("<details");
    expect(html).toContain("Détail");
  });

  it("Voyant : taille par la prop en ligne, sinon laissée au CSS", () => {
    expect(render(h(Voyant, { glyph: "battery", label: "Batterie" }))).not.toContain("--voyant-size");
    expect(render(h(Voyant, { glyph: "battery", label: "Batterie", size: 40 }))).toContain("--voyant-size:40px");
  });

  it("EstimateTicket : unité jamais seule à la ligne (espace insécable), texte inchangé", () => {
    const html = render(h(EstimateTicket, { priceCents: 18750, lines: ["Distance jusqu'à vous : 6 km", "Transport : 10 km"], odometer: "none" }));
    expect(html).toContain("vous\u00a0: 6\u00a0km");
    expect(html).toContain("Transport\u00a0: 10\u00a0km");
  });
});

describe("Même voiture d'une scène à l'autre", () => {
  it("la voiture chargée de la dépanneuse vue de dessus a les teintes de CarTopGlyph", () => {
    const car = render(svg(h(CarTopGlyph)));
    const truck = render(svg(h(TruckTopGlyph, { loaded: true })));
    for (const colour of ["#3b4652", "#222a33", "#0f151c"]) {
      expect(car).toContain(colour);
      expect(truck).toContain(colour);
    }
    expect(truck).not.toContain("#4f6d8c");
  });
});
