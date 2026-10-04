import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { planPoint } from "./plan-geometry";
import { PlanIdf } from "./plan-idf";
import { layoutPlanLabels, overlaps, type Box } from "./plan-labels";

const DEPOT = { label: "Dépôt", city: "Bobigny", lat: 48.9077, lng: 2.4397 };

/** Communes affichées (nom → classes) dans le rendu serveur. */
const shownLabels = (html: string) =>
  new Map([...html.matchAll(/<text class="([^"]*cityLabel[^"]*)"[^>]*>([^<]+)</g)].map((m) => [m[2]!, m[1]!]));

describe("Plan RNB : placement des noms", () => {
  it("disque régional, tous les noms : chacun tient sans se toucher (aucun masqué)", () => {
    const labels = shownLabels(renderToStaticMarkup(h(PlanIdf, { depot: DEPOT, labels: "all" })));
    for (const name of ["Pantin", "Bondy", "Montreuil", "Noisy-le-Grand", "Aulnay-sous-Bois", "Argenteuil", "Saint-Denis"]) {
      expect(labels.get(name), name).toBeDefined();
      expect(labels.get(name), name).not.toMatch(/HideMid/);
    }
  });

  it("plan du dépôt étroit (/contact) : un nom qui toucherait « BOBIGNY » est masqué", () => {
    const labels = shownLabels(renderToStaticMarkup(h(PlanIdf, { depot: DEPOT, variant: "depot", static: true })));
    expect(labels.get("Pantin")).toMatch(/HideNarrow/);
  });

  it("« Vous » près du dépôt : l'étiquette quitte le nom du dépôt, rien ne se chevauche", () => {
    // Prise en charge juste au sud du dépôt : l'étiquette « Vous » tomberait sur « BOBIGNY ».
    for (const variant of ["depot", "region"] as const) {
      for (const offset of [0.004, 0.008, 0.012]) {
        const you = { lat: DEPOT.lat - offset, lng: DEPOT.lng + 0.001 };
        const p = planPoint(you.lat, you.lng, variant, DEPOT);
        const d = planPoint(DEPOT.lat, DEPOT.lng, variant, DEPOT);
        const layout = layoutPlanLabels({ region: variant === "region", depot: { p: d, name: DEPOT.city }, points: [{ kind: "vous", p }], cities: [] });
        const spot = layout.pointLabels[0]!;
        // Boîtes à l'échelle 1,4 (plan étroit, /demande) : nom du dépôt et étiquette « Vous ».
        const k = 1.4;
        const nameY = layout.depotName === "below" ? 31 : -22;
        const name: Box = { x0: d.x - 50 * k, x1: d.x + 50 * k, y0: d.y + (nameY - 11) * k, y1: d.y + (nameY + 3) * k };
        const vx = spot.anchor === "middle" ? p.x + (spot.x - 18) * k : spot.anchor === "start" ? p.x + spot.x * k : p.x + (spot.x - 36) * k;
        const vous: Box = { x0: vx, x1: vx + 36 * k, y0: p.y + (spot.y - 10) * k, y1: p.y + (spot.y + 3) * k };
        expect(overlaps(name, vous), `${variant} ${offset}`).toBe(false);
      }
    }
  });

  it("repère data-plan-point sur l'épingle et le drapeau", () => {
    const html = renderToStaticMarkup(
      h(PlanIdf, { depot: DEPOT, variant: "depot", points: [{ kind: "vous", lat: 48.89, lng: 2.42 }, { kind: "destination", lat: 48.87, lng: 2.44 }] }),
    );
    expect(html).toContain('data-plan-point="vous"');
    expect(html).toContain('data-plan-point="destination"');
  });
});
