import { describe, expect, it } from "vitest";
import { describeDevice } from "./device";

describe("nom des appareils connectés", () => {
  it("reconnaît les appareils courants", () => {
    expect(describeDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe("iPhone · Safari");
    expect(describeDevice("Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36")).toBe("Téléphone Android · Chrome");
    expect(describeDevice("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0")).toBe("Ordinateur Windows · Edge");
    expect(describeDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0")).toBe("Mac · Firefox");
  });

  it("reste lisible sans information", () => {
    expect(describeDevice(null)).toBe("Appareil inconnu");
    expect(describeDevice("curl/8")).toBe("Appareil");
  });
});
