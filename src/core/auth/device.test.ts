import { describe, expect, it } from "vitest";
import { describeDevice, deviceKind } from "./device";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const PIXEL = "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0";
const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0";
const LINUX = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

describe("nom des appareils connectés", () => {
  it("reconnaît les appareils courants", () => {
    expect(describeDevice(IPHONE)).toBe("iPhone · Safari");
    expect(describeDevice(PIXEL)).toBe("Téléphone Android · Chrome");
    expect(describeDevice(WINDOWS)).toBe("Ordinateur Windows · Edge");
    expect(describeDevice(MAC)).toBe("Mac · Firefox");
  });

  it("reste lisible sans information", () => {
    expect(describeDevice(null)).toBe("Appareil inconnu");
    expect(describeDevice("curl/8")).toBe("Appareil");
  });
});

describe("type des appareils connectés", () => {
  it("distingue téléphone, tablette et ordinateur", () => {
    expect(deviceKind(IPHONE)).toBe("phone");
    expect(deviceKind(PIXEL)).toBe("phone");
    expect(deviceKind(IPAD)).toBe("tablet");
    expect(deviceKind(ANDROID_TABLET)).toBe("tablet");
    expect(deviceKind(WINDOWS)).toBe("computer");
    expect(deviceKind(MAC)).toBe("computer");
    expect(deviceKind(LINUX)).toBe("computer");
  });

  it("reste prudent sans information", () => {
    expect(deviceKind(null)).toBe("unknown");
    expect(deviceKind("")).toBe("unknown");
    expect(deviceKind("curl/8")).toBe("unknown");
  });
});
