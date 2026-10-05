import { describe, expect, it } from "vitest";
import { pathEnd } from "@/components/scenes/kit/svg-path";
import type { PublicSiteInfo } from "@/server/site/public-info";
import { chooseParking, parkingLeg } from "./route-parking";

const depot = { x: 300, y: 300 };
const depotInfo: PublicSiteInfo["depot"] = { label: "Dépôt", city: "Bobigny", lat: 48.9086, lng: 2.4397 };

describe("place de stationnement au bout du retour", () => {
  it("prolonge le sens de la marche quand toutes les places sont libres", () => {
    expect(chooseParking(depot, { x: 100, y: 300 }, [], "above")).toBe("east");
    expect(chooseParking(depot, { x: 500, y: 300 }, [], "above")).toBe("west");
    expect(chooseParking(depot, { x: 300, y: 100 }, [], "above")).toBe("south");
  });

  it("ne se gare jamais du côté du nom du dépôt (cap vertical)", () => {
    // Arrivée par le bas, nom au-dessus : pas vers le nord.
    expect(chooseParking(depot, { x: 300, y: 500 }, [], "above")).not.toBe("north");
    expect(chooseParking(depot, { x: 300, y: 100 }, [], "below")).not.toBe("south");
  });

  it("évite une commune posée sur la place préférée", () => {
    const bondy = { x0: 330, x1: 400, y0: 290, y1: 310 };
    expect(chooseParking(depot, { x: 100, y: 300 }, [bondy], "above")).not.toBe("east");
  });

  it("le retour finit à côté du losange, hors du nom, dans l'axe de la place", () => {
    const d = parkingLeg({ x: 120, y: 420 }, depot, 0.22, { variant: "depot", depotInfo, marks: [] });
    const end = pathEnd(d);
    const offset = Math.hypot(end.x - depot.x, end.y - depot.y);
    expect(offset).toBeGreaterThan(40);
    // Cap horizontal ou vertical (0, 90, 180 ou 270 degrés).
    expect(Math.round(((end.angle % 90) + 90) % 90)).toBe(0);
    // Garée à droite ou à gauche : à hauteur du losange, entre les deux places possibles du nom.
    if (Math.abs(end.x - depot.x) > 1) expect(Math.abs(end.y - depot.y)).toBeLessThan(1);
    // Garée en dessous ou au-dessus : le nom (dessous par défaut, sans épingle) est de l'autre côté.
    else expect(end.y).toBeLessThan(depot.y);
  });
});
