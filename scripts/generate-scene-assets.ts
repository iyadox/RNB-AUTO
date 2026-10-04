/**
 * Générateur déterministe des décors statiques (docs/09, B.5 et H.1) :
 *   public/scenes/skyline-far.svg   horizon lointain (tours, barres, cheminées, grues)
 *   public/scenes/skyline-near.svg  horizon proche (pavillons, immeubles, entrepôts, château d'eau)
 *   public/textures/grain.png       grain de bitume, tuile de 128 px en niveaux de gris + transparence
 *
 * Commande : npx tsx scripts/generate-scene-assets.ts
 * Deux exécutions produisent des fichiers identiques octet pour octet (aucun hasard réel, aucune
 * date). Chaque horizon : une seule `path` pour les bâtiments, une seule pour les fenêtres.
 * Les deux bords se raccordent : les fichiers se répètent sans couture (`repeat-x`).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Générateur pseudo-aléatoire déterministe (repris de src/components/home/night-road.tsx). */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

type Rand = () => number;
const between = (rand: Rand, min: number, max: number) => Math.round(min + rand() * (max - min));

/** Rectangle posé au sol (ou à une hauteur `base`) en commandes relatives compactes. */
const rect = (x: number, top: number, w: number, h: number) => `M${x} ${top}h${w}v${h}h${-w}z`;

// ─── Horizon lointain : 1600 × 200 (rapport 8) ───────────────────────────────

export const FAR = { width: 1600, height: 200 } as const;

function skylineFar(): string {
  const { width: W, height: H } = FAR;
  const rand = seeded(7);
  const shapes: string[] = [];
  const windows: string[] = [];
  const cranes = [430, 1210];

  // Nappe basse continue (toits lointains), pour qu'aucun trou ne laisse voir le ciel au sol.
  let x = 0;
  while (x < W) {
    const w = Math.min(between(rand, 18, 46), W - x);
    shapes.push(rect(x, H - between(rand, 16, 34), w, H));
    x += w;
  }

  x = between(rand, 4, 20);
  while (x < W - 12) {
    const kind = rand();
    let w: number;
    let h: number;
    if (kind < 0.22) {
      // Tour d'habitation : haute, étroite, parfois une antenne ou un édicule.
      w = between(rand, 30, 52);
      h = between(rand, 112, 178);
      const extra = rand();
      if (extra < 0.4) shapes.push(rect(x + Math.round(w * 0.62), H - h - between(rand, 10, 24), 2, H));
      else if (extra < 0.75) shapes.push(rect(x + Math.round(w * 0.2), H - h - between(rand, 5, 9), Math.round(w * 0.38), H));
    } else if (kind < 0.47) {
      // Barre : longue et basse, parfois un gradin.
      w = between(rand, 90, 168);
      h = between(rand, 50, 86);
      if (rand() < 0.45) {
        const step = Math.round(w * (0.3 + rand() * 0.3));
        shapes.push(rect(x + w - step, H - h - between(rand, 10, 22), step, H));
      }
    } else if (kind < 0.53) {
      // Cheminée industrielle, légèrement effilée.
      w = between(rand, 7, 10);
      h = between(rand, 128, 168);
      shapes.push(`M${x} ${H}L${x + 1} ${H - h}h${w - 2}L${x + w} ${H}z`);
      x += w + between(rand, 10, 30);
      continue;
    } else {
      // Immeuble moyen.
      w = between(rand, 28, 78);
      h = between(rand, 38, 112);
    }
    w = Math.min(w, W - x);
    shapes.push(rect(x, H - h, w, H));
    // Rares fenêtres allumées, très petites (la distance les écrase).
    for (let wy = H - h + 6; wy < H - 20; wy += 7) {
      for (let wx = x + 4; wx < x + w - 4; wx += 6) {
        if (rand() > 0.955) windows.push(`M${wx} ${wy}h2v2h-2z`);
      }
    }
    x += w + between(rand, 0, 7);
  }

  // Deux grues de chantier : mât, flèche, contre-flèche, câble.
  for (const cx of cranes) {
    const top = 14 + between(rand, 0, 16);
    shapes.push(rect(cx, top, 4, H));
    shapes.push(rect(cx - 46, top, 168, 3));
    shapes.push(rect(cx - 2, top - 9, 8, 9));
    shapes.push(rect(cx - 44, top + 3, 14, 7));
    const hook = cx + between(rand, 60, 110);
    shapes.push(rect(hook, top + 3, 1, between(rand, 40, 80)));
  }

  return svg(W, H, shapes.join(""), "#111726", windows.join(""), 0.3);
}

// ─── Horizon proche : 1600 × 160 (rapport 10) ────────────────────────────────

export const NEAR = { width: 1600, height: 160 } as const;

function skylineNear(): string {
  const { width: W, height: H } = NEAR;
  const rand = seeded(42);
  const shapes: string[] = [];
  const windows: string[] = [];
  const waterTower = 980;
  let towerPlaced = false;

  let x = 0;
  while (x < W) {
    if (!towerPlaced && x >= waterTower) {
      towerPlaced = true;
      // Château d'eau : un fût, une cuve. Repère familier de la banlieue, aucun lieu précis.
      shapes.push(rect(x + 14, H - 96, 10, 96));
      shapes.push(`M${x} ${H - 96}l6 -26h26l6 26z`);
      shapes.push(rect(x + 2, H - 125, 34, 4));
      x += 46;
      continue;
    }
    const kind = rand();
    let w: number;
    if (kind < 0.28) {
      // Pavillon : murs bas, toit à deux pentes, parfois une cheminée ; une ou deux fenêtres.
      w = Math.min(between(rand, 38, 64), W - x);
      const wall = between(rand, 24, 38);
      const peak = between(rand, 12, 20);
      shapes.push(`M${x} ${H}V${H - wall}L${x + Math.round(w / 2)} ${H - wall - peak}L${x + w} ${H - wall}V${H}z`);
      if (rand() < 0.5) shapes.push(rect(x + Math.round(w * 0.68), H - wall - peak + 2, 5, 12));
      const count = rand() < 0.5 ? 1 : 2;
      for (let i = 0; i < count; i++) {
        if (rand() > 0.42) windows.push(`M${x + 8 + i * Math.round(w / 2)} ${H - wall + 8}h6v7h-6z`);
      }
    } else if (kind < 0.62) {
      // Immeuble : toit plat, acrotère, fenêtres en grille, parfois une cage d'escalier éclairée.
      w = Math.min(between(rand, 48, 104), W - x);
      const h = between(rand, 62, 132);
      shapes.push(rect(x, H - h, w, h));
      shapes.push(rect(x + 3, H - h - 3, w - 6, 3));
      const stair = rand() < 0.35 ? x + Math.round(w * (0.3 + rand() * 0.4)) : -1;
      if (stair > 0) windows.push(`M${stair} ${H - h + 10}h3v${h - 22}h-3z`);
      for (let wy = H - h + 8; wy < H - 10; wy += 10) {
        for (let wx = x + 6; wx < x + w - 6; wx += 9) {
          if (Math.abs(wx - stair) > 5 && rand() > 0.8) windows.push(`M${wx} ${wy}h4v5h-4z`);
        }
      }
    } else if (kind < 0.74) {
      // Entrepôt à toit en sheds (dents de scie).
      w = Math.min(between(rand, 96, 150), W - x);
      const h = between(rand, 30, 44);
      const teeth = Math.max(3, Math.round(w / 32));
      const tooth = Math.floor(w / teeth);
      let d = `M${x} ${H}V${H - h}`;
      for (let i = 0; i < teeth; i++) d += `l${tooth} -12v12`;
      d += `H${x + w}V${H}z`;
      shapes.push(d);
      if (rand() < 0.6) windows.push(`M${x + 10} ${H - 16}h${Math.min(28, w - 20)}v4h${-Math.min(28, w - 20)}z`);
    } else if (kind < 0.9) {
      // Arbres : tronc et houppier en deux arcs.
      w = Math.min(between(rand, 22, 34), W - x);
      const r = Math.round(w / 2);
      const top = H - between(rand, 34, 52);
      shapes.push(`M${x + r - 2} ${H}V${top + r}h4V${H}z`);
      shapes.push(`M${x} ${top + r}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${Math.round(r * 0.8)} 0 1 1 ${-2 * r} 0z`);
    } else {
      // Petit collectif.
      w = Math.min(between(rand, 34, 56), W - x);
      const h = between(rand, 44, 70);
      shapes.push(rect(x, H - h, w, h));
      for (let wy = H - h + 7; wy < H - 10; wy += 11) {
        if (rand() > 0.7) windows.push(`M${x + 7} ${wy}h${w - 14}v4h${-(w - 14)}z`);
      }
    }
    x += w + between(rand, 0, 5);
  }

  return svg(W, H, shapes.join(""), "#090c13", windows.join(""), 0.62);
}

function svg(width: number, height: number, buildings: string, fill: string, windows: string, windowOpacity: number) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<path fill="${fill}" d="${buildings}"/>` +
    `<path fill="#ffd27a" fill-opacity="${windowOpacity}" d="${windows}"/>` +
    `</svg>\n`
  );
}

// ─── Grain de bitume : PNG 128 × 128, gris + transparence ────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Buffer): number {
  let c = 0xffffffff;
  for (const byte of bytes) c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

export const GRAIN_SIZE = 128;

function grainPng(): Buffer {
  const size = GRAIN_SIZE;
  const rand = seeded(2026);
  // Grain de bitume : quelques grains clairs (gravillons) et sombres (creux), sur fond transparent.
  const alphaLevels = [70, 130, 190, 255];
  const raw = Buffer.alloc(size * (1 + size * 2));
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filtre « aucun »
    for (let x = 0; x < size; x++) {
      const r = rand();
      if (r < 0.2) {
        raw[offset++] = r < 0.085 ? 0 : 255;
        raw[offset++] = alphaLevels[Math.floor(rand() * alphaLevels.length)] ?? 255;
      } else {
        raw[offset++] = 0;
        raw[offset++] = 0;
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // 8 bits par canal
  header[9] = 4; // niveaux de gris + transparence
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9, memLevel: 9, strategy: 0 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Écriture ────────────────────────────────────────────────────────────────

function write(relative: string, content: string | Buffer, limit: number) {
  const file = join(ROOT, relative);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  const size = Buffer.byteLength(content);
  const status = size <= limit ? "ok" : `TROP LOURD (limite ${limit} octets)`;
  console.log(`${relative} : ${size} octets, ${status}`);
  if (size > limit) process.exitCode = 1;
}

write("public/scenes/skyline-far.svg", skylineFar(), 8 * 1024);
write("public/scenes/skyline-near.svg", skylineNear(), 8 * 1024);
write("public/textures/grain.png", grainPng(), 6 * 1024);
