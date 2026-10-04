import { describe, expect, it } from "vitest";
import { cleanJpeg } from "./jpeg";
import { BASELINE_JPEG as BASELINE, jpegBytes as bytes, PROGRESSIVE_JPEG as PROGRESSIVE } from "./test-fixtures";

const contains = (data: Uint8Array, text: string) => Buffer.from(data).includes(Buffer.from(text, "latin1"));

describe("nettoyage des photos JPEG", () => {
  for (const [name, source] of [["classique", BASELINE], ["progressive", PROGRESSIVE]] as const) {
    it(`retire EXIF, GPS, commentaires et données cachées (${name})`, () => {
      const input = bytes(source);
      expect(contains(input, "Exif")).toBe(true);
      const result = cleanJpeg(input);
      expect(result).not.toBeNull();
      if (!result) return;
      expect([result.width, result.height]).toEqual([40, 24]);
      for (const secret of ["Exif", "ModeleSecret", "MarqueTelephone", "commentaire", "MPF"]) expect(contains(result.data, secret)).toBe(false);
      expect([result.data[0], result.data[1]]).toEqual([0xff, 0xd8]);
      expect([result.data[result.data.length - 2], result.data[result.data.length - 1]]).toEqual([0xff, 0xd9]);
      expect(result.data.length).toBeLessThan(input.length);
    });
  }

  it("refuse ce qui n'est pas une photo JPEG complète", () => {
    expect(cleanJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
    expect(cleanJpeg(bytes(BASELINE).subarray(0, 300))).toBeNull();
    expect(cleanJpeg(new Uint8Array(0))).toBeNull();
  });
});
