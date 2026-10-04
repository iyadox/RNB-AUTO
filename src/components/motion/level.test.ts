import { describe, expect, it } from "vitest";
import { MOTION_BOOT_SCRIPT, MOTION_STORAGE_KEY, detectMotionLevel, type MotionEnv } from "./level";

/** Exécute la chaîne du script d'en-tête dans un navigateur simulé et lit ce qu'il a posé. */
function runBootScript(env: MotionEnv, options: { storageThrows?: boolean; noMatchMedia?: boolean } = {}) {
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  const document = {
    documentElement: {
      classList: { add: (name: string) => classes.add(name) },
      setAttribute: (name: string, value: string) => attributes.set(name, value),
    },
  };
  const navigator: Record<string, unknown> = {};
  if (env.saveData) navigator.connection = { saveData: true };
  else navigator.connection = { saveData: false };
  if (env.deviceMemory !== null) navigator.deviceMemory = env.deviceMemory;
  if (env.cores !== null) navigator.hardwareConcurrency = env.cores;
  const localStorage = {
    getItem: (key: string) => {
      if (options.storageThrows) throw new Error("SecurityError");
      return key === MOTION_STORAGE_KEY ? env.stored : null;
    },
  };
  const window = {
    matchMedia: options.noMatchMedia
      ? undefined
      : (query: string) => ({ matches: query === "(prefers-reduced-motion: reduce)" && env.reducedMotion }),
  };
  new Function("window", "document", "navigator", "localStorage", MOTION_BOOT_SCRIPT)(window, document, navigator, localStorage);
  return { level: attributes.get("data-motion"), js: classes.has("js") };
}

const STORED = [null, "off", "full", "lite", "n'importe quoi"];
const BOOLS = [false, true];
const MEMORY = [null, 0, 0.5, 1, 2, 4, 8];
const CORES = [null, 0, 1, 2, 3, 4, 16];

describe("niveau de motion", () => {
  it("donne le même résultat en TypeScript et dans le script d'en-tête, pour toutes les combinaisons", () => {
    let combinations = 0;
    for (const stored of STORED)
      for (const reducedMotion of BOOLS)
        for (const saveData of BOOLS)
          for (const deviceMemory of MEMORY)
            for (const cores of CORES) {
              const env: MotionEnv = { stored, reducedMotion, saveData, deviceMemory, cores };
              const fromScript = runBootScript(env);
              expect(fromScript.level, JSON.stringify(env)).toBe(detectMotionLevel(env));
              expect(fromScript.js).toBe(true);
              combinations++;
            }
    expect(combinations).toBe(STORED.length * 4 * MEMORY.length * CORES.length);
  });

  it("applique les règles du cahier (C.3)", () => {
    const base: MotionEnv = { stored: null, reducedMotion: false, saveData: false, deviceMemory: 8, cores: 8 };
    expect(detectMotionLevel(base)).toBe("full");
    expect(detectMotionLevel({ ...base, reducedMotion: true })).toBe("off");
    expect(detectMotionLevel({ ...base, stored: "off" })).toBe("off");
    expect(detectMotionLevel({ ...base, saveData: true })).toBe("lite");
    expect(detectMotionLevel({ ...base, deviceMemory: 2 })).toBe("lite");
    expect(detectMotionLevel({ ...base, cores: 2 })).toBe("lite");
    // « Moins d'animations » l'emporte toujours sur un appareil modeste.
    expect(detectMotionLevel({ ...base, cores: 1, reducedMotion: true })).toBe("off");
    // Valeurs inconnues : niveau complet.
    expect(detectMotionLevel({ ...base, deviceMemory: null, cores: null })).toBe("full");
  });

  it("résiste à un stockage bloqué et à un navigateur sans matchMedia", () => {
    const env: MotionEnv = { stored: "off", reducedMotion: false, saveData: false, deviceMemory: null, cores: null };
    expect(runBootScript(env, { storageThrows: true }).level).toBe("full");
    expect(runBootScript({ ...env, stored: null }, { noMatchMedia: true }).level).toBe("full");
  });

  it("reste un petit script en ligne", () => {
    expect(MOTION_BOOT_SCRIPT.length).toBeLessThan(520);
    expect(MOTION_BOOT_SCRIPT).not.toContain("</script");
  });
});
