/**
 * Outil de recette visuelle (docs/09, H.0-7).
 *
 *   node scripts/review-shots.mjs <route> [dossier] [--reduced] [--only=mobile|desktop]
 *
 * Capture la page en défilant (mobile 390 × 844 et ordinateur 1 440 × 900), construit une planche
 * contact PNG par format (<slug>-<format>-planche.png), signale le débordement horizontal et les
 * erreurs de la console. `--reduced` simule la préférence « moins d'animations ».
 * Dossier de sortie par défaut : <dossier temporaire du système>/rnb-review.
 * Serveur visé : http://localhost:3000, ou la variable d'environnement REVIEW_BASE_URL.
 * La planche est assemblée avec Python et Pillow (python3 -c …).
 */
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith("--"));
const route = positional[0] ?? "/";
const outDir = positional[1] ?? join(tmpdir(), "rnb-review");
const reduced = args.includes("--reduced");
const only = (args.find((arg) => arg.startsWith("--only=")) ?? "").slice("--only=".length);
const baseUrl = (process.env.REVIEW_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

mkdirSync(outDir, { recursive: true });
const slug = (route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "accueil") + (reduced ? "-reduit" : "");
const formats = [
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "desktop", width: 1440, height: 900, mobile: false },
].filter((format) => !only || format.name === only);

const SHEET = `
import sys
from PIL import Image
out, mobile, files = sys.argv[1], sys.argv[2] == "1", sys.argv[3:]
tw, th = (260, 563) if mobile else (576, 360)
cols = 6 if mobile else 3
ims = [Image.open(f).resize((tw, th)) for f in files]
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw + (cols - 1) * 6, rows * th + (rows - 1) * 6), (255, 0, 255))
for k, im in enumerate(ims):
    sheet.paste(im, ((k % cols) * (tw + 6), (k // cols) * (th + 6)))
sheet.save(out)
`;

const browser = await chromium.launch();
for (const format of formats) {
  const context = await browser.newContext({
    viewport: { width: format.width, height: format.height },
    deviceScaleFactor: 1,
    isMobile: format.mobile,
    hasTouch: format.mobile,
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 300)));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text().slice(0, 300));
  });

  const start = Date.now();
  await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
  const ttfb = Date.now() - start;
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1800);

  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.round(format.height * 0.8);
  const files = [];
  for (let y = 0, i = 0; y < total && i < 60; y += step, i++) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
    await page.waitForTimeout(700);
    const file = join(outDir, `${slug}-${format.name}-${String(i).padStart(2, "0")}.png`);
    await page.screenshot({ path: file });
    files.push(file);
  }

  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const scroll = document.documentElement.scrollWidth;
    return scroll > width + 1 ? `${scroll}>${width}` : null;
  });
  const sheet = join(outDir, `${slug}-${format.name}-planche.png`);
  execFileSync("python3", ["-c", SHEET, sheet, format.mobile ? "1" : "0", ...files]);

  console.log(
    `[${format.name}] ${route} hauteur=${total}px captures=${files.length} ttfb=${ttfb}ms ` +
      `débordement=${overflow ?? "aucun"} erreurs=${errors.length ? errors.join(" | ") : "aucune"}`,
  );
  console.log(`  planche : ${sheet}`);
  console.log(`  captures : ${files[0]} … ${files[files.length - 1]}`);
  await context.close();
}
await browser.close();
